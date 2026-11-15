// One Durable Object holding the Songless Unlimited leaderboard in its SQLite
// storage (works on the Workers Free plan, nothing to create in the dashboard).
// Each player keeps one row: their best run. Names are unique and permanent on the board,
// and a password guards each one, so its owner can save from any browser and nobody else can.

import { DurableObject } from 'cloudflare:workers';
import type { Env } from './env';
import { hashPassword, verifyPassword } from './password';
import { BOARD_SIZE, cleanName, nameKey, type BoardRow, type RunSubmission, type SaveResult } from '../lib/leaderboard';

// One save per address this often, so a script can't flood the board.
const SAVE_GAP_MS = 3_000;

interface Row extends Record<string, SqlStorageValue> {
  player: string;
  name: string;
  avatar: string;
  correct: number;
  score: number;
  filter: string;
  at: number;
  /** Hash of the password. Null on rows saved before passwords existed, until their next save. */
  pass?: string | null;
}

const COLS = 'player, name, avatar, correct, score, filter, at';
// Same order as compareRows in src/lib/leaderboard.ts.
const ORDER = 'score DESC, correct DESC, at ASC';

export type SaveOutcome = SaveResult | { error: string; status: number };

export class Leaderboard extends DurableObject {
  private lastSave = new Map<string, number>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS best (
      player TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_key TEXT NOT NULL UNIQUE,
      avatar TEXT NOT NULL DEFAULT '',
      correct INTEGER NOT NULL,
      score INTEGER NOT NULL,
      filter TEXT NOT NULL,
      at INTEGER NOT NULL,
      runs INTEGER NOT NULL DEFAULT 1
    )`);
    ctx.storage.sql.exec(`CREATE INDEX IF NOT EXISTS best_rank ON best (${ORDER})`);
    const hasPass = ctx.storage.sql.exec("SELECT 1 FROM pragma_table_info('best') WHERE name = 'pass'").toArray().length;
    if (!hasPass) ctx.storage.sql.exec('ALTER TABLE best ADD COLUMN pass TEXT');
  }

  private get(player: string): Row | undefined {
    return this.ctx.storage.sql.exec<Row>(`SELECT ${COLS} FROM best WHERE player = ?`, player).toArray()[0];
  }

  private rankOf(r: Pick<Row, 'score' | 'correct' | 'at'>): number {
    const ahead = this.ctx.storage.sql
      .exec<{ n: number }>(
        'SELECT COUNT(*) AS n FROM best WHERE score > ? OR (score = ? AND (correct > ? OR (correct = ? AND at < ?)))',
        r.score, r.score, r.correct, r.correct, r.at
      )
      .one().n;
    return ahead + 1;
  }

  private toBoard(r: Row, rank: number, player?: string): BoardRow {
    return {
      rank,
      name: r.name,
      avatar: r.avatar,
      correct: r.correct,
      score: r.score,
      filter: r.filter,
      at: r.at,
      you: player === r.player || undefined
    };
  }

  async top(player?: string): Promise<{ rows: BoardRow[]; you: BoardRow | null }> {
    const rows = this.ctx.storage.sql
      .exec<Row>(`SELECT ${COLS} FROM best ORDER BY ${ORDER} LIMIT ?`, BOARD_SIZE)
      .toArray()
      .map((r, i) => this.toBoard(r, i + 1, player));
    const mine = player ? this.get(player) : undefined;
    return { rows, you: mine ? this.toBoard(mine, this.rankOf(mine), player) : null };
  }

  /** Saves a checked run. One at a time: hashing yields, and two saves must not both claim a free name. */
  save(run: RunSubmission, ip: string): Promise<SaveOutcome> {
    return this.ctx.blockConcurrencyWhile(() => this.saveNow(run, ip));
  }

  private async saveNow(run: RunSubmission, ip: string): Promise<SaveOutcome> {
    const now = Date.now();
    if (now - (this.lastSave.get(ip) ?? 0) < SAVE_GAP_MS) {
      return { error: 'Saving too fast. Wait a few seconds and try again.', status: 429 };
    }

    const name = cleanName(run.name);
    const key = nameKey(name);
    const sql = this.ctx.storage.sql;
    const old = sql.exec<Row>(`SELECT ${COLS}, pass FROM best WHERE name_key = ?`, key).toArray()[0];
    // A row from before passwords can only be claimed from the browser that saved it.
    if (old && !old.pass && old.player !== run.player) {
      return { error: 'That name is taken. Pick another one.', status: 409 };
    }

    if (!old) {
      const mine = this.get(run.player);
      if (mine) return { error: `Names can't be changed. You saved as ${mine.name}.`, status: 409 };
    }

    // Counted before the password check, so this also limits how fast passwords can be guessed.
    this.lastSave.set(ip, now);
    if (this.lastSave.size > 5000) this.lastSave.clear();

    if (old?.pass && !(await verifyPassword(run.password, old.pass))) {
      return { error: 'Wrong password for this name.', status: 403 };
    }
    const pass = old?.pass ?? (await hashPassword(run.password));
    const player = old?.player ?? run.player;

    const avatar = run.avatar ?? '';
    const filter = (run.filter ?? '').slice(0, 120);
    const better = !old || run.score > old.score || (run.score === old.score && run.correct > old.correct);
    if (!old) {
      sql.exec(
        'INSERT INTO best (player, name, name_key, avatar, correct, score, filter, at, pass) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        player, name, key, avatar, run.correct, run.score, filter, now, pass
      );
    } else if (better) {
      sql.exec(
        'UPDATE best SET avatar = ?, correct = ?, score = ?, filter = ?, at = ?, pass = ?, runs = runs + 1 WHERE player = ?',
        avatar, run.correct, run.score, filter, now, pass, player
      );
    } else {
      // Not a new best, but the player may have changed their avatar.
      sql.exec('UPDATE best SET avatar = ?, pass = ?, runs = runs + 1 WHERE player = ?', avatar, pass, player);
    }
    const row = this.get(player)!;
    const rank = this.rankOf(row);
    return { rank, best: better, player, row: this.toBoard(row, rank, player) };
  }
}
