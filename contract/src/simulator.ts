// SPDX-License-Identifier: Apache-2.0
//
// In-process bench for the cohort contract. One CohortBench holds the public
// ledger state; each Seat is a wallet (sponsor, hospital or patient) that
// submits circuit calls against it with its own private secrets.

import {
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
  type CircuitContext,
  type CircuitResults,
} from '@midnight-ntwrk/compact-runtime';
import {
  Contract,
  ledger as decodeLedger,
  type Ledger,
  type PatientChart,
  type TrialEligibility,
  type Witnesses,
} from './managed/cohort/contract/index.js';
import { makeWallet, providers, type WalletSecrets } from './witnesses.js';

type OnChain = Parameters<typeof createCircuitContext<WalletSecrets>>[0]['contractState'];
type Invoke<T> = (
  program: Contract<WalletSecrets>,
  context: CircuitContext<WalletSecrets>,
) => Promise<CircuitResults<WalletSecrets, T>>;

const ZERO_COIN = ''.padEnd(64, '0');

export type WitnessTrace = { readonly name: string; readonly output: unknown };

export class CohortBench {
  readonly address = sampleContractAddress();
  readonly trace: WitnessTrace[] = [];
  state: OnChain;

  private constructor(initial: OnChain) {
    this.state = initial;
  }

  static async deploy(sponsorSecret: Uint8Array): Promise<CohortBench> {
    const genesis = await new Contract<WalletSecrets>(providers).initialState(
      createConstructorContext<WalletSecrets>(makeWallet(sponsorSecret), ZERO_COIN),
    );
    return new CohortBench(genesis.currentContractState.data);
  }

  join(secretKey: Uint8Array, chart?: PatientChart, salt?: Uint8Array): Seat {
    return new Seat(this, makeWallet(secretKey, chart, salt));
  }

  read(): Ledger {
    return decodeLedger(this.state as Parameters<typeof decodeLedger>[0]);
  }

  async submit<T>(seat: Seat, circuitId: string, invoke: Invoke<T>): Promise<T> {
    const outcome = await invoke(
      this.tracedProgram(),
      createCircuitContext<WalletSecrets>({
        circuitId,
        contractAddress: this.address,
        coinPublicKeyOrZswapState: ZERO_COIN,
        contractState: this.state,
        privateState: seat.wallet,
      }),
    );
    const { currentQueryContext, currentPrivateState } = outcome.context.callContext;
    this.state = currentQueryContext.state;
    if (currentPrivateState !== undefined) seat.wallet = currentPrivateState;
    return outcome.result;
  }

  // Wraps every provider so the bench records what each witness returned.
  private tracedProgram(): Contract<WalletSecrets> {
    const traced: Record<string, unknown> = {};
    for (const [name, provider] of Object.entries(providers)) {
      traced[name] = (...args: unknown[]) => {
        const pair = (provider as (...a: unknown[]) => [WalletSecrets, unknown])(...args);
        this.trace.push({ name, output: pair[1] });
        return pair;
      };
    }
    return new Contract<WalletSecrets>(traced as unknown as Witnesses<WalletSecrets>);
  }
}

export class Seat {
  constructor(
    private readonly bench: CohortBench,
    public wallet: WalletSecrets,
  ) {}

  createTrial = (trialId: Uint8Array, criteria: TrialEligibility) =>
    this.bench.submit(this, 'createTrial', (p, cx) => p.impureCircuits.createTrial(cx, trialId, criteria));

  registerHospital = (hospitalPublic: Uint8Array) =>
    this.bench.submit(this, 'registerHospital', (p, cx) => p.impureCircuits.registerHospital(cx, hospitalPublic));

  registerPatientChart = (commitment: Uint8Array) =>
    this.bench.submit(this, 'registerPatientChart', (p, cx) => p.impureCircuits.registerPatientChart(cx, commitment));

  applyForTrial = (trialId: Uint8Array) =>
    this.bench.submit(this, 'applyForTrial', (p, cx) => p.impureCircuits.applyForTrial(cx, trialId));

  closeRecruitment = (trialId: Uint8Array, entropySeed: Uint8Array) =>
    this.bench.submit(this, 'closeRecruitment', (p, cx) => p.impureCircuits.closeRecruitment(cx, trialId, entropySeed));

  generateCohortDrawTicket = (trialId: Uint8Array) =>
    this.bench.submit(this, 'generateCohortDrawTicket', (p, cx) => p.impureCircuits.generateCohortDrawTicket(cx, trialId));

  acceptCandidate = (trialId: Uint8Array, receipt: Uint8Array) =>
    this.bench.submit(this, 'acceptCandidate', (p, cx) => p.impureCircuits.acceptCandidate(cx, trialId, receipt));

  confirmParticipation = (trialId: Uint8Array) =>
    this.bench.submit(this, 'confirmParticipation', (p, cx) => p.impureCircuits.confirmParticipation(cx, trialId));
}
