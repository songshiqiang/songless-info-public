// The leaderboard identity this browser keeps: a random player id (which owns the
// player's name on the board) and the name and avatar they last saved with.

import { load, save } from './storage';

const PLAYER_KEY = 'songless:player';
const PROFILE_KEY = 'songless:profile';

export interface Profile {
  name: string;
  avatar: string;
}

function randomId(): string {
  try {
    return crypto.randomUUID().replace(/-/g, '');
  } catch {
    return Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
  }
}

/** This browser's player id, created on first use. */
export function playerId(): string {
  let id = load<string>(PLAYER_KEY, '');
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
    id = randomId();
    save(PLAYER_KEY, id);
  }
  return id;
}

/** The player id if this browser has one already (so viewing the board doesn't create one). */
export const knownPlayerId = (): string | undefined => load<string>(PLAYER_KEY, '') || undefined;

/** Takes on the id that owns the player's name, after they proved it with the password. */
export const adoptPlayerId = (id: string) => save(PLAYER_KEY, id);

export const loadProfile = (): Profile => ({ name: '', avatar: '', ...load<Partial<Profile>>(PROFILE_KEY, {}) });
export const saveProfile = (p: Profile) => save(PROFILE_KEY, p);
