import { CLIPS, ladderDate, rungScore, rungSolved, type Chart, type RungState, type Song } from './game';
import { load, save } from './storage';

// Saved Daily Ladder results. Lives only in this browser's localStorage, and keeps
// the song titles so past days can be shown without fetching the old ladders again.

export const HISTORY_KEY = 'songless:history';

export interface HistorySong {
  title: string;
  artist: string;
  /** Clip length in seconds when solved, or null when missed. */
  solvedAt: number | null;
  points: number;
}

export interface HistoryRecord {
  num: number;
  /** Which country's ladder. Missing means the US one, as in records saved before there was a choice. */
  chart?: Chart;
  /** Ladder date as YYYY-MM-DD (UTC). */
  date: string;
  total: number;
  songs: HistorySong[];
  /** When the player pressed save, as an ISO timestamp. */
  savedAt: string;
}

export function buildRecord(num: number, ladder: Song[], rungs: RungState[], chart: Chart = 'US', now = new Date()): HistoryRecord {
  const songs = ladder.map((s, i) => {
    const r = rungs[i];
    const solved = rungSolved(r);
    return {
      title: s.title,
      artist: s.artist,
      solvedAt: solved ? CLIPS[r.attempts.findIndex((a) => a.kind === 'right')] : null,
      points: rungScore(r)
    };
  });
  return {
    num,
    chart,
    date: ladderDate(num).toISOString().slice(0, 10),
    total: songs.reduce((sum, s) => sum + s.points, 0),
    songs,
    savedAt: now.toISOString()
  };
}

const same = (r: HistoryRecord, num: number, chart: Chart) => r.num === num && (r.chart ?? 'US') === chart;

/** Saved records, newest ladder first. */
export function loadHistory(): HistoryRecord[] {
  const list = load<HistoryRecord[]>(HISTORY_KEY, []);
  return Array.isArray(list) ? [...list].sort((a, b) => b.num - a.num) : [];
}

/** Adds a record, replacing any earlier save of the same ladder. */
export function upsertRecord(list: HistoryRecord[], rec: HistoryRecord): HistoryRecord[] {
  return [rec, ...list.filter((r) => !same(r, rec.num, rec.chart ?? 'US'))].sort((a, b) => b.num - a.num);
}

export function saveRecord(rec: HistoryRecord): HistoryRecord[] {
  const next = upsertRecord(loadHistory(), rec);
  save(HISTORY_KEY, next);
  return next;
}

export function removeRecord(num: number, chart: Chart = 'US'): HistoryRecord[] {
  const next = loadHistory().filter((r) => !same(r, num, chart));
  save(HISTORY_KEY, next);
  return next;
}

export function isSaved(num: number, chart: Chart = 'US'): boolean {
  return loadHistory().some((r) => same(r, num, chart));
}

export interface HistorySummary {
  days: number;
  average: number;
  best: number;
  solved: number;
  songs: number;
}

export function summarize(list: HistoryRecord[]): HistorySummary {
  const songs = list.flatMap((r) => r.songs);
  return {
    days: list.length,
    average: list.length ? Math.round(list.reduce((s, r) => s + r.total, 0) / list.length) : 0,
    best: list.reduce((m, r) => Math.max(m, r.total), 0),
    solved: songs.filter((s) => s.solvedAt !== null).length,
    songs: songs.length
  };
}
