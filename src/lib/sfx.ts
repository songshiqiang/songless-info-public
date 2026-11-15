// Short feedback sounds, synthesized with the Web Audio API so there are no
// audio files to load. Muting is remembered per browser.
import { load, save } from './storage';

const MUTE_KEY = 'songless:muted';
let ctx: AudioContext | null = null;
let muted: boolean | null = null;

export function isMuted(): boolean {
  if (muted === null) muted = load(MUTE_KEY, false);
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  save(MUTE_KEY, value);
}

type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number };

function play(notes: Note[]) {
  if (isMuted()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = n.type ?? 'sine';
      osc.frequency.value = n.freq;
      const start = now + n.at;
      const peak = n.gain ?? 0.18;
      amp.gain.setValueAtTime(0, start);
      amp.gain.linearRampToValueAtTime(peak, start + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
      osc.connect(amp).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + n.dur + 0.02);
    }
  } catch {
    // No Web Audio support: stay silent.
  }
}

export const sfx = {
  /** Rising major arpeggio. */
  right: () =>
    play([
      { freq: 523.25, at: 0, dur: 0.18 },
      { freq: 659.25, at: 0.09, dur: 0.18 },
      { freq: 783.99, at: 0.18, dur: 0.35 }
    ]),
  /** Two low descending buzzes. */
  wrong: () =>
    play([
      { freq: 220, at: 0, dur: 0.16, type: 'square', gain: 0.07 },
      { freq: 164.81, at: 0.14, dur: 0.26, type: 'square', gain: 0.07 }
    ]),
  /** Soft tick. */
  skip: () => play([{ freq: 880, at: 0, dur: 0.08, type: 'triangle', gain: 0.1 }]),
  /** Out of guesses: slow falling tones. */
  miss: () =>
    play([
      { freq: 392, at: 0, dur: 0.25, type: 'triangle', gain: 0.14 },
      { freq: 311.13, at: 0.22, dur: 0.25, type: 'triangle', gain: 0.14 },
      { freq: 261.63, at: 0.44, dur: 0.5, type: 'triangle', gain: 0.14 }
    ])
};

/** Plays the sound for the attempt just added to a rung. */
export function feedback(attempts: { kind: string }[], maxAttempts: number) {
  const last = attempts[attempts.length - 1];
  if (!last) return;
  if (last.kind === 'right') sfx.right();
  else if (attempts.length >= maxAttempts) sfx.miss();
  else if (last.kind === 'wrong') sfx.wrong();
  else sfx.skip();
}
