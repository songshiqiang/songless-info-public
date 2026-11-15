// The iTunes Store often dates old songs by their reissue. For answers by artists
// who were already active before 2000 but dated 2000 or later, this asks MusicBrainz
// for the first release and stores earlier years in scripts/first-years.json
// (track id -> year), which scripts/fetch-world.mjs applies to every chart.
// MusicBrainz allows one request a second; answers are remembered, so re-runs only
// look up new songs.
//
//   node scripts/fetch-first-years.mjs BR RU && node scripts/fetch-world.mjs BR RU
import { readFile, writeFile } from 'node:fs/promises';

const SONGS = new URL('../src/data/songs.json', import.meta.url);
const OUT = new URL('./first-years.json', import.meta.url);
const CHARTS = ['US', 'BR', 'RU', 'ZH'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').replace(/[^\p{L}\p{N}]+/gu, '');
const first = (a) => a.split(/\s*(?:&|,|、)\s*/)[0];
const quote = (s) => `"${s.replace(/["\\]/g, '')}"`;

const wanted = process.argv.slice(2).filter((c) => CHARTS.includes(c));
const codes = wanted.length ? wanted : CHARTS;
const songs = JSON.parse(await readFile(SONGS, 'utf8')).filter((s) => codes.includes(s.chart ?? 'US'));
const years = JSON.parse(await readFile(OUT, 'utf8').catch(() => '{}'));

const debut = new Map();
for (const s of songs) debut.set(first(s.artist), Math.min(debut.get(first(s.artist)) ?? s.year, s.year));
const suspects = songs.filter((s) => s.pool && s.year >= 2000 && debut.get(first(s.artist)) < 2000 && !(s.trackId in years));
console.log(`${suspects.length} songs to check`);

for (const [i, s] of suspects.entries()) {
  const [title, artist] = s.alt ?? [s.title, s.artist];
  const query = `recording:${quote(title)} AND artist:${quote(first(artist).replace(/^[a-z. ]+(?=\p{Script=Han})/iu, ''))}`;
  let found = 0;
  for (let tries = 0; tries < 4; tries++) {
    await sleep(1100 * (tries + 1));
    const res = await fetch(`https://musicbrainz.org/ws/2/recording?${new URLSearchParams({ query, fmt: 'json', limit: '25' })}`, {
      headers: { 'User-Agent': 'songless.info song import (https://songless.info)' }
    }).catch(() => null);
    if (!res?.ok) continue;
    const { recordings = [] } = await res.json();
    const dates = recordings
      .filter((r) => r.score >= 85 && norm(r.title) === norm(title))
      .map((r) => Number(String(r['first-release-date'] ?? '').slice(0, 4)))
      .filter((y) => y >= 1950);
    found = dates.length ? Math.min(...dates) : 0;
    break;
  }
  years[s.trackId] = found;
  if (found && found < s.year) console.log(`${s.artist} - ${s.title}: ${s.year} -> ${found}`);
  if (i % 20 === 0) await writeFile(OUT, JSON.stringify(years) + '\n');
}
await writeFile(OUT, JSON.stringify(years) + '\n');
