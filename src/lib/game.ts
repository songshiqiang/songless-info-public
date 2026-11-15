/** Just enough of a song to offer it as a guess. */
export interface SongRef {
  id: string;
  title: string;
  artist: string;
}

export interface Song extends SongRef {
  year: number;
  decade: Decade;
  /** True for songs that can be answers; the rest are only guess suggestions. */
  pool?: boolean;
  trackId: number;
  previewUrl: string;
  artwork?: string;
  genre?: Genre;
  /** Which country's charts the song comes from; missing means the US Billboard charts. */
  chart?: Chart;
  /** iTunes storefront of trackId when it isn't the US one. */
  store?: string;
  /** Another spelling of [title, artist] that also counts (traditional Chinese for the Chinese library). */
  alt?: [string, string];
}

export const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Country', 'Dance', 'Latin'] as const;
export type Genre = (typeof GENRES)[number];

/** Songs per file of the answer pool, so playing doesn't download the whole pool. */
export const POOL_SHARD = 200;

/** Each pool song's file, such as us-1 or br-2, given the songs' charts in pool order. */
export function poolShardNames(charts: Chart[]): string[] {
  const seen = new Map<Chart, number>();
  return charts.map((chart) => {
    const n = seen.get(chart) ?? 0;
    seen.set(chart, n + 1);
    return `${chart.toLowerCase()}-${Math.floor(n / POOL_SHARD) + 1}`;
  });
}

/** What Unlimited knows about a song before loading it: enough to filter and pick. */
export interface PoolEntry extends Pick<Song, 'id' | 'decade' | 'genre' | 'chart'> {
  shard: string;
}

/** Song libraries by country chart, for the Unlimited filter. */
export const CHARTS = ['US', 'BR', 'RU', 'ZH'] as const;
export type Chart = (typeof CHARTS)[number];
export const CHART_NAMES: Record<Chart, string> = { US: 'USA', BR: 'Brazil', RU: 'Russia', ZH: 'Chinese' };
export const chartOf = (s: Pick<Song, 'chart'>): Chart => s.chart ?? 'US';

/** Ladder number → the five song ids (any year). */
export type Schedule = Record<string, string[]>;

export const appleMusicUrl = (s: Song) =>
  `https://music.apple.com/${(s.store ?? 'us').toLowerCase()}/song/${s.trackId}`;

export const DECADES = ['80s', '90s', '00s', '10s', '20s'] as const;
export type Decade = (typeof DECADES)[number];
export const DECADE_NAMES: Record<Decade, string> = {
  '80s': '1980s',
  '90s': '1990s',
  '00s': '2000s',
  '10s': '2010s',
  '20s': '2020s'
};

/** Clip lengths in seconds, one per attempt. */
export const CLIPS = [1, 3, 6, 12] as const;
/** Points for solving on each attempt. */
export const POINTS = [100, 70, 40, 20] as const;
export const MAX_ATTEMPTS = CLIPS.length;
/** Songs in one daily ladder. */
export const LADDER_SIZE = 5;
export const MAX_SCORE = POINTS[0] * LADDER_SIZE;

/** Ladder #1 is the ladder for this UTC day. */
const LAUNCH_UTC = Date.UTC(2026, 9, 31);
const DAY_MS = 86_400_000;

/** Daily ladder number for a date (1 on launch day). */
export function ladderNumber(date: Date = new Date()): number {
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((utcMidnight - LAUNCH_UTC) / DAY_MS) + 1;
}

export function ladderDate(num: number): Date {
  return new Date(LAUNCH_UTC + (num - 1) * DAY_MS);
}

export function msUntilNextLadder(now: Date = new Date()): number {
  return ladderDate(ladderNumber(now) + 1).getTime() - now.getTime();
}

/** Small deterministic PRNG so every player gets the same ladder. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Where in the 30-second preview the clip starts, so it is not always the intro. */
export function clipStart(songId: string, salt = 0): number {
  let h = salt;
  for (const ch of songId) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  const rand = mulberry32(h);
  return Math.floor(rand() * 15);
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * A guess is right when the picked suggestion is the song, or when typed text
 * names its title (artist optional).
 */
export function isCorrect(guess: string, song: SongRef, picked?: SongRef): boolean {
  if (picked) {
    return picked.id === song.id || (norm(picked).title === norm(song).title && norm(picked).artist === norm(song).artist);
  }
  const g = normalize(guess);
  const alt = (song as Partial<Song>).alt;
  return [[song.title, song.artist], ...(alt ? [alt] : [])].some(([t, a]) => {
    const title = normalize(t);
    return g === title || g === `${title} ${normalize(a)}` || g.startsWith(`${title} by `);
  });
}

const normCache = new WeakMap<SongRef, { title: string; artist: string }>();
/** Normalized title and artist, cached because suggestions scan thousands of songs per keystroke. */
function norm(s: SongRef) {
  let n = normCache.get(s);
  if (!n) normCache.set(s, (n = { title: normalize(s.title), artist: normalize(s.artist) }));
  return n;
}

export function suggest<T extends SongRef>(songs: readonly T[], query: string, limit = 6): T[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const exact: T[] = [];
  const starts: T[] = [];
  const contains: T[] = [];
  const seen = new Set<string>();
  for (const s of songs) {
    const { title: t, artist: a } = norm(s);
    const key = `${t}|${a}`;
    // A song's traditional spelling is its own row, with the same id.
    if (seen.has(key) || seen.has(s.id)) continue;
    const hay = `${t} ${a}`;
    if (t === q) exact.push(s);
    else if (t.startsWith(q)) starts.push(s);
    else if (hay.includes(q)) contains.push(s);
    else continue;
    seen.add(key);
    seen.add(s.id);
  }
  return [...exact, ...starts, ...contains].slice(0, limit);
}

export type Attempt = { kind: 'skip' } | { kind: 'wrong'; text: string } | { kind: 'right'; text: string };

export interface RungState {
  attempts: Attempt[];
}

export function rungSolved(r: RungState): boolean {
  return r.attempts.some((a) => a.kind === 'right');
}

export function rungDone(r: RungState): boolean {
  return rungSolved(r) || r.attempts.length >= MAX_ATTEMPTS;
}

export function rungScore(r: RungState): number {
  const i = r.attempts.findIndex((a) => a.kind === 'right');
  return i === -1 ? 0 : POINTS[i];
}

/** Clip length to play for the next attempt (or the last one once done). */
export function clipFor(r: RungState): number {
  return CLIPS[Math.min(r.attempts.length, MAX_ATTEMPTS - 1)];
}

/** "Oct 31": how a ladder is named to players (by its UTC date, not its number). */
export const ladderLabel = (num: number, locale = 'en-US') =>
  ladderDate(num).toLocaleDateString(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' });
