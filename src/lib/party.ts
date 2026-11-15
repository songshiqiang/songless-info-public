// Rules for Songless Party rooms, run by the room server. Everything takes `now`
// and a random source so a game can be replayed in tests without timers.
//
// Buzz-in: every round, everyone hears the same clip. It starts at 1 second and,
// while nobody has named the song, grows to 3, 6 and 12 seconds every 10 seconds.
// The first player to name it scores (100, 70, 40 or 20 points by clip length) and
// the next song starts. After the last round the highest score wins.

import { pool, songById } from '../data/songs';
import { CHARTS, POINTS, chartOf, clipStart, isCorrect, type Chart, type Song } from './game';
import {
  avatars,
  cleanName,
  isChart,
  COUNTDOWN_MS,
  defaultSettings,
  HOST_HANDOVER_MS,
  levelAt,
  RESULTS_MS,
  REVEAL_MS,
  ROOM_IDLE_MS,
  ROUND_MS,
  SEAT_GRACE_MS,
  settingRanges,
  WRONG_LOCK_MS,
  type Avatar,
  type DoorState,
  type PartyEvent,
  type Player,
  type PublicState,
  type Revealed,
  type RoomState,
  type RoomSummary,
  type Settings,
} from './party-shared';

export * from './party-shared';

type Random = () => number;

// Every answer-pool song from the room's country charts can come up; a room goes through the
// whole list before one repeats.
const byChart = new Map<Chart, Song[]>(CHARTS.map((c) => [c, pool.filter((s) => chartOf(s) === c)]));
export const partySongs = (chart: Chart): Song[] => byChart.get(chart) ?? [];
// Songs in a room's "already played" list are kept to this many, so saved state stays small.
const USED_MAX = 600;

export function createRoom(code: string, now: number, options: { isPublic?: boolean; seats?: number; chart?: Chart } = {}): RoomState {
  const settings = { ...defaultSettings };
  if (options.seats) settings.seats = Math.min(settingRanges.seats[2], Math.max(settingRanges.seats[1], Math.round(options.seats)));
  return {
    code,
    isPublic: options.isPublic ?? false,
    chart: options.chart && isChart(options.chart) ? options.chart : 'US',
    created: now,
    lastActive: now,
    hostId: null,
    settings,
    players: [],
    phase: 'lobby',
    game: 0,
    until: 0,
    round: 0,
    roundStart: 0,
    songId: null,
    clip: null,
    guesses: [],
    last: null,
    played: [],
    songCount: 0,
    usedSongs: [],
    winnerIds: [],
  };
}

export function publicState(s: RoomState): PublicState {
  return {
    code: s.code,
    isPublic: s.isPublic,
    chart: s.chart ?? 'US',
    hostId: s.hostId,
    settings: s.settings,
    players: s.players.map(({ token, leftAt, ...p }) => p),
    phase: s.phase,
    game: s.game,
    until: s.until,
    round: s.round,
    roundStart: s.roundStart,
    clip: s.phase === 'play' ? s.clip : null,
    guesses: s.phase === 'play' ? s.guesses : [],
    last: s.last,
    played: s.played,
    winnerIds: s.winnerIds,
  };
}

export function reveal(song: Song): Revealed {
  return { title: song.title, artist: song.artist, year: song.year, artwork: song.artwork, trackId: song.trackId, ...(song.store ? { store: song.store } : {}) };
}

const playing = (s: RoomState) => s.phase === 'countdown' || s.phase === 'play' || s.phase === 'reveal';
const graceEnd = (p: Player) => p.leftAt + SEAT_GRACE_MS;

// Takes a seat, or reclaims this player's own seat with its token. `newToken` is only
// called for a new seat. On success the caller hands `token` to this tab and nobody else.
// Players can join a game in progress and start buzzing in from the next guess.
export function join(
  s: RoomState,
  id: string,
  rawName: string,
  avatar: Avatar,
  now: number,
  token: string | undefined,
  newToken: () => string,
  resume = false,
): { events: PartyEvent[]; error?: string; refused?: 'full' | 'taken' | 'gone'; token?: string } {
  const name = cleanName(rawName);
  const face = avatars.includes(avatar) ? avatar : avatars[0];
  const existing = s.players.find((p) => p.id === id);
  if (existing) {
    // Knowing a player's ID is not enough: without the seat's token the join is refused
    // and the player who holds the seat is left alone.
    if (!token || !existing.token || !sameToken(token, existing.token)) return { events: [], error: 'That seat belongs to another player.', refused: 'taken' };
    s.lastActive = now;
    existing.connected = true;
    existing.leftAt = 0;
    existing.name = name;
    existing.avatar = face;
    s.hostId ??= id;
    return { events: [], token: existing.token };
  }
  if (token || resume) return { events: [], error: 'Your seat in this room was released.', refused: 'gone' };
  if (s.phase === 'over') return { events: [], error: 'This game has finished. Host or join another room.', refused: 'full' };
  if (s.players.length >= s.settings.seats) return { events: [], error: 'This room is full.', refused: 'full' };
  s.lastActive = now;
  const seat = newToken();
  s.players.push({ id, name, avatar: face, connected: true, score: 0, solved: 0, lockedUntil: 0, token: seat, leftAt: 0 });
  s.hostId ??= id;
  return { events: [{ kind: 'joined', name }], token: seat };
}

// Compares without stopping at the first different character.
function sameToken(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// A closed tab keeps its seat (and score) for SEAT_GRACE_MS, and until the end of a game.
export function disconnect(s: RoomState, id: string, now: number): PartyEvent[] {
  const p = s.players.find((x) => x.id === id);
  if (!p) return [];
  p.connected = false;
  p.leftAt = now;
  s.lastActive = now;
  return [];
}

// Runs on every message and alarm: releases seats whose grace period is over (outside a game)
// and hands a dropped host's room to someone who is here.
export function housekeep(s: RoomState, now: number): PartyEvent[] {
  const events: PartyEvent[] = [];
  const gone = s.players.filter((p) => !p.connected && p.leftAt && now >= graceEnd(p) && !playing(s) && s.phase !== 'over');
  if (gone.length) {
    s.players = s.players.filter((p) => !gone.includes(p));
    for (const p of gone) events.push({ kind: 'left', name: p.name });
  }
  const host = s.players.find((p) => p.id === s.hostId);
  const here = s.players.find((p) => p.connected);
  if (!host) s.hostId = here?.id ?? s.players[0]?.id ?? null;
  else if (!host.connected && here && now >= host.leftAt + HOST_HANDOVER_MS) s.hostId = here.id;
  return events;
}

export function leave(s: RoomState, id: string, now: number): PartyEvent[] {
  const p = s.players.find((x) => x.id === id);
  if (!p) return [];
  const events: PartyEvent[] = [{ kind: 'left', name: p.name }];
  s.players = s.players.filter((x) => x.id !== id);
  if (s.hostId === id) s.hostId = s.players.find((x) => x.connected)?.id ?? s.players[0]?.id ?? null;
  s.lastActive = now;
  // Nobody left to play against: the game ends.
  if (playing(s) && s.players.length < 2) events.push(...endGame(s, now));
  return events;
}

export function updateSettings(s: RoomState, by: string, changes: Partial<Settings>, isPublic?: boolean, chart?: unknown): string | undefined {
  if (by !== s.hostId) return 'Only the host can change the room.';
  // Public or private can change at any time; it only affects the lobby list.
  if (typeof isPublic === 'boolean') s.isPublic = isPublic;
  if (chart !== undefined && isChart(chart) && chart !== s.chart) {
    if (s.phase !== 'lobby') return 'Settings can be changed before the game starts.';
    s.chart = chart;
    s.usedSongs = [];
  }
  if (!Object.keys(changes).length) return undefined;
  if (s.phase !== 'lobby') return 'Settings can be changed before the game starts.';
  for (const key of Object.keys(settingRanges) as (keyof Settings)[]) {
    const value = changes[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    const [, min, max, step] = settingRanges[key];
    s.settings[key] = Math.min(max, Math.max(min, Math.round(value / step) * step));
  }
  s.settings.seats = Math.max(s.settings.seats, Math.min(settingRanges.seats[2], s.players.length));
  return undefined;
}

// Songs not yet played in this room come first; once all have been, the list starts over.
function pickSong(s: RoomState, random: Random): Song {
  const used = new Set(s.usedSongs);
  const all = partySongs(s.chart ?? 'US');
  let from = all.filter((x) => !used.has(x.id));
  if (!from.length) {
    s.usedSongs = [];
    from = all.filter((x) => x.id !== s.songId);
  }
  const song = from[Math.floor(random() * from.length)];
  s.usedSongs.push(song.id);
  if (s.usedSongs.length > USED_MAX) s.usedSongs = s.usedSongs.slice(-USED_MAX);
  return song;
}

export function startGame(s: RoomState, by: string, now: number): { events: PartyEvent[]; error?: string } {
  if (by !== s.hostId) return { events: [], error: 'Only the host can start the game.' };
  if (s.phase !== 'lobby') return { events: [], error: s.phase === 'over' ? 'This game has finished.' : 'A game is already running.' };
  if (s.players.filter((p) => p.connected).length < 2) return { events: [], error: 'You need at least 2 players.' };
  for (const p of s.players) Object.assign(p, { score: 0, solved: 0, lockedUntil: 0 });
  s.game += 1;
  s.round = 0;
  s.winnerIds = [];
  s.last = null;
  s.played = [];
  s.songId = null;
  s.clip = null;
  s.guesses = [];
  s.phase = 'countdown';
  s.until = now + COUNTDOWN_MS;
  s.lastActive = now;
  return { events: [{ kind: 'start' }] };
}

// The next song for everyone, starting from the 1-second clip.
function nextRound(s: RoomState, now: number, random: Random): PartyEvent[] {
  const song = pickSong(s, random);
  s.round += 1;
  s.songId = song.id;
  s.songCount += 1;
  s.guesses = [];
  s.clip = { seq: s.songCount, previewUrl: song.previewUrl, trackId: song.trackId, ...(song.store ? { store: song.store } : {}), start: clipStart(song.id, s.game * 7919 + s.songCount) };
  for (const p of s.players) p.lockedUntil = 0;
  s.roundStart = now;
  s.until = now + ROUND_MS;
  s.phase = 'play';
  return [{ kind: 'round', round: s.round }];
}

function endGame(s: RoomState, now: number): PartyEvent[] {
  const top = Math.max(0, ...s.players.map((p) => p.score));
  s.winnerIds = top > 0 ? s.players.filter((p) => p.score === top).map((p) => p.id) : [];
  s.phase = 'over';
  s.clip = null;
  // The results show for a moment, then the room closes (see `finished`).
  s.until = now + RESULTS_MS;
  s.lastActive = now;
  return [{ kind: 'over', winners: s.winnerIds }];
}

// Ends the round: the song is shown to everyone, then the next round (or the results) follows.
function endRound(s: RoomState, now: number, by: Player | null, points: number): Revealed | null {
  const song = s.songId ? songById(s.songId) : undefined;
  const shown = song ? reveal(song) : null;
  s.last = shown ? { ...shown, by: by?.id ?? null, points } : null;
  if (s.last) s.played.push(s.last);
  s.clip = null;
  s.phase = 'reveal';
  s.until = now + REVEAL_MS;
  return shown;
}

// Any player buzzes in with a guess. `pick` is the id of the suggestion they chose, if any.
export function answer(s: RoomState, by: string, raw: string, pick: string | undefined, now: number): PartyEvent[] {
  if (s.phase !== 'play' || !s.clip) return [];
  const player = s.players.find((p) => p.id === by);
  const song = s.songId ? songById(s.songId) : undefined;
  const text = raw.trim().slice(0, 120);
  if (!player || !song || !text || now < player.lockedUntil) return [];
  s.lastActive = now;

  const picked = pick ? songById(pick) : undefined;
  if (!isCorrect(text, song, picked)) {
    const shown = picked ? `${picked.title} · ${picked.artist}` : text;
    player.lockedUntil = now + WRONG_LOCK_MS;
    s.guesses.push({ by, text: shown });
    if (s.guesses.length > 30) s.guesses = s.guesses.slice(-30);
    return [{ kind: 'wrong', by, text: shown }];
  }

  const points = POINTS[levelAt(now - s.roundStart)];
  player.score += points;
  player.solved += 1;
  const shown = endRound(s, now, player, points)!;
  return [{ kind: 'correct', by, song: shown, points }];
}

// Runs whatever is due: the countdown or a reveal ending, or a round running out with no right answer.
export function tick(s: RoomState, now: number, random: Random = Math.random): PartyEvent[] {
  const events: PartyEvent[] = [];
  for (let guard = 0; guard < 4 && s.until && now >= s.until; guard++) {
    if (s.phase === 'countdown' || s.phase === 'reveal') {
      if (s.round >= s.settings.rounds) {
        events.push(...endGame(s, now));
        break;
      }
      events.push(...nextRound(s, now, random));
      continue;
    }
    if (s.phase === 'play') {
      events.push({ kind: 'timeout', song: endRound(s, now, null, 0) });
      continue;
    }
    break;
  }
  return events;
}

// A finished game's room closes once its results have been shown.
export function finished(s: RoomState, now: number): boolean {
  return s.phase === 'over' && now >= s.until;
}

// Private rooms only show their state to seated players; everyone else sees the door.
export function isSeated(s: RoomState, id: string | null): boolean {
  return !!id && s.players.some((p) => p.id === id);
}

export function door(s: RoomState): DoorState {
  return { code: s.code, full: s.players.length >= s.settings.seats, playing: s.phase !== 'lobby' };
}

export function summary(s: RoomState, now: number): RoomSummary | null {
  if (!s.isPublic || !s.players.length || s.phase === 'over') return null;
  const host = s.players.find((p) => p.id === s.hostId) ?? s.players[0];
  return { code: s.code, host: host.name, players: s.players.length, seats: s.settings.seats, chart: s.chart ?? 'US', playing: s.phase !== 'lobby', updated: now };
}

// When the room needs to wake up next: the next game step, a seat's grace period ending, a host
// handover, or the idle clean-up. Only future times count, so the alarm never spins.
export function nextWake(s: RoomState, now: number): number {
  const times: number[] = [];
  if (s.phase !== 'lobby' && s.until) times.push(s.until);
  for (const p of s.players) if (!p.connected && p.leftAt && graceEnd(p) > now) times.push(graceEnd(p));
  const host = s.players.find((p) => p.id === s.hostId);
  if (host && !host.connected && host.leftAt && host.leftAt + HOST_HANDOVER_MS > now) times.push(host.leftAt + HOST_HANDOVER_MS);
  if (s.lastActive + ROOM_IDLE_MS > now) times.push(s.lastActive + ROOM_IDLE_MS);
  return times.length ? Math.min(...times) : now + 60_000;
}
