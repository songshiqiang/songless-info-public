// Made-up results for the site's promotional pictures: no one played these games. Results
// players share come from their real games, never from here. Each is the outcome of
// playing out the game's rules, so the numbers add up, and a date always gives the same ones.
const CLIPS = [1, 3, 6, 12];
const POINTS = [100, 70, 40, 20];
const LADDER_SIZE = 5;
const PARTY_ROUNDS = 10;
const LAUNCH_UTC = Date.UTC(2026, 9, 31);

export const NAMES = {
  en: ['Maya', 'Leo', 'Nina', 'Theo', 'Ivy', 'Sam'],
  zh: ['小鱼', '阿哲', 'Momo', '橙子', '老周', '七七'],
  ru: ['Маша', 'Дима', 'Оля', 'Артём', 'Лена', 'Саша'],
  'pt-br': ['Bia', 'Rafa', 'Lu', 'Caio', 'Duda', 'Nando'],
};

export function ladderOn(date) {
  const at = /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(`${date}T00:00:00Z`) : NaN;
  if (Number.isNaN(at)) throw new Error(`--date must look like 2026-11-05, got "${date}"`);
  const num = Math.floor((at - LAUNCH_UTC) / 86_400_000) + 1;
  if (num < 1) throw new Error(`${date} is before the first ladder`);
  return num;
}

export function seededRandom(seed) {
  let s = seed % 2147483647 || 1;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  // Close seeds start out close: run them apart.
  for (let i = 0; i < 8; i++) next();
  return next;
}

/** Index of the weight a random number lands on. */
function pick(random, weights) {
  let left = random() * weights.reduce((a, b) => a + b, 0);
  const i = weights.findIndex((w) => (left -= w) < 0);
  return i === -1 ? weights.length - 1 : i;
}

const CLIP_WEIGHTS = [38, 30, 18, 9];

/** The seconds each song took, null for a miss (one song in twenty). */
export function demoDaily(random) {
  return Array.from({ length: LADDER_SIZE }, () => {
    const i = pick(random, [...CLIP_WEIGHTS, 5]);
    return i === CLIPS.length ? null : CLIPS[i];
  });
}

/** A ten-song game for five players. "Me" names songs most often, so usually places well. */
export function demoParty(random, locale) {
  const pool = [...NAMES[locale]];
  const players = Array.from({ length: 5 }, () => ({ name: pool.splice(Math.floor(random() * pool.length), 1)[0], score: 0 }));
  const weights = players.map((_, i) => (i === 0 ? 6 : 2 + random() * 2));
  for (let round = 0; round < PARTY_ROUNDS; round++) {
    if (random() < 0.1) continue; // Nobody named it.
    players[pick(random, weights)].score += POINTS[pick(random, CLIP_WEIGHTS)];
  }
  return { players, me: players[0].name };
}
