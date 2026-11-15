// The Songless Unlimited totals and current song, remembered per browser so it survives leaving the page.
import type { RungState, Song } from './game';
import { load, save } from './storage';

const KEY = 'songless:unlimited-run';

export interface Run<S = Song> {
  song: S;
  rung: RungState;
  correct: number;
  points: number;
  recent: string[];
  salt: number;
}

type Saved = Omit<Run, 'song'> & { song: string };

const isCount = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0;

/** The saved run, or null if there is nothing worth resuming or it no longer fits the song list. */
export function parseRun<S extends { id: string }>(saved: Partial<Saved> | null, songs: S[]): Run<S> | null {
  if (!saved || !isCount(saved.correct) || !isCount(saved.points) || !isCount(saved.salt)) return null;
  if (!Array.isArray(saved.rung?.attempts) || !Array.isArray(saved.recent)) return null;
  const song = songs.find((s) => s.id === saved.song);
  if (!song) return null;
  // Nothing played yet: a new song is as good as the old one.
  if (saved.correct === 0 && saved.rung.attempts.length === 0) return null;
  return { ...saved, song, rung: saved.rung, recent: saved.recent } as Run<S>;
}

export const loadRun = <S extends { id: string }>(songs: S[]) => parseRun(load<Partial<Saved> | null>(KEY, null), songs);

export const saveRun = (run: Run) => save(KEY, { ...run, song: run.song.id });
