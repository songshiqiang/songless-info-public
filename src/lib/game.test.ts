import { describe, expect, it } from 'vitest';
import {
  CHARTS,
  DECADES,
  clipFor,
  clipStart,
  isCorrect,
  ladderNumber,
  msUntilNextLadder,
  rungDone,
  rungScore,
  suggest,
  type Song
} from './game';
import { emptyDailyStats, recordDaily } from './storage';
import { DEFAULT_SETTINGS, describe as describe_, filterSongs } from './settings';

const song = (title: string, artist: string, decade: Song['decade'], i = 0): Song => ({
  id: `${artist}-${title}-${i}`.toLowerCase().replace(/\W+/g, '-'),
  title,
  artist,
  year: 2000,
  decade,
  trackId: i,
  previewUrl: `https://example.com/${i}.m4a`
});

const pool: Song[] = DECADES.flatMap((d) => Array.from({ length: 10 }, (_, i) => song(`Song ${i}`, `Artist ${d}`, d, i)));

describe('ladderNumber', () => {
  it('starts at 1 on launch day and rolls over at UTC midnight', () => {
    expect(ladderNumber(new Date('2026-10-31T00:00:00Z'))).toBe(1);
    expect(ladderNumber(new Date('2026-10-31T23:59:59Z'))).toBe(1);
    expect(ladderNumber(new Date('2026-11-01T00:00:00Z'))).toBe(2);
  });

  it('counts down to the next UTC midnight', () => {
    expect(msUntilNextLadder(new Date('2026-10-31T23:00:00Z'))).toBe(3_600_000);
  });
});

describe('guessing', () => {
  const s = song("Sweet Child O' Mine", "Guns N' Roses", '80s');

  it('accepts the title regardless of case and punctuation', () => {
    expect(isCorrect('sweet child o mine', s)).toBe(true);
    expect(isCorrect("Sweet Child O' Mine Guns N' Roses", s)).toBe(true);
    expect(isCorrect('Sweet Child', s)).toBe(false);
  });

  it('checks a picked suggestion by song, not just by title', () => {
    const adele = song('Hello', 'Adele', '10s', 1);
    const lionel = song('Hello', 'Lionel Richie', '80s', 2);
    expect(isCorrect('Hello · Adele', adele, adele)).toBe(true);
    expect(isCorrect('Hello · Lionel Richie', adele, lionel)).toBe(false);
  });

  it('suggests by title prefix first, then artist', () => {
    const songs = [song('Crazy', 'Gnarls Barkley', '00s'), song('Crazy in Love', 'Beyoncé', '00s'), song('Halo', 'Beyonce', '00s', 1)];
    expect(suggest(songs, 'cra').map((x) => x.title)).toEqual(['Crazy', 'Crazy in Love']);
    expect(suggest(songs, 'beyonce').map((x) => x.title)).toEqual(['Crazy in Love', 'Halo']);
    expect(suggest(songs, 'c')).toEqual([]);
    const hello = [song('Hello Again', 'Neil Diamond', '80s'), song('Hello', 'Adele', '10s')];
    expect(suggest(hello, 'hello').map((x) => x.title)).toEqual(['Hello', 'Hello Again']);
  });
});

describe('rungs and scoring', () => {
  it('scores by the try the song was solved on', () => {
    expect(rungScore({ attempts: [{ kind: 'right', text: 'x' }] })).toBe(100);
    expect(rungScore({ attempts: [{ kind: 'skip' }, { kind: 'wrong', text: 'y' }, { kind: 'right', text: 'x' }] })).toBe(40);
    expect(rungScore({ attempts: [{ kind: 'skip' }, { kind: 'skip' }, { kind: 'skip' }, { kind: 'skip' }] })).toBe(0);
  });

  it('unlocks longer clips and ends after four tries', () => {
    expect(clipFor({ attempts: [] })).toBe(1);
    expect(clipFor({ attempts: [{ kind: 'skip' }] })).toBe(3);
    expect(rungDone({ attempts: [{ kind: 'skip' }, { kind: 'skip' }, { kind: 'skip' }] })).toBe(false);
    expect(rungDone({ attempts: [{ kind: 'skip' }, { kind: 'skip' }, { kind: 'skip' }, { kind: 'skip' }] })).toBe(true);
  });

  it('keeps clip starts inside the 30-second preview', () => {
    for (const s of pool) {
      const start = clipStart(s.id, 3);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(start + 12).toBeLessThanOrEqual(30);
    }
  });
});

describe('daily stats', () => {
  it('counts a streak of consecutive ladders and ignores replays', () => {
    let s = recordDaily(emptyDailyStats, 1, 300);
    s = recordDaily(s, 2, 450);
    expect(s).toMatchObject({ played: 2, streak: 2, best: 450 });
    expect(recordDaily(s, 2, 500)).toBe(s);
    expect(recordDaily(s, 4, 100)).toMatchObject({ streak: 1, maxStreak: 2 });
  });
});

describe('country charts', () => {
  const br: Song = { ...song('Evidências', 'Chitãozinho & Xororó', '90s', 1), chart: 'BR' };
  const ru: Song = { ...song('Знаешь ли ты', 'МакSим', '00s', 2), chart: 'RU' };
  const all = [...pool, br, ru];

  it('plays only the US charts by default', () => {
    expect(filterSongs(all, DEFAULT_SETTINGS)).toHaveLength(pool.length);
  });

  it('filters by country chart', () => {
    expect(filterSongs(all, { ...DEFAULT_SETTINGS, charts: ['RU'] })).toEqual([ru]);
    expect(filterSongs(all, { ...DEFAULT_SETTINGS, charts: [...CHARTS] })).toHaveLength(all.length);
    expect(describe_({ ...DEFAULT_SETTINGS, charts: ['BR'] })).toBe('Brazil · All decades · All genres');
    expect(describe_(DEFAULT_SETTINGS)).toBe('USA · All decades · All genres');
  });

  it('suggests a song once when both spellings match', () => {
    const rows = [
      { id: 'zh-1', title: '晴天', artist: '周杰伦' },
      { id: 'zh-1', title: '晴天', artist: '周杰倫' }
    ];
    expect(suggest(rows, '晴天').map((x) => x.artist)).toEqual(['周杰伦']);
    expect(suggest(rows, '周杰倫').map((x) => x.artist)).toEqual(['周杰倫']);
  });

  it('accepts both simplified and traditional Chinese', () => {
    const zh: Song = { ...song('等你下课', '周杰伦', '10s', 3), chart: 'ZH', alt: ['等你下課', '周杰倫'] };
    expect(isCorrect('等你下课', zh)).toBe(true);
    expect(isCorrect('等你下課', zh)).toBe(true);
    expect(isCorrect('稻香', zh)).toBe(false);
  });

  it('matches guesses in Cyrillic and with accents', () => {
    expect(isCorrect('знаешь ли ты', ru)).toBe(true);
    expect(isCorrect('Evidencias', br)).toBe(true);
  });
});
