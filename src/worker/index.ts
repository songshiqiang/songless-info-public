// Worker entry. Static pages are served from ./dist as before; this script only
// handles the API routes: Songless Party (the public room list, creating and
// finding rooms, their WebSockets, and room links) and the Unlimited leaderboard.

import { isChart, isCode, randomCode, tableSizes, type Chart } from '../lib/party-shared';
import type { RoomDirectory } from './directory';
import type { Env } from './env';
import { leaderboardApi } from './leaderboard-api';
export { PartyRoom } from './room';
export { RoomDirectory } from './directory';
export { Leaderboard } from './leaderboard';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

function directory(env: Env): DurableObjectStub<RoomDirectory> {
  return env.DIRECTORY.get(env.DIRECTORY.idFromName('public'));
}

// Picks a free code and opens a room with it.
async function openRoom(env: Env, isPublic: boolean, seats?: number, chart?: Chart): Promise<string | null> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode();
    const room = env.ROOMS.get(env.ROOMS.idFromName(code));
    const res = await room.fetch(`https://room/${code}/open`, { method: 'POST', body: JSON.stringify({ isPublic, seats, chart }) });
    if (res.ok) return code;
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (err) {
      // Answer API calls with JSON, so the page can show a readable message.
      console.error(err);
      if (new URL(request.url).pathname.startsWith('/api/')) return json({ error: 'Something went wrong. Try again.' }, 500);
      throw err;
    }
  },
} satisfies ExportedHandler<Env>;

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/leaderboard') return leaderboardApi(request, env);

  // The lobby's live public room list.
  if (path === '/api/party/lobby/ws') {
    return directory(env).fetch(request);
  }

  if (path === '/api/party/rooms' && request.method === 'GET') {
    return json({ rooms: await directory(env).list() });
  }

  if (path === '/api/party/rooms' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { isPublic?: boolean; chart?: unknown };
    const code = await openRoom(env, body.isPublic === true, undefined, isChart(body.chart) ? body.chart : undefined);
    return code ? json({ code }) : json({ error: 'Could not open a room. Try again.' }, 503);
  }

  // Quick Play: a public room waiting for players, preferring the chosen size, or a new one.
  // Hosted rooms keep their own seat count, so any open room beats opening an empty one.
  if (path === '/api/party/quick' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { size?: string; back?: unknown; chart?: unknown };
    const size = tableSizes.find((t) => t.id === body.size) ?? tableSizes[2];
    // Rooms this player left lately, newest first. If one is still waiting for players, they go back to it.
    const back = Array.isArray(body.back) ? body.back.filter((c): c is string => typeof c === 'string').slice(0, 20) : [];
    // Only rooms playing songs from the player's chosen country charts.
    const chart = isChart(body.chart) ? body.chart : 'US';
    const open = (await directory(env).list()).filter((r) => !r.playing && r.players < r.seats && (r.chart ?? 'US') === chart);
    const again = back.map((c) => open.find((r) => r.code === c)).find(Boolean);
    if (again) return json({ code: again.code });
    const sized = open.filter((r) => r.seats >= size.min && r.seats <= size.max);
    const pool = sized.length ? sized : open;
    if (pool.length) return json({ code: pool[Math.floor(Math.random() * pool.length)].code });
    const code = await openRoom(env, true, size.max, chart);
    return code ? json({ code }) : json({ error: 'Could not open a room. Try again.' }, 503);
  }

  const match = path.match(/^\/api\/party\/rooms\/([A-Za-z]{4})(\/ws)?$/);
  if (match) {
    const code = match[1].toUpperCase();
    if (!isCode(code)) return json({ error: 'No such room.' }, 404);
    const room = env.ROOMS.get(env.ROOMS.idFromName(code));
    if (match[2]) return room.fetch(new Request(`https://room/${code}/ws`, request));
    return room.fetch(`https://room/${code}/info`);
  }

  // Room links like /party/ABCD or /zh/party/ABCD open the Songless Party page in that language, which reads the code from the URL.
  const roomLink = path.match(/^(\/(?:zh|ru|pt-br))?\/party\/[A-Za-z]{4}$/);
  if (roomLink) {
    return env.ASSETS.fetch(new Request(new URL(`${roomLink[1] ?? ''}/party`, url), request));
  }

  if (path.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
  return env.ASSETS.fetch(request);
}
