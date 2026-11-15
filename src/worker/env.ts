import type { PartyRoom } from './room';
import type { RoomDirectory } from './directory';
import type { Leaderboard } from './leaderboard';

export interface Env {
  ASSETS: Fetcher;
  ROOMS: DurableObjectNamespace<PartyRoom>;
  DIRECTORY: DurableObjectNamespace<RoomDirectory>;
  LEADERBOARD: DurableObjectNamespace<Leaderboard>;
}
