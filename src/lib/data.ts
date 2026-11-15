// Browser-side loaders for the static JSON built from src/pages/data/.
import { poolShardNames, type Chart, type Decade, type Genre, type PoolEntry, type Song, type SongRef } from './game';

const cache = new Map<string, Promise<unknown>>();

function getJson<T>(url: string): Promise<T> {
  if (!cache.has(url)) {
    const p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url}: ${r.status}`);
      return r.json();
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return cache.get(url) as Promise<T>;
}

export const loadTitles = (charts: Chart[]) =>
  Promise.all(charts.map((c) => getJson<[string, string, string][]>(`/data/titles/${c.toLowerCase()}.json`))).then((files) =>
    files.flat().map(([id, title, artist]): SongRef => ({ id, title, artist }))
  );

export const loadLadder = (n: number, chart: Chart = 'US') =>
  getJson<Song[]>(chart === 'US' ? `/data/ladders/${n}.json` : `/data/ladders/${chart}/${n}.json`);

export const loadPool = () =>
  getJson<[string, Decade, Genre, Chart][]>('/data/pool.json').then((rows) => {
    const shards = poolShardNames(rows.map((r) => r[3]));
    return rows.map(([id, decade, genre, chart], i): PoolEntry => ({ id, decade, genre, chart, shard: shards[i] }));
  });

export async function loadSong({ id, shard }: PoolEntry): Promise<Song> {
  const songs = await getJson<Song[]>(`/data/pool/${shard}.json`);
  const song = songs.find((s) => s.id === id);
  if (!song) throw new Error(`Pool shard ${shard}: unknown song ${id}`);
  return song;
}

/** Fresh preview URL for a track, used when a stored one has expired. */
export async function lookupPreview(trackId: number, store = 'US'): Promise<string | null> {
  try {
    const r = await fetch(`https://itunes.apple.com/lookup?id=${trackId}&entity=song&country=${store}`);
    const json = await r.json();
    return json.results?.find((x: { previewUrl?: string }) => x.previewUrl)?.previewUrl ?? null;
  } catch {
    return null;
  }
}
