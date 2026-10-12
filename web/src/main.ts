import { chimes } from './audio';
import { fresh, preview, short } from './crypto';
import { ORDER, type StepId, type Walkthrough } from './state';
import { runDemo } from './chain';

const $ = <T extends Element>(sel: string, root: ParentNode = document) =>
  root.querySelector(sel) as T;

const walk: Walkthrough = {
  patientSecret: fresh(),
  salt: fresh(),
  trialId: fresh(),
  seed: fresh(),
  digests: {},
};

const numberOf = (id: string) => BigInt(Math.max(0, Math.trunc(Number($<HTMLInputElement>(id).value) || 0)));

// --- stepper -------------------------------------------------------------

const entries = Array.from(document.querySelectorAll<HTMLLIElement>('.entry'));

function setOpen(entry: HTMLLIElement, open: boolean) {
  entry.classList.toggle('is-open', open);
  $<HTMLButtonElement>('.entry-head', entry).setAttribute('aria-expanded', String(open));
}

for (const entry of entries) {
  $<HTMLButtonElement>('.entry-head', entry).addEventListener('click', () => {
    const open = !entry.classList.contains('is-open');
    setOpen(entry, open);
    chimes.fold(open);
  });
}
setOpen(entries[0], true);

const derive: Record<StepId, () => Promise<Uint8Array>> = {
  commit: async () => {
    const pk = await preview('patient', walk.patientSecret);
    return preview('chart', numberOf('#f-bio'), numberOf('#f-cond'), numberOf('#f-stage'), pk, walk.salt);
  },
  trial: () => preview('trial', walk.trialId, 250n, 500n, 704n, 2n),
  prove: async () => {
    const pk = await preview('patient', walk.patientSecret);
    return preview('receipt', walk.trialId, pk, walk.salt);
  },
  draw: () => preview('ticket', walk.seed, walk.digests.prove ?? new Uint8Array(32)),
  enrol: () => preview('enrolled', walk.digests.prove ?? new Uint8Array(32), 2n),
};

document.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const id = btn.dataset.act as StepId;
    const idx = ORDER.indexOf(id);
    chimes.tap();
    const digest = await derive[id]();
    walk.digests[id] = digest;
    const out = $<HTMLElement>(`[data-out="${id}"]`);
    out.textContent = short(digest);
    out.classList.add('is-fresh');
    const entry = entries[idx];
    entry.classList.add('is-done');
    $<HTMLElement>('[data-tag]', entry).textContent = 'recorded';
    chimes.settle();
    const next = entries[idx + 1];
    if (next) {
      setOpen(entry, false);
      setOpen(next, true);
    }
  });
});

// --- compiled contract run ---------------------------------------------

const runBtn = $<HTMLButtonElement>('#run-contract');
const runOut = $<HTMLPreElement>('#run-out');
const runState = $<HTMLElement>('#run-state');

function mark(label: string, tone: 'busy' | 'ok' | 'bad' | 'idle') {
  runState.textContent = label;
  runState.dataset.tone = tone;
}

function append(...parts: unknown[]) {
  const line = parts
    .map((p) => (typeof p === 'string' ? p : p instanceof Error ? p.message : String(p)))
    .join(' ');
  runOut.textContent += line + '\n';
  runOut.scrollTop = runOut.scrollHeight;
}

async function execute(): Promise<void> {
  runBtn.disabled = true;
  runOut.textContent = '';
  mark('running circuits', 'busy');
  try {
    await runDemo(append);
    mark('finished, all circuits accepted', 'ok');
    document.body.dataset.run = 'completed';
    chimes.resolve();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    append('error:', message);
    mark('stopped: ' + message, 'bad');
    document.body.dataset.run = 'rejected: ' + message;
    chimes.falter();
  } finally {
    runBtn.disabled = false;
  }
}

runBtn.addEventListener('click', () => {
  chimes.tap();
  void execute();
});

if (location.hash === '#autorun') void execute();
