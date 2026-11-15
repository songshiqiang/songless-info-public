// Extends the files that fix the five song ids for each daily ladder: schedule.json
// for the US Billboard library, schedule-world.json for one ladder per other chart.
// Existing days are never changed, so editing the catalog can't alter a ladder people
// have already played, unless `--refresh BR RU` asks for those charts' days from next
// week on to be redrawn, so a bigger pool reaches them. Songs come from that chart's
// whole answer pool (any year) and cycle through it in a random order before any song
// repeats.
import { readFile, writeFile } from 'node:fs/promises';

const PER_LADDER = 5;
const DAYS_AHEAD = 400;
const KEPT_DAYS_AHEAD = 7;
const LAUNCH_UTC = Date.UTC(2026, 9, 31);
const WORLD_CHARTS = ['BR', 'RU', 'ZH'];
const SONGS = new URL('../src/data/songs.json', import.meta.url);
const US_OUT = new URL('../src/data/schedule.json', import.meta.url);
const WORLD_OUT = new URL('../src/data/schedule-world.json', import.meta.url);

const songs = JSON.parse(await readFile(SONGS, 'utf8'));

async function loadJson(url) {
  try {
    return JSON.parse(await readFile(url, 'utf8'));
  } catch {
    return {};
  }
}

const shuffle = (a) => {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const today = Math.floor((Date.now() - LAUNCH_UTC) / 86_400_000) + 1;
const target = Math.max(today, 1) + DAYS_AHEAD;

/** Adds days up to the target and returns how many. */
function extend(schedule, ids) {
  const existing = Object.keys(schedule).map(Number);
  const last = existing.length ? Math.max(...existing) : 0;

  // Put songs not used recently at the front of the queue.
  const recent = new Set(
    existing
      .sort((a, b) => b - a)
      .slice(0, Math.floor(ids.length / PER_LADDER) - 1)
      .flatMap((n) => schedule[n])
  );
  let queue = [...shuffle(ids.filter((id) => !recent.has(id))), ...shuffle(ids.filter((id) => recent.has(id)))];

  for (let n = last + 1; n <= target; n++) {
    if (queue.length < PER_LADDER) queue = [...queue, ...shuffle(ids.filter((id) => !queue.includes(id)))];
    schedule[n] = queue.splice(0, PER_LADDER);
  }
  return Math.max(target - last, 0);
}

const us = await loadJson(US_OUT);
const usAdded = extend(us, songs.filter((s) => s.pool && !s.chart).map((s) => s.id));
await writeFile(US_OUT, JSON.stringify(us) + '\n');
console.log(`schedule: US ladders 1-${target} (${usAdded} added)`);

const refreshAt = process.argv.indexOf('--refresh');
const refreshed = new Set(refreshAt === -1 ? [] : process.argv.slice(refreshAt + 1).filter((a) => WORLD_CHARTS.includes(a)));
const world = await loadJson(WORLD_OUT);
for (const chart of WORLD_CHARTS) {
  world[chart] ??= {};
  if (refreshed.has(chart)) {
    for (const n of Object.keys(world[chart])) if (Number(n) > today + KEPT_DAYS_AHEAD) delete world[chart][n];
  }
  const added = extend(world[chart], songs.filter((s) => s.pool && s.chart === chart).map((s) => s.id));
  console.log(`schedule: ${chart} ladders 1-${target} (${added} added)`);
}
await writeFile(WORLD_OUT, JSON.stringify(world) + '\n');
