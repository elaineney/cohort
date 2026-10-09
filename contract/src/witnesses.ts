// SPDX-License-Identifier: Apache-2.0
//
// Off-chain witness providers for the cohort contract. Each provider reads a
// field from the caller's local wallet and hands it to the circuit without
// ever writing it to the public ledger.

import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger, PatientChart, Witnesses } from './managed/cohort/contract/index.js';

export type { PatientChart };

/** Everything a single wallet keeps locally. Chart and salt exist only for patients. */
export type WalletSecrets = {
  readonly secretKey: Uint8Array;
  readonly chart?: PatientChart;
  readonly salt?: Uint8Array;
};

type Env = WitnessContext<Ledger, WalletSecrets>;

const missing = (what: string): never => {
  const err = new Error(`wallet is missing ${what}`);
  err.name = 'MissingSecret';
  throw err;
};

export const makeWallet = (
  secretKey: Uint8Array,
  chart?: PatientChart,
  salt?: Uint8Array,
): WalletSecrets => ({ secretKey, chart, salt });

export const providers: Witnesses<WalletSecrets> = {
  chartPath(env: Env, leaf: Uint8Array) {
    const proofPath = env.ledger.patientRegistry.findPathForLeaf(leaf);
    return [env.privateState, proofPath ?? missing('a registry path for this chart (not accredited)')];
  },
  chartSalt(env: Env): [WalletSecrets, Uint8Array] {
    return [env.privateState, env.privateState.salt ?? missing('the chart salt')];
  },
  patientChart(env: Env): [WalletSecrets, PatientChart] {
    return [env.privateState, env.privateState.chart ?? missing('a patient chart')];
  },
  privateKey(env: Env): [WalletSecrets, Uint8Array] {
    return [env.privateState, env.privateState.secretKey];
  },
};
