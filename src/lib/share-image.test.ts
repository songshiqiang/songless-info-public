import { describe, expect, it } from 'vitest';
import { litBars, partyPlace, partyRows, rungClip, savedRunCard, soloRow, totalScore, waveBars } from './share-image';

const s = (n: number) => `${n}s`;

describe('share image', () => {
  it('lights each song for the clip it took', () => {
    const right = { kind: 'right', text: 'x' } as const;
    const skip = { kind: 'skip' } as const;
    expect(rungClip({ attempts: [right] })).toBe(1);
    expect(rungClip({ attempts: [skip, right] })).toBe(3);
    expect(rungClip({ attempts: [skip, skip, skip, skip] })).toBeNull();
    expect(litBars(48, soloRow(1, s).lit)).toBe(4);
    expect(litBars(48, soloRow(6, s).lit)).toBe(24);
    expect(soloRow(null, s)).toEqual({ lit: 1, tone: 'miss', label: '✕' });
  });

  it('adds up the score', () => {
    const right = { kind: 'right', text: 'x' } as const;
    expect(totalScore([{ attempts: [right] }, { attempts: [{ kind: 'skip' }, right] }])).toBe(170);
  });

  it('draws the same bars for the same seed', () => {
    expect(waveBars(48, 7, 2)).toEqual(waveBars(48, 7, 2));
    expect(waveBars(48, 7, 2)).not.toEqual(waveBars(48, 8, 2));
    for (const h of waveBars(48, 7, 2)) {
      expect(h).toBeGreaterThan(0);
      expect(h).toBeLessThanOrEqual(1);
    }
  });

  it('keeps the player in the party rows, however low', () => {
    const players = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, name: `N${i}`, score: 800 - i * 100, solved: 0 }));
    const rows = partyRows(players, 'p7', 'Me');
    expect(rows).toHaveLength(5);
    expect(rows[4]).toMatchObject({ tone: 'hit', name: '8  Me', label: '100' });
    expect(rows[0]).toMatchObject({ tone: 'other', lit: 1, label: '800' });
  });

  it('gives tied players the same place and copes with nobody scoring', () => {
    const players = [
      { id: 'a', name: 'A', score: 0, solved: 0 },
      { id: 'b', name: 'B', score: 0, solved: 0 },
    ];
    expect(partyPlace(players, 0)).toBe(1);
    expect(partyRows(players, 'a', 'Me').map((r) => r.lit)).toEqual([0, 0]);
    expect(litBars(28, 0)).toBe(0);
  });

  it('shows what the leaderboard holds for a saved run', () => {
    const card = { tag: '', hero: '', suffix: '', rows: [], tagline: '', url: '', lime: false, seed: 1 };
    const row = { rank: 2, name: 'A', avatar: '', correct: 30, score: 2000, filter: '', at: 1 };
    const labels = { rank: (n: number) => `Leaderboard #${n}`, points: (n: number) => `${n} points`, songs: (n: number) => `${n} songs` };
    expect(savedRunCard(card, { rank: 2, best: false, player: 'p', row }, labels)).toMatchObject({
      rank: 'Leaderboard #2',
      hero: '2000 points',
      suffix: '30 songs',
      rows: [],
    });
  });
});
