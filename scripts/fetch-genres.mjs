// Adds a `genre` to every song in src/data/songs.json from the iTunes lookup
// API (batched by trackId). Run after `npm run songs:resolve`.
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../src/data/songs.json', import.meta.url);
const BATCH = 150;

// iTunes genre name -> our genre bucket.
const BUCKETS = [
  ['Hip-Hop', /hip-hop|rap/i],
  ['R&B', /r&b|soul|funk/i],
  ['Country', /country/i],
  ['Rock', /rock|metal|punk|alternative|indie/i],
  ['Dance', /dance|electronic|house|disco/i],
  ['Latin', /latin|reggaeton|urbano/i]
];
export function bucket(name = '') {
  for (const [b, re] of BUCKETS) if (re.test(name)) return b;
  return 'Pop';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const songs = JSON.parse(await readFile(FILE, 'utf8'));
const todo = songs.filter((s) => !s.genre);
const raw = new Map();
for (let i = 0; i < todo.length; i += BATCH) {
  const ids = todo.slice(i, i + BATCH).map((s) => s.trackId);
  for (let tries = 0; ; tries++) {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${ids.join(',')}&country=US`);
    if (res.ok) {
      for (const r of (await res.json()).results) raw.set(r.trackId, r.primaryGenreName);
      break;
    }
    if (tries > 5) throw new Error(`lookup failed: ${res.status}`);
    await sleep(5000 * (tries + 1));
  }
  console.log(`${Math.min(i + BATCH, todo.length)}/${todo.length}`);
  await sleep(3000);
}
for (const s of todo) if (raw.has(s.trackId)) s.genre = bucket(raw.get(s.trackId));
await writeFile(FILE, JSON.stringify(songs).replace(/\},\{/g, '},\n{') + '\n');
const counts = {};
for (const s of songs) counts[s.genre ?? '(none)'] = (counts[s.genre ?? '(none)'] ?? 0) + 1;
console.log(counts);
