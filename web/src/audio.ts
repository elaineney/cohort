// Soft sine chimes. A single AudioContext is created lazily inside the
// closure on first user gesture; callers only see the returned functions.

type Note = { hz: number; at: number; len: number; level: number };

const createChimes = () => {
  let ctx: AudioContext | null = null;
  let bus: GainNode | null = null;

  const ready = (): AudioContext | null => {
    if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
    if (!ctx) {
      ctx = new AudioContext();
      bus = ctx.createGain();
      bus.gain.value = 0.18;
      bus.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  };

  const ring = (notes: Note[]) => {
    const ac = ready();
    if (!ac || !bus) return;
    const t0 = ac.currentTime + 0.01;
    for (const n of notes) {
      const osc = ac.createOscillator();
      const env = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.hz, t0 + n.at);
      env.gain.setValueAtTime(0, t0 + n.at);
      env.gain.linearRampToValueAtTime(n.level, t0 + n.at + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.len);
      osc.connect(env).connect(bus);
      osc.start(t0 + n.at);
      osc.stop(t0 + n.at + n.len + 0.05);
    }
  };

  return {
    tap: () => ring([{ hz: 880, at: 0, len: 0.18, level: 0.5 }]),
    fold: (open: boolean) =>
      ring([{ hz: open ? 587.33 : 493.88, at: 0, len: 0.25, level: 0.4 }]),
    settle: () =>
      ring([
        { hz: 659.25, at: 0, len: 0.6, level: 0.45 },
        { hz: 987.77, at: 0.09, len: 0.8, level: 0.3 },
      ]),
    resolve: () =>
      ring([
        { hz: 523.25, at: 0, len: 0.9, level: 0.4 },
        { hz: 659.25, at: 0.12, len: 0.9, level: 0.35 },
        { hz: 783.99, at: 0.24, len: 1.2, level: 0.3 },
      ]),
    falter: () =>
      ring([
        { hz: 392, at: 0, len: 0.5, level: 0.4 },
        { hz: 349.23, at: 0.14, len: 0.7, level: 0.35 },
      ]),
  };
};

export const chimes = createChimes();
