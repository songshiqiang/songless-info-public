// Player settings for Songless Unlimited, remembered per browser.
import { DECADES, GENRES, CHARTS, CHART_NAMES, chartOf, type Decade, type Genre, type Chart, type Song } from './game';
import { defaultChart } from '../i18n/client';
import { load, save } from './storage';

const KEY = 'songless:settings';

export interface Settings {
  decades: Decade[];
  genres: Genre[];
  charts: Chart[];
}

export const DEFAULT_SETTINGS: Settings = { decades: [...DECADES], genres: [...GENRES], charts: ['US'] };

function pick<T>(saved: unknown, order: readonly T[]): T[] {
  const list = Array.isArray(saved) ? order.filter((x) => saved.includes(x)) : [];
  return list.length ? list : [...order];
}

export function loadSettings(): Settings {
  const s = load<Partial<Settings>>(KEY, {});
  return {
    decades: pick(s.decades, DECADES),
    genres: pick(s.genres, GENRES),
    charts: s.charts ? pick(s.charts, CHARTS) : [defaultChart]
  };
}

export const saveSettings = (s: Settings) => save(KEY, s);

/** Songs matching the settings, optionally ignoring one filter (for the chip counts). */
export function filterSongs<S extends Pick<Song, 'decade' | 'genre' | 'chart'>>(songs: S[], s: Settings, ignore?: keyof Settings): S[] {
  return songs.filter(
    (x) =>
      (ignore === 'decades' || s.decades.includes(x.decade)) &&
      (ignore === 'genres' || s.genres.includes(x.genre ?? 'Pop')) &&
      (ignore === 'charts' || s.charts.includes(chartOf(x)))
  );
}

const isDefaultChart = (s: Settings) => s.charts.length === 1 && s.charts[0] === 'US';

export const isDefault = (s: Settings) =>
  s.decades.length === DECADES.length && s.genres.length === GENRES.length && isDefaultChart(s);

/** "USA · All decades · Rock, Pop" style summary, country first. */
export function describe(s: Settings): string {
  const c = s.charts.length === CHARTS.length ? 'All countries' : CHARTS.filter((x) => s.charts.includes(x)).map((x) => CHART_NAMES[x]).join(', ');
  const d = s.decades.length === DECADES.length ? 'All decades' : DECADES.filter((x) => s.decades.includes(x)).join(', ');
  const g = s.genres.length === GENRES.length ? 'All genres' : GENRES.filter((x) => s.genres.includes(x)).join(', ');
  return [c, d, g].join(' · ');
}
