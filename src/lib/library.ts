// Counts behind the library section of Songless Unlimited, worked out at build time so they follow the data.
import { CHARTS, CHART_NAMES, DECADES, GENRES, chartOf, type Song } from './game';

export type Count = [label: string, songs: number];

export interface LibraryStats {
  suggestions: number;
  answers: number;
  artists: number;
  firstYear: number;
  lastYear: number;
  decades: Count[];
  genres: Count[];
  charts: Count[];
  topArtists: Count[];
}

const tally = <T>(items: T[], key: (x: T) => string) => {
  const counts = new Map<string, number>();
  for (const x of items) counts.set(key(x), (counts.get(key(x)) ?? 0) + 1);
  return counts;
};

export function libraryStats(songs: Song[], topArtists = 8): LibraryStats {
  const answers = songs.filter((s) => s.pool);
  const years = answers.map((s) => s.year);
  const byDecade = tally(answers, (s) => s.decade);
  const byGenre = tally(answers, (s) => s.genre ?? 'Pop');
  const byChart = tally(answers, chartOf);
  const byArtist = tally(answers, (s) => s.artist);
  return {
    suggestions: songs.length,
    answers: answers.length,
    artists: byArtist.size,
    firstYear: Math.min(...years),
    lastYear: Math.max(...years),
    decades: DECADES.map((d): Count => [d, byDecade.get(d) ?? 0]),
    genres: GENRES.map((g): Count => [g, byGenre.get(g) ?? 0]).sort((a, b) => b[1] - a[1]),
    charts: CHARTS.map((c): Count => [CHART_NAMES[c], byChart.get(c) ?? 0]),
    topArtists: [...byArtist].sort((a, b) => b[1] - a[1]).slice(0, topArtists)
  };
}
