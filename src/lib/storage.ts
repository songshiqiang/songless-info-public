// localStorage can be missing or throw (private mode, blocked storage), so
// every access is guarded and the game still works without it.

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore: progress just won't persist.
  }
}

export interface DailyStats {
  played: number;
  best: number;
  streak: number;
  maxStreak: number;
  lastLadder: number;
}

export const emptyDailyStats: DailyStats = { played: 0, best: 0, streak: 0, maxStreak: 0, lastLadder: 0 };

/** Records a finished ladder. A streak counts consecutive days played. */
export function recordDaily(stats: DailyStats, num: number, score: number): DailyStats {
  if (stats.lastLadder >= num) return stats;
  const streak = stats.lastLadder === num - 1 ? stats.streak + 1 : 1;
  return {
    played: stats.played + 1,
    best: Math.max(stats.best, score),
    streak,
    maxStreak: Math.max(stats.maxStreak, streak),
    lastLadder: num
  };
}
