// What the Songless Party room server and the browser share: limits, settings,
// and the messages they send each other. Kept apart from the rules in party.ts
// so the page doesn't have to load the song library.

export const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O, so codes read cleanly
export const NAME_MAX = 16;
export const COUNTDOWN_MS = 3000;
import { CHARTS, CLIPS, type Chart } from './game';

export { CHARTS, CHART_NAMES, type Chart } from './game';
export const isChart = (x: unknown): x is Chart => (CHARTS as readonly unknown[]).includes(x);

// Every round, everyone hears the same clip. It starts at 1 second. Once a clip has played,
// players get ANSWER_MS to name the song; if nobody does, the clip grows to 3, 6 and then
// 12 seconds and plays again. Points follow the clip, as in the Daily Ladder.
export const ANSWER_MS = 10_000;
// Allowance for the clip to load and start on every player's device.
export const PLAY_SLACK_MS = 1000;
/** How long a clip takes to play, from the start of its stage. */
export const listenMs = (level: number) => CLIPS[level] * 1000 + PLAY_SLACK_MS;
// When each clip length starts, in ms into the round: [0, 12000, 26000, 43000].
export const LEVEL_AT: readonly number[] = CLIPS.reduce<number[]>((at, _, i) => [...at, i === 0 ? 0 : at[i - 1] + listenMs(i - 1) + ANSWER_MS], []);
// A round with no right answer ends after the 12-second clip and its answer time.
export const ROUND_MS = LEVEL_AT[LEVEL_AT.length - 1] + listenMs(CLIPS.length - 1) + ANSWER_MS;
// After a round, the song is shown this long before the next one.
export const REVEAL_MS = 5000;
// A wrong guess locks that player out for this long.
export const WRONG_LOCK_MS = 2000;
// After a game the results show this long, then the room closes and everyone goes back to the lobby.
export const RESULTS_MS = 8000;
// WebSocket close code the room sends when it closes after a game.
export const CLOSE_FINISHED = 4410;
// Empty rooms are cleared after this long.
export const ROOM_IDLE_MS = 30 * 60_000;
// A dropped player's seat is held this long.
export const SEAT_GRACE_MS = 60_000;
// A dropped host hands the room to a connected player after this long.
export const HOST_HANDOVER_MS = 12_000;

/** Which clip (index into CLIPS) is unlocked this many ms into a round. */
export function levelAt(elapsed: number): number {
  let level = 0;
  for (let i = 0; i < LEVEL_AT.length; i++) if (elapsed >= LEVEL_AT[i]) level = i;
  return level;
}

export const avatars = ['guitar', 'drums', 'keys', 'sax', 'trumpet', 'violin', 'headphones', 'radio'] as const;
export type Avatar = (typeof avatars)[number];
export const avatarEmoji: Record<Avatar, string> = {
  guitar: '🎸',
  drums: '🥁',
  keys: '🎹',
  sax: '🎷',
  trumpet: '🎺',
  violin: '🎻',
  headphones: '🎧',
  radio: '📻',
};

export interface Settings {
  rounds: number; // songs per game
  seats: number;
}

// Each setting: default, lowest, highest, step.
export const settingRanges: Record<keyof Settings, [number, number, number, number]> = {
  rounds: [10, 5, 20, 1],
  seats: [8, 2, 10, 1],
};

export const defaultSettings = Object.fromEntries(
  Object.entries(settingRanges).map(([k, [d]]) => [k, d]),
) as unknown as Settings;

export interface Player {
  id: string;
  name: string;
  avatar: Avatar;
  connected: boolean;
  score: number;
  // Songs this player named first this game.
  solved: number;
  // A wrong guess locks the player out until this time.
  lockedUntil: number;
  // Secret handed only to this player's tab when it takes the seat. Reclaiming the seat
  // (reconnect, reload) needs it, so a player ID seen by others can't take the seat over.
  token: string;
  // When the player's tab disconnected; 0 while connected. Drives the seat grace period.
  leftAt: number;
}

// A song once a round is over: safe to show everyone.
export interface Revealed {
  title: string;
  artist: string;
  year: number;
  artwork?: string;
  trackId: number;
  // iTunes storefront of trackId when it isn't the US one.
  store?: string;
}

export const appleMusicLink = (t: Pick<Revealed, 'trackId' | 'store'>) => `https://music.apple.com/${(t.store ?? 'us').toLowerCase()}/song/${t.trackId}`;

// What the browsers need to play the round's clip, without the song's name.
export interface Clip {
  // Changes with every new song, so players restart their audio.
  seq: number;
  previewUrl: string;
  trackId: number;
  store?: string;
  start: number;
}

export interface Guess {
  by: string;
  text: string;
}

export type Phase = 'lobby' | 'countdown' | 'play' | 'reveal' | 'over';

export interface RoomState {
  code: string;
  // Public rooms show in the lobby's room list; private ones are joined by code only.
  isPublic: boolean;
  // Which country's charts the songs come from.
  chart: Chart;
  created: number;
  lastActive: number;
  hostId: string | null;
  settings: Settings;
  players: Player[];
  phase: Phase;
  game: number;
  // When the countdown, round, reveal or results end.
  until: number;
  round: number;
  roundStart: number;
  // The round's song: server only.
  songId: string | null;
  clip: Clip | null;
  // Wrong guesses this round.
  guesses: Guess[];
  // The last round's song and who named it (null when nobody did).
  last: (Revealed & { by: string | null; points: number }) | null;
  // Every song of this game so far, for the results screen.
  played: (Revealed & { by: string | null; points: number })[];
  songCount: number;
  usedSongs: string[];
  winnerIds: string[];
}

// What every client sees. The song's name is left out so nobody can read it from the network.
export interface PublicState {
  code: string;
  isPublic: boolean;
  chart: Chart;
  hostId: string | null;
  settings: Settings;
  players: Omit<Player, 'token' | 'leftAt'>[];
  phase: Phase;
  game: number;
  until: number;
  round: number;
  roundStart: number;
  clip: Clip | null;
  guesses: Guess[];
  last: RoomState['last'];
  played: RoomState['played'];
  winnerIds: string[];
}

// What a connection that hasn't taken a seat in a private room is told: only enough for the
// join screen. No names, songs, scores or settings.
export interface DoorState {
  code: string;
  full: boolean;
  playing: boolean;
}

export type PartyEvent =
  | { kind: 'correct'; by: string; song: Revealed; points: number }
  | { kind: 'wrong'; by: string; text: string }
  | { kind: 'timeout'; song: Revealed | null }
  | { kind: 'round'; round: number }
  | { kind: 'joined'; name: string }
  | { kind: 'left'; name: string }
  | { kind: 'start' }
  | { kind: 'over'; winners: string[] };

export type ClientMessage =
  // `resume`: only reclaim an existing seat (auto-resume after the tab was closed), never take a new one.
  | { t: 'join'; id: string; name: string; avatar: Avatar; token?: string; resume?: boolean }
  | { t: 'settings'; settings: Partial<Settings>; isPublic?: boolean; chart?: Chart }
  | { t: 'start' }
  // `pick`: the id of the suggestion the player chose, if they chose one.
  | { t: 'answer'; text: string; pick?: string }
  | { t: 'leave' };

export type ServerMessage =
  | { t: 'state'; state: PublicState; now: number }
  | { t: 'door'; door: DoorState }
  // Sent only to the tab that just took a seat.
  | { t: 'seat'; code: string; token: string }
  | { t: 'event'; event: PartyEvent }
  // `join` is set when a join was refused: the room is full, finished, or that seat belongs to someone else.
  | { t: 'error'; message: string; join?: 'full' | 'taken' | 'gone' };

// One line of the lobby's public room list.
export interface RoomSummary {
  code: string;
  host: string;
  players: number;
  seats: number;
  chart: Chart;
  playing: boolean;
  updated: number;
}

// Table sizes for Quick Play: the range of seats a room should have.
export const tableSizes = [
  { id: '1v1', label: '1v1', min: 2, max: 2, note: 'Just you and one other' },
  { id: '3s', label: '3s', min: 3, max: 3, note: 'Three players' },
  { id: '4-6', label: '4–6', min: 4, max: 6, note: '4 to 6 players' },
  { id: '8-10', label: '8–10', min: 7, max: 10, note: '8 to 10 players' },
] as const;
export type TableSize = (typeof tableSizes)[number]['id'];

type Random = () => number;

export function randomCode(random: Random = Math.random): string {
  return Array.from({ length: 4 }, () => CODE_LETTERS[Math.floor(random() * CODE_LETTERS.length)]).join('');
}

export function isCode(text: string): boolean {
  return new RegExp(`^[${CODE_LETTERS}]{4}$`).test(text);
}

const blocked = ['fuck', 'shit', 'cunt', 'nigg', 'fag', 'bitch', 'whore', 'slut', 'rape', 'nazi', 'hitler', 'penis', 'vagina', 'cock', 'dick', 'porn', 'sex'];

// Names show to everyone in the room, so trim them and refuse obvious slurs.
export function cleanName(raw: string): string {
  const name = raw.replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  const flat = name.toLowerCase().replace(/[^a-z]/g, '').replace(/0/g, 'o');
  if (!name || blocked.some((w) => flat.includes(w))) return 'Player';
  return name;
}
