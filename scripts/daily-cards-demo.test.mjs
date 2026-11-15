import { describe, expect, it } from 'vitest';
import { NAMES, demoDaily, demoParty, ladderOn, seededRandom } from './daily-cards-demo.mjs';
import { CLIPS, LADDER_SIZE, POINTS, ladderNumber } from '../src/lib/game';
import { LOCALES } from '../src/i18n/locales';

describe('promotional demo results', () => {
  it('finds the same ladder as the game', () => {
    expect(ladderOn('2026-11-05')).toBe(ladderNumber(new Date('2026-11-05T12:00:00Z')));
    expect(() => ladderOn('2020-01-01')).toThrow('before the first');
    expect(() => ladderOn('nope')).toThrow('--date');
  });

  it('gives the same results for the same seed, and others for another', () => {
    expect(demoDaily(seededRandom(7))).toEqual(demoDaily(seededRandom(7)));
    expect(demoParty(seededRandom(7), 'en')).toEqual(demoParty(seededRandom(7), 'en'));
    const days = new Set(Array.from({ length: 30 }, (_, i) => JSON.stringify(demoDaily(seededRandom(i + 1)))));
    expect(days.size).toBeGreaterThan(20);
  });

  it('only makes results the game could give', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const random = seededRandom(seed * 131);
      const daily = demoDaily(random);
      expect(daily).toHaveLength(LADDER_SIZE);
      for (const clip of daily) expect(clip === null || [...CLIPS].includes(clip)).toBe(true);
      const party = demoParty(random, 'zh');
      expect(party.players).toHaveLength(5);
      expect(new Set(party.players.map((p) => p.name)).size).toBe(5);
      expect(party.players.map((p) => p.name)).toContain(party.me);
      const total = party.players.reduce((sum, p) => sum + p.score, 0);
      expect(total).toBeLessThanOrEqual(POINTS[0] * 10);
      for (const p of party.players) expect(p.score % 10).toBe(0);
    }
  });

  it('has names for every language', () => {
    for (const locale of LOCALES) expect(NAMES[locale].length).toBeGreaterThanOrEqual(5);
  });
});
