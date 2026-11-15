// /api/leaderboard: GET the top runs (and, with ?player=, that player's own row),
// POST a finished Songless Unlimited run.

import { checkRun, type RunSubmission } from '../lib/leaderboard';
import type { Env } from './env';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function leaderboardApi(request: Request, env: Env): Promise<Response> {
  const board = env.LEADERBOARD.get(env.LEADERBOARD.idFromName('unlimited'));
  if (request.method === 'GET') {
    const player = new URL(request.url).searchParams.get('player') ?? undefined;
    return json(await board.top(player && /^[A-Za-z0-9_-]{8,64}$/.test(player) ? player : undefined));
  }
  if (request.method === 'POST') {
    const run = (await request.json().catch(() => ({}))) as Partial<RunSubmission>;
    const error = checkRun(run);
    if (error) return json({ error }, 400);
    const ip = request.headers.get('cf-connecting-ip') ?? 'local';
    const saved = await board.save(run as RunSubmission, ip);
    return 'error' in saved ? json({ error: saved.error }, saved.status) : json(saved);
  }
  return json({ error: 'Method not allowed.' }, 405);
}
