// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from 'vitest';
import {
  CandidateStatus,
  pureCircuits,
  type PatientChart,
  type TrialEligibility,
} from '../../contract/src/managed/cohort/contract/index.js';
import { CohortBench } from '../../contract/src/simulator.js';
import { CohortDomain } from '../../contract/src/domain/cohort.js';

function randomBytes(length: number = 32): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function makeChart(
  biomarkerLevel: bigint = 350n,
  conditionCode: bigint = 801n,
  ageYears: bigint = 45n,
  stageSeverity: bigint = 3n,
  priorTreatmentFail: boolean = true,
  validTimestamp: bigint = 10_000n,
): PatientChart {
  return {
    biomarkerLevel,
    conditionCode,
    ageYears,
    stageSeverity,
    priorTreatmentFail,
    validTimestamp,
  };
}

function makeTrial(
  minBiomarker: bigint = 200n,
  maxBiomarker: bigint = 500n,
  requiredCondition: bigint = 801n,
  minAge: bigint = 18n,
  maxAge: bigint = 65n,
  minSeverity: bigint = 2n,
  requirePriorFail: boolean = true,
  referenceTimestamp: bigint = 5_000n,
): TrialEligibility {
  return {
    minBiomarker,
    maxBiomarker,
    requiredCondition,
    minAge,
    maxAge,
    minSeverity,
    requirePriorFail,
    referenceTimestamp,
  };
}

describe('Cohort Clinical Trial Recruitment Execution', () => {
  describe('Pure Circuits & Zero-Knowledge Verification', () => {
    it('generates domain-separated distinct identities for sponsor, hospital, and patient', () => {
      const sk = randomBytes(32);
      const sKey = pureCircuits.sponsorKey(sk);
      const hKey = pureCircuits.hospitalKey(sk);
      const pKey = pureCircuits.patientKey(sk);

      expect(sKey).toHaveLength(32);
      expect(hKey).toHaveLength(32);
      expect(pKey).toHaveLength(32);

      const set = new Set([
        Buffer.from(sKey).toString('hex'),
        Buffer.from(hKey).toString('hex'),
        Buffer.from(pKey).toString('hex'),
      ]);
      expect(set.size).toBe(3);
    });

    it('matches TypeScript domain check against compiled pure circuit satisfiesTrialCriteria', () => {
      const criteria = makeTrial();
      const goodChart = makeChart();
      const lowBioChart = makeChart(150n); // < 200 min
      const wrongCondition = makeChart(350n, 999n);
      const lowSeverity = makeChart(350n, 801n, 45n, 1n); // stage 1 < min 2

      expect(pureCircuits.satisfiesTrialCriteria(goodChart, criteria)).toBe(true);
      expect(pureCircuits.satisfiesTrialCriteria(lowBioChart, criteria)).toBe(false);
      expect(pureCircuits.satisfiesTrialCriteria(wrongCondition, criteria)).toBe(false);
      expect(pureCircuits.satisfiesTrialCriteria(lowSeverity, criteria)).toBe(false);

      expect(pureCircuits.satisfiesTrialCriteria(goodChart, criteria)).toBe(
        CohortDomain.satisfiesTrialCriteria(goodChart, criteria),
      );
      expect(pureCircuits.satisfiesTrialCriteria(lowBioChart, criteria)).toBe(
        CohortDomain.satisfiesTrialCriteria(lowBioChart, criteria),
      );
    });
  });

  describe('Contract Lifecycle & Merkle Inclusion Proofs', () => {
    async function setupTrial() {
      const sponsorSk = randomBytes(32);
      const ledger = await CohortBench.deploy(sponsorSk);

      const hospitalSk = randomBytes(32);
      const hospitalPub = pureCircuits.hospitalKey(hospitalSk);

      const sponsor = ledger.join(sponsorSk);
      await sponsor.registerHospital(hospitalPub);

      const trialId = randomBytes(32);
      await sponsor.createTrial(trialId, makeTrial());

      return {
        sponsorSk,
        hospitalSk,
        hospitalPub,
        trialId,
        ledger,
      };
    }

    it('deploys contract and sets sponsor in sealed state', async () => {
      const sponsorSk = randomBytes(32);
      const ledger = await CohortBench.deploy(sponsorSk);
      const state = ledger.read();

      expect(state.sponsor).toEqual(pureCircuits.sponsorKey(sponsorSk));
      expect(state.chartCount).toBe(0n);
    });

    it('allows sponsor to register accredited hospitals and blocks impostors', async () => {
      const { ledger, hospitalPub } = await setupTrial();
      const state = ledger.read();
      expect(state.accreditedHospitals.member(hospitalPub)).toBe(true);

      const impostor = ledger.join(randomBytes(32));
      await expect(
        impostor.registerHospital(randomBytes(32)),
      ).rejects.toThrow('Only sponsor can register accredited hospitals');
    });

    it('registers accredited patient chart commitment via certified hospital', async () => {
      const { ledger, hospitalSk } = await setupTrial();

      const patientSk = randomBytes(32);
      const chart = makeChart();
      const salt = randomBytes(32);
      const commitment = pureCircuits.chartCommitment(
        chart,
        pureCircuits.patientKey(patientSk),
        salt,
      );

      const hospital = ledger.join(hospitalSk);
      await hospital.registerPatientChart(commitment);

      const state = ledger.read();
      expect(state.chartCount).toBe(1n);
    });

    it('rejects chart registration by unauthorized actor', async () => {
      const { ledger } = await setupTrial();
      const strangerSk = randomBytes(32);
      const commitment = randomBytes(32);

      const stranger = ledger.join(strangerSk);
      await expect(stranger.registerPatientChart(commitment)).rejects.toThrow(
        'Only accredited hospital or sponsor can register charts',
      );
    });

    it('allows eligible patient to apply for trial with ZK proof of inclusion and biomarkers', async () => {
      const { ledger, hospitalSk, trialId } = await setupTrial();

      const patientSk = randomBytes(32);
      const chart = makeChart();
      const salt = randomBytes(32);
      const commitment = pureCircuits.chartCommitment(
        chart,
        pureCircuits.patientKey(patientSk),
        salt,
      );

      const hospital = ledger.join(hospitalSk);
      await hospital.registerPatientChart(commitment);

      const patient = ledger.join(patientSk, chart, salt);
      const receipt = await patient.applyForTrial(trialId);
      expect(receipt).toHaveLength(32);

      const state = ledger.read();
      expect(state.candidateCount.lookup(trialId).read()).toBe(1n);
      expect(state.enrollments.lookup(trialId).lookup(receipt)).toBe(CandidateStatus.pending);
    });

    it('rejects patient who does not meet biomarker criteria', async () => {
      const { ledger, hospitalSk, trialId } = await setupTrial();

      const patientSk = randomBytes(32);
      const ineligibleChart = makeChart(100n); // biomarker too low (100 < 200 min)
      const salt = randomBytes(32);
      const commitment = pureCircuits.chartCommitment(
        ineligibleChart,
        pureCircuits.patientKey(patientSk),
        salt,
      );

      const hospital = ledger.join(hospitalSk);
      await hospital.registerPatientChart(commitment);

      const patient = ledger.join(patientSk, ineligibleChart, salt);
      await expect(patient.applyForTrial(trialId)).rejects.toThrow(
        'Patient does not meet clinical biomarker criteria',
      );
    });

    it('completes review and confirmation workflow with anonymous receipts and blind draw ticket', async () => {
      const { ledger, sponsorSk, hospitalSk, trialId } = await setupTrial();

      const patientSk = randomBytes(32);
      const chart = makeChart();
      const salt = randomBytes(32);
      const commitment = pureCircuits.chartCommitment(
        chart,
        pureCircuits.patientKey(patientSk),
        salt,
      );

      const hospital = ledger.join(hospitalSk);
      await hospital.registerPatientChart(commitment);

      const patient = ledger.join(patientSk, chart, salt);
      const receipt = await patient.applyForTrial(trialId);

      const sponsor = ledger.join(sponsorSk);
      // Sponsor closes recruitment with verifiable entropy seed
      const seed = randomBytes(32);
      await sponsor.closeRecruitment(trialId, seed);

      // Patient generates deterministic cohort draw ticket
      const ticket = await patient.generateCohortDrawTicket(trialId);
      expect(ticket).toHaveLength(32);

      // Sponsor reviews and accepts candidate receipt
      await sponsor.acceptCandidate(trialId, receipt);

      // Patient confirms participation
      const confirmedReceipt = await patient.confirmParticipation(trialId);
      expect(confirmedReceipt).toEqual(receipt);

      const state = ledger.read();
      expect(state.enrollments.lookup(trialId).lookup(receipt)).toBe(CandidateStatus.confirmed);
    });

    it('enforces zero medical disclosures: raw chart data never appears on ledger', async () => {
      const { ledger, hospitalSk, trialId } = await setupTrial();

      const patientSk = randomBytes(32);
      const chart = makeChart(350n, 801n, 45n, 3n, true, 10_000n);
      const salt = randomBytes(32);
      const commitment = pureCircuits.chartCommitment(
        chart,
        pureCircuits.patientKey(patientSk),
        salt,
      );

      const hospital = ledger.join(hospitalSk);
      await hospital.registerPatientChart(commitment);

      const patient = ledger.join(patientSk, chart, salt);
      await patient.applyForTrial(trialId);

      const stateDump = JSON.stringify(ledger.read(), (k, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      );

      // Verify medical chart values remain 100% hidden
      expect(stateDump).not.toContain('350');
      expect(stateDump).not.toContain('801');
    });
  });
});
