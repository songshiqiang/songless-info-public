// Songless Unlimited leaderboard: the rules both the page and the Worker use to
// check a saved run, plus the page's calls to /api/leaderboard.

import { POINTS } from './game';

export const NAME_MAX = 20;
/** Rows the leaderboard shows. */
export const BOARD_SIZE = 100;
/** A total higher than this is not believable. Songs repeat, so it can pass the size of the answer pool. */
export const MAX_CORRECT = 100000;
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 72;
/** Optional avatars a player can pick. "" means no avatar (the board shows their initial). */
export const AVATARS = [
  '🎧', '🎤', '🎸', '🥁', '🎹', '🎷', '🎺', '🎻', '🪩', '📻',
  '🐱', '🐶', '🦊', '🐼', '🐸', '🐙', '🦄', '👽', '🤖', '🔥'
] as const;

export interface RunSubmission {
  /** Random id this browser keeps. It owns the player's name and their one row (their best run). */
  player: string;
  name: string;
  /** Guards the name: required to save under it again. Only its hash is stored. */
  password: string;
  /** One of AVATARS, or "" for none. */
  avatar: string;
  /** Songs guessed right in the run. */
  correct: number;
  /** Total points in the run. */
  score: number;
  /** The run's decades and genres, e.g. "All decades · All genres". */
  filter: string;
}

export interface BoardRow {
  rank: number;
  name: string;
  avatar: string;
  correct: number;
  score: number;
  filter: string;
  /** Unix ms when this best run was saved. */
  at: number;
  /** True for the row of the player who asked. */
  you?: boolean;
}

export interface SaveResult {
  rank: number;
  /** False when this run didn't beat the player's saved best. */
  best: boolean;
  /** The id that owns the name. This browser takes it on, so the board can mark the row as theirs. */
  player: string;
  row: BoardRow;
}

// Control characters, zero-width characters and direction overrides.
const INVISIBLE = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g;

/** Trims, collapses spaces and drops invisible characters. */
export function cleanName(raw: string): string {
  return raw.normalize('NFKC').replace(INVISIBLE, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}

/** Two names that differ only in case or spacing count as the same name. */
export const nameKey = (name: string) => cleanName(name).toLowerCase().replace(/\s/g, '');

/** Returns an error message, or null when the run is plausible. */
export function checkRun(r: Partial<RunSubmission>): string | null {
  if (typeof r.player !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(r.player)) return 'Bad player id.';
  if (typeof r.name !== 'string' || !cleanName(r.name)) return 'Enter a name.';
  if (typeof r.password !== 'string' || r.password.length < PASSWORD_MIN || r.password.length > PASSWORD_MAX) {
    return `Password must be ${PASSWORD_MIN} to ${PASSWORD_MAX} characters.`;
  }
  if (r.avatar !== undefined && r.avatar !== '' && !(AVATARS as readonly string[]).includes(r.avatar)) return 'Bad avatar.';
  if (!Number.isInteger(r.correct) || r.correct! < 1 || r.correct! > MAX_CORRECT) return 'Bad song count.';
  // Every solved song scores between 20 and 100 points, in steps of 10.
  const c = r.correct!;
  const min = POINTS[POINTS.length - 1] * c;
  const max = POINTS[0] * c;
  if (!Number.isInteger(r.score) || r.score! < min || r.score! > max || r.score! % 10 !== 0) return 'Bad score.';
  if (r.filter !== undefined && typeof r.filter !== 'string') return 'Bad filter.';
  return null;
}

/** Leaderboard order: more points first, then more songs, then whoever got there first. */
export function compareRows(a: Pick<BoardRow, 'score' | 'correct' | 'at'>, b: Pick<BoardRow, 'score' | 'correct' | 'at'>) {
  return b.score - a.score || b.correct - a.correct || a.at - b.at;
}

export async function fetchBoard(player?: string): Promise<{ rows: BoardRow[]; you: BoardRow | null }> {
  const q = player ? `?player=${encodeURIComponent(player)}` : '';
  const res = await fetch(`/api/leaderboard${q}`, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Leaderboard ${res.status}`);
  return res.json();
}

export class SaveError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function submitRun(run: RunSubmission): Promise<SaveResult> {
  let res: Response;
  try {
    res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(run)
    });
  } catch {
    throw new SaveError("Couldn't reach the server. Check your connection and try again.", 0);
  }
  const body = (await res.json().catch(() => ({}))) as SaveResult & { error?: string };
  if (!res.ok) throw new SaveError(body.error || "Couldn't save. Try again.", res.status);
  return body;
}
