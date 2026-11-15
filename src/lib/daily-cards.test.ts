import { describe, expect, it } from 'vitest';
import { buildCards } from './daily-cards';
import { dailyResultCard, litBars, rungClip } from './share-image';

const base = { num: 6, locale: 'en', chart: 'US' } as const;
const seconds = (n: number) => `${n}s`;

describe('result cards', () => {
  it('shows the real Daily score and how long each song took', () => {
    const [{ mode, card }] = buildCards({ ...base, daily: [1, 1, 3, 1, 6] });
    expect(mode).toBe('daily');
    expect(card.hero).toBe('410');
    expect(card.suffix).toBe('/500');
    expect(card.rows.map((r) => r.label)).toEqual(['1s', '1s', '3s', '1s', '6s']);
    expect(card.rows.map((r) => litBars(48, r.lit))).toEqual([4, 4, 12, 4, 24]);
    expect(card.lime).toBe(false);
    expect(card.tag).toBe('Nov 5');
  });

  it('scores a miss as nothing and a perfect run as the lime card', () => {
    expect(buildCards({ ...base, daily: [12, null, 6, null, 3] })[0].card).toMatchObject({ hero: '130', lime: false });
    expect(buildCards({ ...base, daily: [1, 1, 1, 1, 1] })[0].card).toMatchObject({ hero: '500', lime: true });
  });

  it('matches the score the game works out', () => {
    const right = { kind: 'right', text: 'x' } as const;
    const skip = { kind: 'skip' } as const;
    const rungs = [{ attempts: [right] }, { attempts: [skip, right] }, { attempts: [skip, skip, skip, skip] }];
    expect(dailyResultCard(rungs.map(rungClip), seconds, { tag: '', tagline: '', url: '', seed: 1 }).hero).toBe('170');
  });

  it('shows the real Party leaderboard with my score and place', () => {
    const players = [
      { name: 'Mia', score: 860 },
      { name: 'Bob', score: 640 },
      { name: 'Sam', score: 300 },
    ];
    const [{ mode, card }] = buildCards({ ...base, party: { players, me: 'Bob' } });
    expect(mode).toBe('party');
    expect(card).toMatchObject({ hero: '640', suffix: '#2', lime: false });
    expect(card.rows.map((r) => r.label)).toEqual(['860', '640', '300']);
    expect(card.rows.map((r) => r.name)).toEqual(['1  Mia', '2  Me', '3  Sam']);
    expect(buildCards({ ...base, party: { players, me: 'Mia' } })[0].card.lime).toBe(true);
    expect(buildCards({ ...base, party: { players } })[0].card).toMatchObject({ hero: '860', suffix: '', lime: false });
  });

  it('links to the right page in each language', () => {
    const party = { players: [{ name: 'A', score: 1 }] };
    const cards = buildCards({ num: 6, locale: 'zh', chart: 'ZH', daily: [1, 1, 1, 1, 1], party });
    expect(cards.map((c) => c.card.url)).toEqual(['songless.info/zh', 'songless.info/zh/party']);
    expect(cards[0].card.tag).toBe('中文 · 11月5日');
  });
});
