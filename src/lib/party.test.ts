import { describe, expect, it } from 'vitest';
import { songById } from '../data/songs';
import { POINTS } from './game';
import {
  answer,
  COUNTDOWN_MS,
  createRoom,
  finished,
  join,
  leave,
  LEVEL_AT,
  levelAt,
  nextWake,
  publicState,
  RESULTS_MS,
  REVEAL_MS,
  ROUND_MS,
  startGame,
  summary,
  tick,
  updateSettings,
  WRONG_LOCK_MS,
  type RoomState,
} from './party';

let n = 0;
const token = () => `t${++n}`;
const rand = () => 0.5;

function room(players = 3): RoomState {
  const s = createRoom('ABCD', 0);
  for (let i = 0; i < players; i++) join(s, `p${i}`, `Player ${i}`, 'guitar', 0, undefined, token);
  return s;
}

// Starts a game and runs the countdown, so the first song is playing.
function live(s: RoomState) {
  expect(startGame(s, 'p0', 0).error).toBeUndefined();
  tick(s, COUNTDOWN_MS, rand);
  expect(s.phase).toBe('play');
  return s;
}

const song = (s: RoomState) => songById(s.songId!)!;

describe('Songless Party (buzz-in)', () => {
  it('needs two players and the host to start', () => {
    const s = room(1);
    expect(startGame(s, 'p0', 0).error).toMatch(/at least 2/);
    join(s, 'p1', 'B', 'drums', 0, undefined, token);
    expect(startGame(s, 'p1', 0).error).toMatch(/host/);
    expect(startGame(s, 'p0', 0).error).toBeUndefined();
  });

  it('never tells the browsers which song is playing', () => {
    const s = live(room());
    const text = JSON.stringify(publicState(s));
    expect(text).not.toContain(song(s).id);
    expect(text).not.toContain(`"${song(s).title}"`);
    expect(publicState(s).clip?.previewUrl).toBe(song(s).previewUrl);
  });

  it('gives 10 seconds after each clip has played before it grows', () => {
    // 1s clip (+1s to load) + 10s, then 3s + 1s + 10s, then 6s + 1s + 10s, then 12s + 1s + 10s.
    expect(LEVEL_AT).toEqual([0, 12_000, 26_000, 43_000]);
    expect(ROUND_MS).toBe(66_000);
    expect([0, 11_999, 12_000, 26_000, 43_000, 65_000].map(levelAt)).toEqual([0, 0, 1, 2, 3, 3]);
  });

  it('lets anyone buzz in; the first right answer scores by clip length and ends the round', () => {
    const s = live(room());
    const start = s.roundStart;
    const events = answer(s, 'p2', song(s).title, undefined, start + 12_000);
    expect(events[0]).toMatchObject({ kind: 'correct', by: 'p2', points: POINTS[1] });
    expect(s.players.find((p) => p.id === 'p2')!.score).toBe(POINTS[1]);
    expect(s.phase).toBe('reveal');
    expect(s.last).toMatchObject({ by: 'p2', points: POINTS[1] });
    // Too late for anyone else.
    expect(answer(s, 'p1', s.last!.title, undefined, start + 12_100)).toEqual([]);
  });

  it('accepts a picked suggestion', () => {
    const s = live(room());
    expect(answer(s, 'p1', 'anything', song(s).id, s.roundStart + 500)[0]).toMatchObject({ kind: 'correct', points: POINTS[0] });
  });

  it('locks a player out for a moment after a wrong guess', () => {
    const s = live(room());
    const t = s.roundStart + 1000;
    expect(answer(s, 'p1', 'definitely not a song title', undefined, t)[0].kind).toBe('wrong');
    expect(answer(s, 'p1', song(s).title, undefined, t + WRONG_LOCK_MS - 1)).toEqual([]);
    expect(answer(s, 'p1', song(s).title, undefined, t + WRONG_LOCK_MS)[0].kind).toBe('correct');
  });

  it('reveals the song when nobody gets it, then plays the next one', () => {
    const s = live(room());
    const first = s.songId;
    const events = tick(s, s.roundStart + ROUND_MS, rand);
    expect(events[0]).toMatchObject({ kind: 'timeout' });
    expect(s.phase).toBe('reveal');
    expect(s.last?.by).toBeNull();
    tick(s, s.until, rand);
    expect(s.phase).toBe('play');
    expect(s.round).toBe(2);
    expect(s.songId).not.toBe(first);
  });

  it('ends after the last song with the top score winning, then closes the room', () => {
    const s = live(room());
    s.settings.rounds = 2;
    answer(s, 'p1', song(s).title, undefined, s.roundStart + 100);
    tick(s, s.until, rand);
    answer(s, 'p2', song(s).title, undefined, s.roundStart + 15_000);
    const end = s.until;
    expect(tick(s, end, rand).map((e) => e.kind)).toEqual(['over']);
    expect(s.winnerIds).toEqual(['p1']);
    expect(finished(s, end + RESULTS_MS - 1)).toBe(false);
    expect(finished(s, end + RESULTS_MS)).toBe(true);
    expect(nextWake(s, end)).toBe(end + RESULTS_MS);
    expect(summary({ ...s, isPublic: true }, end)).toBeNull();
    expect(join(s, 'late', 'Late', 'drums', end, undefined, token).refused).toBe('full');
    expect(startGame(s, 'p0', end).error).toMatch(/finished/);
  });

  it('lets late players join a game in progress', () => {
    const s = live(room(2));
    expect(join(s, 'late', 'Late', 'drums', 5000, undefined, token).error).toBeUndefined();
    expect(answer(s, 'late', song(s).title, undefined, s.roundStart + 500)[0].kind).toBe('correct');
  });

  it('ends the game when only one player is left', () => {
    const s = live(room(2));
    s.players[0].score = 100;
    const events = leave(s, 'p1', 1000);
    expect(events.map((e) => e.kind)).toEqual(['left', 'over']);
    expect(s.winnerIds).toEqual(['p0']);
  });

  it('shows the reveal for a few seconds between songs', () => {
    const s = live(room());
    answer(s, 'p0', song(s).title, undefined, s.roundStart + 100);
    expect(s.until).toBe(s.roundStart + 100 + REVEAL_MS);
  });
});

describe('Songless Party country charts', () => {
  it('plays songs only from the room country and lets the host change it in the lobby', () => {
    const s = room();
    expect(s.chart).toBe('US');
    expect(updateSettings(s, 'p1', {}, undefined, 'BR')).toMatch(/host/);
    expect(updateSettings(s, 'p0', {}, undefined, 'BR')).toBeUndefined();
    expect(s.chart).toBe('BR');
    expect(summary({ ...s, isPublic: true }, 0)?.chart).toBe('BR');
    live(s);
    expect(song(s).chart).toBe('BR');
    expect(updateSettings(s, 'p0', {}, undefined, 'RU')).toMatch(/before the game/);
    for (let i = 0; i < 4; i++) {
      tick(s, s.roundStart + ROUND_MS, rand);
      tick(s, s.until, rand);
      expect(song(s).chart).toBe('BR');
    }
    expect(createRoom('WXYZ', 0, { chart: 'RU' }).chart).toBe('RU');
  });
});
