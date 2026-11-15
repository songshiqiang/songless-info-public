// A single Durable Object that lists public Songless Party rooms for the lobby.
// Rooms report themselves whenever their line changes and remove themselves when
// they go private, empty or close. Lobby pages hold a WebSocket here and get the
// new list pushed to them on every change.

import { DurableObject } from 'cloudflare:workers';
import type { RoomSummary } from '../lib/party-shared';

// A room that hasn't reported for this long is assumed gone.
const STALE_MS = 35 * 60_000;
const LIST_MAX = 50;

export class RoomDirectory extends DurableObject {
  private rooms: Map<string, RoomSummary> | null = null;

  private async load(): Promise<Map<string, RoomSummary>> {
    this.rooms ??= new Map(Object.entries((await this.ctx.storage.get<Record<string, RoomSummary>>('rooms')) ?? {}));
    return this.rooms;
  }

  private async save(rooms: Map<string, RoomSummary>) {
    await this.ctx.storage.put('rooms', Object.fromEntries(rooms));
  }

  async put(code: string, line: RoomSummary | null) {
    const rooms = await this.load();
    if (line) rooms.set(code, line);
    else if (!rooms.delete(code)) return;
    await this.save(rooms);
    await this.broadcast();
  }

  // A lobby page's WebSocket: it gets the list now and again after every change.
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.send(JSON.stringify({ rooms: await this.list() }));
    return new Response(null, { status: 101, webSocket: client });
  }

  // Lobby pages only listen; anything they send is ignored.
  webSocketMessage() {}

  webSocketClose(ws: WebSocket, code: number) {
    try {
      ws.close(code === 1005 ? 1000 : code);
    } catch {
      // Already closed.
    }
  }

  private async broadcast() {
    const sockets = this.ctx.getWebSockets();
    if (!sockets.length) return;
    const text = JSON.stringify({ rooms: await this.list() });
    for (const ws of sockets) {
      try {
        ws.send(text);
      } catch {
        // That page has gone.
      }
    }
  }

  // Rooms with free seats waiting in the lobby first, then games in progress, then full rooms.
  async list(): Promise<RoomSummary[]> {
    const rooms = await this.load();
    const now = Date.now();
    let dropped = false;
    for (const [code, r] of rooms) {
      if (now - r.updated > STALE_MS) {
        rooms.delete(code);
        dropped = true;
      }
    }
    if (dropped) await this.save(rooms);
    const rank = (r: RoomSummary) => (r.players >= r.seats ? 2 : r.playing ? 1 : 0);
    return [...rooms.values()].sort((a, b) => rank(a) - rank(b) || b.updated - a.updated).slice(0, LIST_MAX);
  }
}
