// SPDX-License-Identifier: Apache-2.0

import type { PatientChart, TrialEligibility } from '../managed/cohort/contract/index.js';

export class CohortDomain {
  static satisfiesTrialCriteria(c: PatientChart, req: TrialEligibility): boolean {
    const bioOk = (req.minBiomarker === 0n || c.biomarkerLevel >= req.minBiomarker) &&
                  (req.maxBiomarker === 0n || c.biomarkerLevel <= req.maxBiomarker);
    const conditionOk = req.requiredCondition === 0n || c.conditionCode === req.requiredCondition;
    const ageOk = (req.minAge === 0n || c.ageYears >= req.minAge) &&
                  (req.maxAge === 0n || c.ageYears <= req.maxAge);
    const severityOk = c.stageSeverity >= req.minSeverity;
    const failOk = !req.requirePriorFail || c.priorTreatmentFail;
    const validOk = c.validTimestamp >= req.referenceTimestamp;

    return bioOk && conditionOk && ageOk && severityOk && failOk && validOk;
  }
}
