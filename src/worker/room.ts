// One Durable Object per Songless Party room, named by its code. It holds the
// players' WebSockets (hibernating between messages), keeps the room state in
// storage, and uses a single alarm for the countdown, the rounds and clean-up.

import { DurableObject } from 'cloudflare:workers';
import {
  answer,
  CLOSE_FINISHED,
  finished,
  createRoom,
  disconnect,
  door,
  housekeep,
  isSeated,
  join,
  leave,
  nextWake,
  publicState,
  startGame,
  summary,
  tick,
  updateSettings,
  ROOM_IDLE_MS,
  type Chart,
  type ClientMessage,
  type PartyEvent,
  type RoomState,
  type ServerMessage,
} from '../lib/party';
import type { Env } from './env';

// 128 random bits, as hex.
function newSeatToken(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface Attachment {
  id: string | null;
}

export class PartyRoom extends DurableObject<Env> {
  private state: RoomState | null | undefined;
  // The room's line in the public list as last reported, so unchanged lines aren't resent.
  private listed: string | undefined;

  private async load(): Promise<RoomState | null> {
    if (this.state === undefined) {
      this.state = (await this.ctx.storage.get<RoomState>('room')) ?? null;
    }
    return this.state;
  }

  private async save(s: RoomState) {
    this.state = s;
    await this.ctx.storage.put('room', s);
    // One alarm covers the game clock, seat grace periods, host handover and the idle clean-up,
    // so all of them happen even when nobody is connected. nextWake only returns future times.
    const now = Date.now();
    await this.ctx.storage.setAlarm(Math.max(nextWake(s, now), now + 50));
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const [, code, action] = url.pathname.split('/');

    if (action === 'open') {
      if (await this.load()) return new Response('taken', { status: 409 });
      const options = (await request.json().catch(() => ({}))) as { isPublic?: boolean; seats?: number; chart?: Chart };
      await this.save(createRoom(code, Date.now(), { isPublic: options.isPublic === true, seats: options.seats, chart: options.chart }));
      return new Response('ok');
    }

    const s = await this.load();
    if (action === 'info') {
      if (!s) return Response.json({ error: 'No such room.' }, { status: 404 });
      // Only what the join screen needs; private rooms don't even say how many are inside.
      const info = door(s);
      return Response.json(s.isPublic ? { ...info, players: s.players.length, seats: s.settings.seats } : info);
    }

    if (action === 'ws') {
      if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      pair[1].serializeAttachment({ id: null } satisfies Attachment);
      if (!s) {
        this.send(pair[1], { t: 'error', message: 'This room has closed or never existed. Check the code.' });
        pair[1].close(4404, 'No such room');
      } else {
        // A public room shows straight away, so the visitor sees who is there before taking a seat.
        // A private room only shows its door until this connection takes a seat.
        this.send(pair[1], this.view(s, null));
      }
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    return new Response('Not found', { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const s = await this.load();
    if (!s || typeof raw !== 'string' || raw.length > 2000) return;
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    const now = Date.now();
    const me = (ws.deserializeAttachment() as Attachment).id;
    let events: PartyEvent[] = [];
    let error: string | undefined;
    let refused: 'full' | 'taken' | 'gone' | undefined;

    if (msg.t === 'join') {
      const id = String(msg.id ?? '').slice(0, 40);
      if (!id) return;
      const token = typeof msg.token === 'string' ? msg.token.slice(0, 100) : undefined;
      const result = join(s, id, String(msg.name ?? ''), msg.avatar, now, token, newSeatToken, msg.resume === true);
      error = result.error;
      refused = result.refused;
      events = result.events;
      if (!error && result.token) {
        // One socket per player: only a tab that proved it holds the seat replaces the old socket.
        for (const other of this.ctx.getWebSockets()) {
          if (other !== ws && (other.deserializeAttachment() as Attachment).id === id) {
            other.serializeAttachment({ id: null } satisfies Attachment);
            other.close(4000, 'Opened in another tab');
          }
        }
        ws.serializeAttachment({ id } satisfies Attachment);
        this.send(ws, { t: 'seat', code: s.code, token: result.token });
      }
    } else if (!me) {
      return;
    } else if (msg.t === 'settings') {
      error = updateSettings(s, me, msg.settings ?? {}, msg.isPublic, msg.chart);
    } else if (msg.t === 'start') {
      const result = startGame(s, me, now);
      error = result.error;
      events = result.events;
    } else if (msg.t === 'answer') {
      events = answer(s, me, String(msg.text ?? ''), typeof msg.pick === 'string' ? msg.pick.slice(0, 120) : undefined, now);
    } else if (msg.t === 'leave') {
      events = leave(s, me, now);
      ws.serializeAttachment({ id: null } satisfies Attachment);
    }

    if (error) this.send(ws, { t: 'error', message: error, ...(refused && { join: refused }) });
    await this.commit(s, events);
  }

  async webSocketClose(ws: WebSocket) {
    await this.dropped(ws);
  }

  async webSocketError(ws: WebSocket) {
    await this.dropped(ws);
  }

  private async dropped(ws: WebSocket) {
    const id = (ws.deserializeAttachment() as Attachment | null)?.id;
    const s = await this.load();
    if (!s || !id) return;
    await this.commit(s, disconnect(s, id, Date.now()));
  }

  async alarm() {
    const s = await this.load();
    if (!s) return;
    const now = Date.now();
    if (this.ctx.getWebSockets().length === 0 && now - s.lastActive >= ROOM_IDLE_MS) {
      // Nobody has been here for a while: close the room and free its code.
      this.state = null;
      await this.ctx.storage.deleteAll();
      await this.report(s.code, null);
      return;
    }
    if (finished(s, now)) {
      // The game is over and everyone has seen the results: send them back to the lobby and
      // delete the room, so nobody lands in it again.
      for (const ws of this.ctx.getWebSockets()) {
        try {
          ws.close(CLOSE_FINISHED, 'Game over');
        } catch {
          // Already closing.
        }
      }
      this.state = null;
      await this.ctx.storage.deleteAll();
      await this.report(s.code, null);
      return;
    }
    await this.commit(s, tick(s, now));
  }

  private async commit(s: RoomState, events: PartyEvent[]) {
    events.push(...housekeep(s, Date.now()));
    await this.save(s);
    const line = summary(s, Date.now());
    await this.report(s.code, line);
    const now = Date.now();
    const state = JSON.stringify({ t: 'state', state: publicState(s), now } satisfies ServerMessage);
    const shut = JSON.stringify({ t: 'door', door: door(s) } satisfies ServerMessage);
    const sent = events.map((event) => JSON.stringify({ t: 'event', event } satisfies ServerMessage));
    for (const ws of this.ctx.getWebSockets()) {
      // In a private room, names, answers, scores and events only go to seated players.
      if (this.canSee(s, ws)) {
        for (const text of sent) this.sendText(ws, text);
        this.sendText(ws, state);
      } else {
        this.sendText(ws, shut);
      }
    }
  }

  private canSee(s: RoomState, ws: WebSocket): boolean {
    if (s.isPublic) return true;
    return isSeated(s, (ws.deserializeAttachment() as Attachment | null)?.id ?? null);
  }

  // What a connection is shown: the room, or (private room, not seated) only its door.
  private view(s: RoomState, id: string | null): ServerMessage {
    return s.isPublic || isSeated(s, id) ? { t: 'state', state: publicState(s), now: Date.now() } : { t: 'door', door: door(s) };
  }

  // Keeps the lobby's public room list in step with this room. A failed report only
  // means the list is briefly out of date, so it never blocks the game.
  private async report(code: string, line: ReturnType<typeof summary>) {
    const key = line ? JSON.stringify({ ...line, updated: 0 }) : '';
    if (key === this.listed) return;
    try {
      await this.env.DIRECTORY.get(this.env.DIRECTORY.idFromName('public')).put(code, line);
      this.listed = key;
    } catch {
      // Retried with the next change.
    }
  }

  private sendText(ws: WebSocket, text: string) {
    try {
      ws.send(text);
    } catch {
      // A socket that is closing is cleaned up by webSocketClose.
    }
  }

  private send(ws: WebSocket, msg: ServerMessage) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // Closed already.
    }
  }
}
