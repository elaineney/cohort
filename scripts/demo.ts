// SPDX-License-Identifier: Apache-2.0

import {
  CandidateStatus,
  pureCircuits,
  type PatientChart,
  type TrialEligibility,
} from '../contract/src/managed/cohort/contract/index.js';
import { CohortBench } from '../contract/src/simulator.js';

function randomBytes(length: number = 32): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function runDemo() {
  console.log('------------------------------------------------------------');
  console.log('COHORT: Private Clinical Trial Recruitment Protocol');
  console.log('Zero chart disclosure, verifiable biomarker eligibility.');
  console.log('------------------------------------------------------------\n');

  const sponsorSecret = randomBytes(32);
  const ledger = await CohortBench.deploy(sponsorSecret);
  console.log('[1/5] Contract deployed by Trial Sponsor:', toHex(ledger.read().sponsor));

  // Sponsor registers accredited hospital network
  const hospitalSecret = randomBytes(32);
  const hospitalPub = pureCircuits.hospitalKey(hospitalSecret);
  const sponsor = ledger.join(sponsorSecret);
  await sponsor.registerHospital(hospitalPub);
  console.log('      Accredited Medical Center Registered:', toHex(hospitalPub));

  // Trial eligibility requirements
  const trialId = randomBytes(32);
  const criteria: TrialEligibility = {
    minBiomarker: 250n,       // e.g. target protein expression >= 250 pg/mL
    maxBiomarker: 600n,       // <= 600 pg/mL
    requiredCondition: 704n,  // Oncology condition protocol ID
    minAge: 18n,
    maxAge: 65n,
    minSeverity: 2n,          // Stage 2+
    requirePriorFail: true,   // Requires first-line therapy resistance
    referenceTimestamp: 1000n,
  };

  await sponsor.createTrial(trialId, criteria);
  console.log('\n[2/5] Clinical Trial created with confidential inclusion criteria.');
  console.log('      Trial ID:', toHex(trialId));

  // Hospital certifies patient record
  const patientSecret = randomBytes(32);
  const patientPub = pureCircuits.patientKey(patientSecret);
  const chart: PatientChart = {
    biomarkerLevel: 320n,
    conditionCode: 704n,
    ageYears: 48n,
    stageSeverity: 3n,
    priorTreatmentFail: true,
    validTimestamp: 10_000n,
  };
  const salt = randomBytes(32);
  const chartCommitment = pureCircuits.chartCommitment(chart, patientPub, salt);

  const hospital = ledger.join(hospitalSecret);
  await hospital.registerPatientChart(chartCommitment);
  console.log('\n[3/5] Hospital registered accredited patient commitment in Historic Merkle Tree:');
  console.log('      * Merkle Leaf:', toHex(chartCommitment));
  console.log('      * Patient Identity: [HIDDEN]');
  console.log('      * Health Record:    [SEALED IN LOCAL WALLET]');

  // Patient proves eligibility without revealing chart
  const patient = ledger.join(patientSecret, chart, salt);
  const receipt = await patient.applyForTrial(trialId);
  console.log('\n[4/5] Patient generated ZK Proof of Inclusion & Biomarker Compliance:');
  console.log('      * Proof Verified on Ledger: YES');
  console.log('      * Candidate Anonymous Receipt:', toHex(receipt));

  // Sponsor closes recruitment and patient generates blind draw ticket
  const entropySeed = randomBytes(32);
  await sponsor.closeRecruitment(trialId, entropySeed);
  const drawTicket = await patient.generateCohortDrawTicket(trialId);
  console.log('      * Verifiable Blind Draw Ticket:', toHex(drawTicket));

  // Sponsor accepts and patient confirms
  await sponsor.acceptCandidate(trialId, receipt);
  await patient.confirmParticipation(trialId);

  const status = ledger.read().enrollments.lookup(trialId).lookup(receipt);
  console.log('\n[5/5] Trial enrollment complete with 100% zero medical data exposure.');
  console.log('      * Final Participant Status:', CandidateStatus[status]);
  console.log('------------------------------------------------------------');
}

runDemo().catch((err) => {
  console.error('Cohort demo failed:', err);
  process.exit(1);
});
