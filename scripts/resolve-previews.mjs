// Looks up every song from the Billboard year-end charts (scripts/charts.json)
// and the hand-picked catalog (scripts/catalog.mjs) on the iTunes Search API
// and writes src/data/songs.json. Songs ranked in the top 40 of a year-end chart
// (and every catalog song) become answers ("pool": true); the rest are only
// offered as guess suggestions. Songs without a matching preview are skipped.
// The search API is rate limited per IP, so requests are spaced out and slow down
// automatically when throttled. Earlier results are reused, so re-runs are quick.
import { readFile, writeFile } from 'node:fs/promises';
import { catalog } from './catalog.mjs';

const OUT = new URL('../src/data/songs.json', import.meta.url);
const CHARTS = new URL('./charts.json', import.meta.url);
const MISSES = new URL('./misses.json', import.meta.url);
const POOL_RANK = 40;
let delay = 1500;

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const slug = (s) => norm(s).replace(/ /g, '-');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decadeOf = (year) => `${String(year).slice(2, 3)}0s`;
/** "Philip Bailey and Phil Collins" → "Philip Bailey" */
const leadArtist = (a) => a.split(/\s+(?:featuring|feat\.|ft\.|with|and|x|&)\s+|,|\//i)[0].trim();
const keyWord = (a) => norm(leadArtist(a)).split(' ').filter((w) => w !== 'the')[0] ?? '';

async function search(term) {
  const url = `https://itunes.apple.com/search?${new URLSearchParams({ term, entity: 'song', limit: '15', country: 'US' })}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return (await res.json()).results ?? [];
    } catch {}
    // Throttled: slow down for the rest of the run.
    delay = Math.min(delay * 1.5, 6000);
    await sleep(15000 * (attempt + 1));
  }
  throw new Error(`iTunes search failed for "${term}"`);
}

function pick(results, title, artist) {
  const t = norm(title);
  const a = keyWord(artist);
  const ok = results.filter(
    (r) => r.previewUrl && norm(r.trackName).startsWith(t) && norm(r.artistName).includes(a)
  );
  // Prefer the original studio version over live, remix or karaoke cuts.
  ok.sort((x, y) => norm(x.trackName).length - norm(y.trackName).length);
  return ok[0];
}

// Collect wanted songs, deduplicated by title and lead artist.
const wanted = new Map();
const add = (title, artist, year, pool) => {
  const key = `${norm(title)}|${keyWord(artist)}`;
  const prev = wanted.get(key);
  if (prev) {
    prev.pool ||= pool;
    prev.year = Math.min(prev.year, year);
    return;
  }
  wanted.set(key, { title, artist, year, pool });
};
for (const [, list] of Object.entries(catalog)) for (const [title, artist, year] of list) add(title, artist, year, true);
const charts = JSON.parse(await readFile(CHARTS, 'utf8'));
for (const c of charts) add(c.title, c.artist, c.year, c.rank <= POOL_RANK);

const previous = {};
try {
  for (const s of JSON.parse(await readFile(OUT, 'utf8'))) previous[`${norm(s.title)}|${keyWord(s.artist)}`] = s;
} catch {}
let misses = [];
try {
  misses = JSON.parse(await readFile(MISSES, 'utf8'));
} catch {}
const missed = new Set(misses);

const songs = [];
let looked = 0;
const flush = () => writeFile(OUT, JSON.stringify(songs.sort((a, b) => a.year - b.year || a.id.localeCompare(b.id)), null, 0).replace(/\},\{/g, '},\n{') + '\n');

for (const [key, w] of wanted) {
  const old = previous[key];
  if (old) {
    const { trackUrl, ...rest } = old;
    songs.push({ ...rest, year: w.year, decade: decadeOf(w.year), pool: w.pool });
    continue;
  }
  if (missed.has(key)) continue;
  const hit = pick(await search(`${w.title} ${leadArtist(w.artist)}`), w.title, w.artist);
  await sleep(delay);
  if (++looked % 100 === 0) {
    await flush();
    await writeFile(MISSES, JSON.stringify([...missed]) + '\n');
    console.log(`${looked} looked up, ${songs.length} songs so far`);
  }
  if (!hit) {
    missed.add(key);
    console.log(`miss ${w.year} ${w.title} - ${w.artist}`);
    continue;
  }
  songs.push({
    id: slug(`${leadArtist(w.artist)} ${w.title}`),
    title: w.title,
    artist: w.artist,
    year: w.year,
    decade: decadeOf(w.year),
    pool: w.pool,
    trackId: hit.trackId,
    previewUrl: hit.previewUrl,
    artwork: hit.artworkUrl100?.replace('100x100', '300x300')
  });
}

await flush();
await writeFile(MISSES, JSON.stringify([...missed]) + '\n');
const pool = songs.filter((s) => s.pool);
console.log(`\n${songs.length} songs written (${pool.length} answers), ${missed.size} without a preview`);
for (const d of ['80s', '90s', '00s', '10s', '20s']) console.log(`${d}: ${pool.filter((s) => s.decade === d).length} answers`);
