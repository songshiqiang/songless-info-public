// Server-side access to the song data. Pages under src/pages/data/ turn it into
// small static JSON files, so the browser never downloads the whole library.
import { chartOf, poolShardNames, type Chart, type Decade, type Genre, type Schedule, type Song } from '../lib/game';
import { libraryStats } from '../lib/library';
import scheduleData from './schedule.json';
import worldScheduleData from './schedule-world.json';
import songsData from './songs.json';

export const songs = songsData as Song[];
export const schedule = scheduleData as Schedule;
/** The daily ladders of the non-US charts. */
export const worldSchedule = worldScheduleData as Record<string, Schedule>;
export const pool = songs.filter((s) => s.pool);

const byId = new Map(songs.map((s) => [s.id, s]));
export const songById = (id: string) => byId.get(id);

/** The full songs of one ladder. */
export const ladderSongs = (ids: string[]) =>
  ids.map((id) => {
    const s = byId.get(id);
    if (!s) throw new Error(`Ladder: unknown song ${id}`);
    return s;
  });

/** One chart's songs as guess suggestions: [id, title, artist]. */
export const refs = (chart: Chart): [string, string, string][] =>
  songs.filter((s) => chartOf(s) === chart).flatMap((s): [string, string, string][] => [[s.id, s.title, s.artist], ...(s.alt ? [[s.id, ...s.alt] as [string, string, string]] : [])]);

/** The answer pool's index: [id, decade, genre, chart]. Position and chart give a song's shard. */
export const poolRows = (): [string, Decade, Genre, Chart][] => pool.map((s) => [s.id, s.decade, s.genre ?? 'Pop', chartOf(s)]);

export const poolShards: Record<string, Song[]> = {};
poolShardNames(pool.map(chartOf)).forEach((name, i) => (poolShards[name] ??= []).push(pool[i]));

export const library = libraryStats(songs);
