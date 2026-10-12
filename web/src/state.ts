// Page-local walkthrough state. Lives only in this tab.

export type StepId = 'commit' | 'trial' | 'prove' | 'draw' | 'enrol';

export const ORDER: readonly StepId[] = ['commit', 'trial', 'prove', 'draw', 'enrol'];

export interface Walkthrough {
  patientSecret: Uint8Array;
  salt: Uint8Array;
  trialId: Uint8Array;
  seed: Uint8Array;
  digests: Partial<Record<StepId, Uint8Array>>;
}
