import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum TrialStatus { enrolling = 0, active = 1, completed = 2, closed = 3 }

export enum CandidateStatus { pending = 0, accepted = 1, confirmed = 2 }

export type PatientChart = { biomarkerLevel: bigint;
                             conditionCode: bigint;
                             ageYears: bigint;
                             stageSeverity: bigint;
                             priorTreatmentFail: boolean;
                             validTimestamp: bigint
                           };

export type TrialEligibility = { minBiomarker: bigint;
                                 maxBiomarker: bigint;
                                 requiredCondition: bigint;
                                 minAge: bigint;
                                 maxAge: bigint;
                                 minSeverity: bigint;
                                 requirePriorFail: boolean;
                                 referenceTimestamp: bigint
                               };

export type Witnesses<PS> = {
  privateKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  patientChart(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, PatientChart];
  chartSalt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  chartPath(context: __compactRuntime.WitnessContext<Ledger, PS>,
            commitment_0: Uint8Array): [PS, { leaf: Uint8Array,
                                              path: { sibling: { field: bigint },
                                                      goes_left: boolean
                                                    }[]
                                            }];
}

export type ImpureCircuits<PS> = {
  registerHospital(context: __compactRuntime.CircuitContext<PS>,
                   hospitalPublic_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  registerPatientChart(context: __compactRuntime.CircuitContext<PS>,
                       commitment_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  createTrial(context: __compactRuntime.CircuitContext<PS>,
              trialId_0: Uint8Array,
              criteria_0: TrialEligibility): Promise<__compactRuntime.CircuitResults<PS, []>>;
  applyForTrial(context: __compactRuntime.CircuitContext<PS>,
                trialId_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  closeRecruitment(context: __compactRuntime.CircuitContext<PS>,
                   trialId_0: Uint8Array,
                   entropySeed_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  generateCohortDrawTicket(context: __compactRuntime.CircuitContext<PS>,
                           trialId_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  acceptCandidate(context: __compactRuntime.CircuitContext<PS>,
                  trialId_0: Uint8Array,
                  receipt_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  confirmParticipation(context: __compactRuntime.CircuitContext<PS>,
                       trialId_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
}

export type ProvableCircuits<PS> = {
  registerHospital(context: __compactRuntime.CircuitContext<PS>,
                   hospitalPublic_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  registerPatientChart(context: __compactRuntime.CircuitContext<PS>,
                       commitment_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  createTrial(context: __compactRuntime.CircuitContext<PS>,
              trialId_0: Uint8Array,
              criteria_0: TrialEligibility): Promise<__compactRuntime.CircuitResults<PS, []>>;
  applyForTrial(context: __compactRuntime.CircuitContext<PS>,
                trialId_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  closeRecruitment(context: __compactRuntime.CircuitContext<PS>,
                   trialId_0: Uint8Array,
                   entropySeed_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  generateCohortDrawTicket(context: __compactRuntime.CircuitContext<PS>,
                           trialId_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  acceptCandidate(context: __compactRuntime.CircuitContext<PS>,
                  trialId_0: Uint8Array,
                  receipt_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  confirmParticipation(context: __compactRuntime.CircuitContext<PS>,
                       trialId_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
}

export type PureCircuits = {
  sponsorKey(sk_0: Uint8Array): Uint8Array;
  hospitalKey(sk_0: Uint8Array): Uint8Array;
  patientKey(sk_0: Uint8Array): Uint8Array;
  enrollmentReceipt(sk_0: Uint8Array, trialId_0: Uint8Array): Uint8Array;
  cohortDrawTicket(seed_0: Uint8Array, receipt_0: Uint8Array): Uint8Array;
  chartCommitment(c_0: PatientChart, patient_0: Uint8Array, salt_0: Uint8Array): Uint8Array;
  satisfiesTrialCriteria(c_0: PatientChart, req_0: TrialEligibility): boolean;
}

export type Circuits<PS> = {
  sponsorKey(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  hospitalKey(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  patientKey(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  enrollmentReceipt(context: __compactRuntime.CircuitContext<PS>,
                    sk_0: Uint8Array,
                    trialId_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  cohortDrawTicket(context: __compactRuntime.CircuitContext<PS>,
                   seed_0: Uint8Array,
                   receipt_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  chartCommitment(context: __compactRuntime.CircuitContext<PS>,
                  c_0: PatientChart,
                  patient_0: Uint8Array,
                  salt_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  satisfiesTrialCriteria(context: __compactRuntime.CircuitContext<PS>,
                         c_0: PatientChart,
                         req_0: TrialEligibility): Promise<__compactRuntime.CircuitResults<PS, boolean>>;
  registerHospital(context: __compactRuntime.CircuitContext<PS>,
                   hospitalPublic_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  registerPatientChart(context: __compactRuntime.CircuitContext<PS>,
                       commitment_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  createTrial(context: __compactRuntime.CircuitContext<PS>,
              trialId_0: Uint8Array,
              criteria_0: TrialEligibility): Promise<__compactRuntime.CircuitResults<PS, []>>;
  applyForTrial(context: __compactRuntime.CircuitContext<PS>,
                trialId_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  closeRecruitment(context: __compactRuntime.CircuitContext<PS>,
                   trialId_0: Uint8Array,
                   entropySeed_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  generateCohortDrawTicket(context: __compactRuntime.CircuitContext<PS>,
                           trialId_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  acceptCandidate(context: __compactRuntime.CircuitContext<PS>,
                  trialId_0: Uint8Array,
                  receipt_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  confirmParticipation(context: __compactRuntime.CircuitContext<PS>,
                       trialId_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
}

export type Ledger = {
  readonly sponsor: Uint8Array;
  accreditedHospitals: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  patientRegistry: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined;
    history(): Iterator<__compactRuntime.MerkleTreeDigest>
  };
  readonly chartCount: bigint;
  trials: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): TrialEligibility;
    [Symbol.iterator](): Iterator<[Uint8Array, TrialEligibility]>
  };
  enrollments: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): {
      isEmpty(): boolean;
      size(): bigint;
      member(key_1: Uint8Array): boolean;
      lookup(key_1: Uint8Array): CandidateStatus;
      [Symbol.iterator](): Iterator<[Uint8Array, CandidateStatus]>
    }
  };
  candidateCount: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { read(): bigint }
  };
  acceptedCount: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { read(): bigint }
  };
  trialEntropySeed: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
}

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): Promise<__compactRuntime.ConstructorResult<PS>>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
export declare const expectedVk: Record<string, string>;
export declare const circuitSignatures: __compactRuntime.CircuitSignatures;
export declare const declaredInterfaces: __compactRuntime.DeclaredInterfaces;
