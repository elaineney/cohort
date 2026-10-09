// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from 'vitest';
import { CohortDomain } from '../../contract/src/domain/cohort.js';
import type { PatientChart, TrialEligibility } from '../../contract/src/managed/cohort/contract/index.js';

describe('Cohort Domain Unit Tests', () => {
  const defaultReq: TrialEligibility = {
    minBiomarker: 200n,
    maxBiomarker: 600n,
    requiredCondition: 104n,
    minAge: 21n,
    maxAge: 70n,
    minSeverity: 2n,
    requirePriorFail: false,
    referenceTimestamp: 1000n,
  };

  const eligibleChart: PatientChart = {
    biomarkerLevel: 350n,
    conditionCode: 104n,
    ageYears: 42n,
    stageSeverity: 2n,
    priorTreatmentFail: false,
    validTimestamp: 2000n,
  };

  it('validates biomarker within range', () => {
    expect(CohortDomain.satisfiesTrialCriteria(eligibleChart, defaultReq)).toBe(true);

    const lowBio = { ...eligibleChart, biomarkerLevel: 150n };
    expect(CohortDomain.satisfiesTrialCriteria(lowBio, defaultReq)).toBe(false);

    const highBio = { ...eligibleChart, biomarkerLevel: 750n };
    expect(CohortDomain.satisfiesTrialCriteria(highBio, defaultReq)).toBe(false);
  });

  it('validates condition code and stage severity', () => {
    const wrongCondition = { ...eligibleChart, conditionCode: 999n };
    expect(CohortDomain.satisfiesTrialCriteria(wrongCondition, defaultReq)).toBe(false);

    const lowSeverity = { ...eligibleChart, stageSeverity: 1n };
    expect(CohortDomain.satisfiesTrialCriteria(lowSeverity, defaultReq)).toBe(false);
  });
});
