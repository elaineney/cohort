// Reading-along digests for the stepper.
//
// Honesty note: these are UI previews computed with WebCrypto SHA-256 so the
// page can react instantly. They are NOT the contract's persistentHash and
// will not match ledger values. The authoritative run lives in chain.ts.

type Part = Uint8Array | bigint | number | string;

const enc = new TextEncoder();

export const hex = (b: Uint8Array): string =>
  b.reduce((s, x) => s + x.toString(16).padStart(2, '0'), '');

export const fresh = (n = 32): Uint8Array => crypto.getRandomValues(new Uint8Array(n));

const asBytes = (p: Part): Uint8Array => {
  if (p instanceof Uint8Array) return p;
  if (typeof p === 'string') return enc.encode(p);
  const word = new Uint8Array(8);
  new DataView(word.buffer).setBigUint64(0, BigInt(p));
  return word;
};

/** Tagged preview digest: SHA-256(tag || parts...). */
export async function preview(tag: string, ...parts: Part[]): Promise<Uint8Array> {
  const chunks = [enc.encode(`cohort/${tag}`), ...parts.map(asBytes)];
  const buf = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  chunks.reduce((at, c) => (buf.set(c, at), at + c.length), 0);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
}

export const short = (b: Uint8Array): string => {
  const h = hex(b);
  return `${h.slice(0, 16)}...${h.slice(-8)}`;
};
