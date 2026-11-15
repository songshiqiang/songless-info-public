import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CLIPS, POINTS, type SongRef } from '../lib/game';
import { defaultChart, path, serverText, ui } from '../i18n/client';
import {
  avatarEmoji,
  avatars,
  CLOSE_FINISHED,
  LEVEL_AT,
  levelAt,
  listenMs,
  ROUND_MS,
  appleMusicLink,
  CHARTS,
  isChart,
  isCode,
  NAME_MAX,
  settingRanges,
  tableSizes,
  type Avatar,
  type Chart,
  type ClientMessage,
  type DoorState,
  type PartyEvent,
  type PublicState,
  type RoomSummary,
  type ServerMessage,
  type Settings as RoomSettings,
  type TableSize,
} from '../lib/party-shared';
import { partyResultCard } from '../lib/share-image';
import { sfx } from '../lib/sfx';
import ClipPlayer from './ClipPlayer';
import GuessForm from './GuessForm';
import Settings from './Settings';
import ShareImage from './ShareImage';
import { useTitles } from './useLoaded';
import '../styles/party.css';

const PAGE = path('/party');

// Per-tab player id, so two tabs in one browser are two players.
function tabId(): string {
  try {
    let id = sessionStorage.getItem('songless-party-id');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('songless-party-id', id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function readLocal(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not remembered next visit; nothing else depends on it.
  }
}

// Name and avatar are kept per tab, so two tabs keep their own players even
// though both remember the last choice (localStorage) for the next visit.
function readChoice(key: string): string {
  try {
    return sessionStorage.getItem(key) ?? readLocal(key);
  } catch {
    return readLocal(key);
  }
}

function writeChoice(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Falls back to the remembered choice.
  }
  writeLocal(key, value);
}

// The room this tab sat down in, so a reload rejoins without asking again.
const seatKey = (code: string) => `songless-party-seat-${code}`;

// The seat this browser holds in a room: the player ID and the secret token the room gave
// it. Kept in localStorage, so closing the tab and opening the room again (or opening it in
// a second tab) rejoins the same seat without asking.
interface SavedSeat {
  id: string;
  token: string;
  at: number;
}

const SEAT_PREFIX = 'songless-party-room-';
const SEAT_MAX_AGE = 24 * 60 * 60_000;

function savedSeat(code: string): SavedSeat | null {
  try {
    const seat = JSON.parse(localStorage.getItem(SEAT_PREFIX + code) ?? 'null') as SavedSeat | null;
    if (seat && typeof seat.id === 'string' && typeof seat.token === 'string' && Date.now() - seat.at < SEAT_MAX_AGE) return seat;
  } catch {
    // Unreadable: treat as no seat.
  }
  return null;
}

function saveSeat(code: string, seat: SavedSeat | null) {
  try {
    if (seat) localStorage.setItem(SEAT_PREFIX + code, JSON.stringify(seat));
    else localStorage.removeItem(SEAT_PREFIX + code);
  } catch {
    // Without storage, a reload just asks for a seat again.
  }
}

// The room this browser was last seated in. Opening the party page without a room code goes
// straight back to it, until the player quits or the room says the seat is gone.
const CURRENT_KEY = 'songless-party-current';

function currentRoom(value?: string | null): string | null {
  try {
    if (value) localStorage.setItem(CURRENT_KEY, value);
    if (value === null) localStorage.removeItem(CURRENT_KEY);
    return localStorage.getItem(CURRENT_KEY);
  } catch {
    return null;
  }
}

// Forgets this browser's seat in a room, and the room as the one to resume.
function forgetSeat(code: string) {
  saveSeat(code, null);
  if (currentRoom() === code) currentRoom(null);
}

// Drops seats older than a day; rooms close long before that.
function pruneSeats() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(SEAT_PREFIX)) continue;
      const seat = JSON.parse(localStorage.getItem(key) ?? 'null') as SavedSeat | null;
      if (!seat || typeof seat.at !== 'number' || Date.now() - seat.at >= SEAT_MAX_AGE) localStorage.removeItem(key);
    }
  } catch {
    // Nothing to tidy.
  }
}

const CHART_KEY = 'songless-party-chart';
// Flags for the country charts; a chart added later without one shows a globe.
const CHART_FLAGS: Partial<Record<Chart, string>> = { US: '🇺🇸', BR: '🇧🇷', RU: '🇷🇺', ZH: '🀄' };

function savedChart(): Chart {
  try {
    const c = localStorage.getItem(CHART_KEY);
    if (isChart(c)) return c;
  } catch {
    // No storage: use the page language's default.
  }
  return defaultChart;
}

function chartPicker(value: Chart, onPick: (c: Chart) => void, disabled = false) {
  return (
    <div className="chips" role="radiogroup" aria-label={ui.party.songsFrom}>
      {CHARTS.map((c) => (
        <button key={c} type="button" role="radio" aria-checked={value === c} className={value === c ? 'chip active' : 'chip'} onClick={() => onPick(c)} disabled={disabled}>
          {CHART_FLAGS[c] ?? '🌐'} {ui.charts[c]}
        </button>
      ))}
    </div>
  );
}

// Rooms this tab left recently, newest first. Quick play takes the player back to one that is still waiting for players.
const QUIT_KEY = 'songless-party-quit';
const QUIT_MS = 30 * 60_000;

function quitRooms(add?: string): string[] {
  try {
    const now = Date.now();
    let list = (JSON.parse(sessionStorage.getItem(QUIT_KEY) ?? '[]') as [string, number][]).filter(([, at]) => now - at < QUIT_MS);
    if (add) list = [[add, now] as [string, number], ...list.filter(([c]) => c !== add)].slice(0, 20);
    sessionStorage.setItem(QUIT_KEY, JSON.stringify(list));
    return list.map(([c]) => c);
  } catch {
    return add ? [add] : [];
  }
}

function sessionFlag(key: string, value?: boolean): boolean {
  try {
    if (value === true) sessionStorage.setItem(key, '1');
    if (value === false) sessionStorage.removeItem(key);
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function codeFromPath(): string | null {
  const m = location.pathname.slice(PAGE.length).match(/^\/([A-Za-z]{4})$/);
  const code = m?.[1].toUpperCase() ?? null;
  return code && isCode(code) ? code : null;
}

const settingLabels: Record<keyof RoomSettings, [string, (v: number) => string, string]> = {
  rounds: [ui.party.settingSongs, (v) => String(v), ui.party.settingSongsHelp],
  seats: [ui.party.settingSeats, (v) => String(v), ui.party.settingSeatsHelp],
};

// Seat positions on an oval, starting at the bottom so your view feels like a table.
function seatPosition(i: number, n: number): { left: string; top: string } {
  const angle = Math.PI / 2 + (i / n) * Math.PI * 2;
  return { left: `${50 + Math.cos(angle) * 40}%`, top: `${50 + Math.sin(angle) * 36}%` };
}

// Players spread evenly over the seats, so two players face each other instead of sitting side by side.
function slotOf(i: number, players: number, seats: number): number {
  return Math.floor((i * seats) / Math.max(players, 1));
}

interface Bubble {
  key: number;
  text: string;
  tone: 'right' | 'wrong' | 'info';
}

// A native <dialog> shown as a modal while `open` is true.
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="settings" onClose={onClose} aria-label={title}>
      <div className="settings-head">
        <h2>{title}</h2>
      </div>
      {children}
    </dialog>
  );
}

export default function PartyGame() {
  const [code, setCode] = useState<string | null>(null);
  const [me, setMe] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<Avatar>('guitar');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [room, setRoom] = useState<PublicState | null>(null);
  const titles = useTitles([room?.chart ?? 'US'], !!room);
  // The final scores, kept after the room closes so the results dialog stays up until closed.
  const [results, setResults] = useState<PublicState | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  // A private room we haven't sat down in: only whether it is full or mid-game.
  const [doorInfo, setDoorInfo] = useState<DoorState | null>(null);
  const [seated, setSeated] = useState(false);
  const [connected, setConnected] = useState(false);
  const [closed, setClosed] = useState('');
  const [now, setNow] = useState(0);
  const [status, setStatus] = useState('');
  const [bubbles, setBubbles] = useState<Record<string, Bubble>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState<TableSize>('4-6');
  const [hostPublic, setHostPublic] = useState(true);
  // Which country's charts Quick play and new rooms use. Remembered, else the page language's default.
  const [chart, setChartState] = useState<Chart>('US');
  useEffect(() => setChartState(savedChart()), []);
  const setChart = (c: Chart) => {
    setChartState(c);
    try {
      localStorage.setItem(CHART_KEY, c);
    } catch {
      // Not saved; fine.
    }
  };
  const [publicRooms, setPublicRooms] = useState<RoomSummary[] | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const offset = useRef(0);
  const want = useRef<{ name: string; avatar: Avatar } | null>(null);
  // True while this tab is auto-resuming a room it was seated in (opened without a code).
  const resuming = useRef(false);
  const meRef = useRef('');
  const lastTick = useRef(0);
  // How the last game ended, shown in the lobby after the room closes.

  useEffect(() => {
    pruneSeats();
    const id = tabId();
    setMe(id);
    meRef.current = id;
    // No code in the address: resume the room this browser is still seated in, if any.
    const fromPath = codeFromPath();
    const last = fromPath ? null : currentRoom();
    if (last && isCode(last) && savedSeat(last)) {
      resuming.current = true;
      history.replaceState(null, '', `${PAGE}/${last}`);
    } else if (last) {
      currentRoom(null);
    }
    setName(readChoice('songless-party-name'));
    const saved = readChoice('songless-party-avatar') as Avatar;
    if (avatars.includes(saved)) setAvatar(saved);
    setCode(codeFromPath());
    const onPop = () => {
      resuming.current = false;
      setCode(codeFromPath());
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  // The public room list is pushed live over a WebSocket while you are in the lobby.
  // If the socket drops, it reconnects; until then the list is fetched every 10 seconds.
  useEffect(() => {
    if (code !== null || !me) return;
    let stop = false;
    let ws: WebSocket | null = null;
    let retry = 0;
    const show = (rooms: RoomSummary[]) => {
      if (!stop) setPublicRooms(rooms);
    };
    const load = async () => {
      if (ws?.readyState === WebSocket.OPEN) return;
      try {
        const res = await fetch('/api/party/rooms');
        show(((await res.json()) as { rooms: RoomSummary[] }).rooms);
      } catch {
        if (!stop) setPublicRooms((r) => r ?? []);
      }
    };
    const connect = () => {
      if (stop) return;
      ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/party/lobby/ws`);
      ws.onmessage = (e) => {
        try {
          show((JSON.parse(e.data) as { rooms: RoomSummary[] }).rooms);
        } catch {
          // Not a list.
        }
      };
      ws.onopen = () => {
        retry = 0;
      };
      ws.onclose = () => {
        if (!stop) setTimeout(connect, Math.min(15_000, 1000 * 2 ** retry++));
      };
    };
    load();
    connect();
    const id = setInterval(load, 10_000);
    return () => {
      stop = true;
      clearInterval(id);
      ws?.close();
    };
  }, [code, me]);

  // A tab that already sat down in this room (it hosted, or reloaded) rejoins straight away.
  useEffect(() => {
    if (!code) return;
    setRoom(null);
    setDoorInfo(null);
    setClosed('');
    setSeated(false);
    // A seat saved in this browser (an earlier or closed tab) is reclaimed with its own player ID.
    const seat = savedSeat(code);
    setPlayerId(seat?.id ?? tabId());
    if (seat || sessionFlag(seatKey(code)))
      want.current = { name: readChoice('songless-party-name') || ui.party.defaultName, avatar: (readChoice('songless-party-avatar') as Avatar) || 'guitar' };
    else want.current = null;
    return connect(code);
  }, [code]);

  // Leaves a failed auto-resume quietly: the normal lobby, with no error.
  function backToLobby() {
    resuming.current = false;
    want.current = null;
    setStatus('');
    history.replaceState(null, '', PAGE);
    setCode(null);
  }

  function setPlayerId(id: string) {
    meRef.current = id;
    setMe(id);
  }

  function connect(roomCode: string) {
    let stop = false;
    let retry = 0;
    let timer = 0;
    const open = () => {
      const socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/party/rooms/${roomCode}/ws`);
      ws.current = socket;
      socket.onopen = () => {
        retry = 0;
        setConnected(true);
        if (want.current) send({ t: 'join', id: meRef.current, ...want.current, token: savedSeat(roomCode)?.token, resume: resuming.current || undefined });
      };
      socket.onmessage = (e) => onMessage(JSON.parse(e.data) as ServerMessage, roomCode);
      socket.onclose = (e) => {
        setConnected(false);
        if (ws.current === socket) ws.current = null;
        if (stop) return;
        if (e.code === 4404) {
          sessionFlag(seatKey(roomCode), false);
          forgetSeat(roomCode);
          // An auto-resume of a room that has since closed just shows the normal lobby.
          if (resuming.current) return backToLobby();
          setClosed(ui.party.closedRoom);
          return;
        }
        if (e.code === CLOSE_FINISHED) {
          // The game is over and the room is gone: everyone goes back to the party lobby.
          sessionFlag(seatKey(roomCode), false);
          forgetSeat(roomCode);
          want.current = null;
          setStatus('');
          resuming.current = false;
          history.replaceState(null, '', PAGE);
          setCode(null);
          return;
        }
        if (e.code === 4000) {
          // Another tab took this seat. Stay out (no reconnect), so the two tabs don't fight over it.
          sessionFlag(seatKey(roomCode), false);
          want.current = null;
          setClosed(ui.party.otherTab);
          return;
        }
        timer = window.setTimeout(open, Math.min(8000, 500 * 2 ** retry++));
      };
    };
    open();
    return () => {
      stop = true;
      clearTimeout(timer);
      ws.current?.close();
      ws.current = null;
    };
  }

  function send(msg: ClientMessage) {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(msg));
  }

  function onMessage(msg: ServerMessage, roomCode: string) {
    if (msg.t === 'seat') {
      saveSeat(msg.code, { id: meRef.current, token: msg.token, at: Date.now() });
      currentRoom(msg.code);
      resuming.current = false;
      return;
    }
    if (msg.t === 'door') {
      setRoom(null);
      setDoorInfo(msg.door);
      setSeated(false);
      return;
    }
    if (msg.t === 'state') {
      offset.current = msg.now - Date.now();
      setNow(msg.now);
      setDoorInfo(null);
      setRoom(msg.state);
      if (msg.state.phase === 'over') setResults(msg.state);
      const mine = msg.state.players.some((p) => p.id === meRef.current);
      setSeated(mine);
      if (mine) sessionFlag(seatKey(roomCode), true);
      return;
    }
    if (msg.t === 'error') {
      if (msg.join) {
        // The room refused the seat (full, released, or no longer ours): forget it and let
        // this tab take a fresh seat with a new ID if it wants one.
        forgetSeat(roomCode);
        sessionFlag(seatKey(roomCode), false);
        want.current = null;
        if (msg.join === 'taken' || msg.join === 'gone') setPlayerId(crypto.randomUUID());
        // Any other failed auto-resume goes back to the normal lobby without a message.
        if (resuming.current) return backToLobby();
      }
      setStatus(serverText(msg.message));
      return;
    }
    handleEvent(msg.event);
  }

  function bubble(id: string, b: Omit<Bubble, 'key'>) {
    const key = Math.random();
    setBubbles((all) => ({ ...all, [id]: { ...b, key } }));
    setTimeout(() => setBubbles((all) => (all[id]?.key === key ? (({ [id]: _, ...rest }) => rest)(all) : all)), 2200);
  }

  function handleEvent(event: PartyEvent) {
    const mine = (id: string) => id === meRef.current;
    switch (event.kind) {
      case 'start':
      case 'round':
        setStatus('');
        break;
      case 'correct':
        bubble(event.by, { text: `+${event.points}`, tone: 'right' });
        sfx.right();
        break;
      case 'wrong':
        bubble(event.by, { text: '✗', tone: 'wrong' });
        if (mine(event.by)) {
          setStatus(ui.party.wrongGuess);
          sfx.wrong();
        }
        break;
      case 'timeout':
        sfx.miss();
        break;
      case 'over':
        sfx.right();
        break;
    }
  }

  // Keep a local clock running against the server's for the countdown and the swelling mic.
  const live = room && room.phase !== 'lobby';
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(Date.now() + offset.current), 100);
    return () => clearInterval(id);
  }, [live]);

  const clip = room?.phase === 'play' ? room.clip : null;
  const elapsed = room?.phase === 'play' ? Math.max(0, now - room.roundStart) : 0;
  const level = levelAt(elapsed);
  const meNow = room?.players.find((p) => p.id === me);
  const locked = !!meNow && now < meNow.lockedUntil;
  const countdown = room?.phase === 'countdown' ? Math.max(1, Math.ceil((room.until - now) / 1000)) : 0;

  useEffect(() => {
    if (countdown && countdown !== lastTick.current) sfx.skip();
    lastTick.current = countdown;
  }, [countdown]);

  // Wrong-guess messages last until the lockout ends.
  useEffect(() => {
    if (!locked && status === ui.party.wrongGuess) setStatus('');
  }, [locked]);

  // Messages about the last song don't carry over to the next one.
  useEffect(() => {
    if (room?.clip?.seq) setStatus('');
  }, [room?.clip?.seq]);

  // A new song: put the cursor in the guess box.
  useEffect(() => {
    if (clip) (document.querySelector('.party-play .guess-input') as HTMLInputElement | null)?.focus();
  }, [clip?.seq]);

  function remember() {
    const clean = name.trim().slice(0, NAME_MAX) || ui.party.defaultName;
    setName(clean);
    writeChoice('songless-party-name', clean);
    writeChoice('songless-party-avatar', avatar);
    return clean;
  }

  function goTo(next: string | null) {
    resuming.current = false;
    history.pushState(null, '', next ? `${PAGE}/${next}` : PAGE);
    setCode(next);
    window.scrollTo({ top: 0 });
  }

  // Opens a new room (Host) or finds an open public one (Quick play), then goes in.
  async function enter(endpoint: string, body: object) {
    if (busy) return;
    remember();
    setBusy(true);
    setNotice('');
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { code?: string; error?: string };
      if (!data.code) throw new Error(data.error ? serverText(data.error) : ui.party.openFailed);
      sessionFlag(seatKey(data.code), true);
      goTo(data.code);
    } catch (e) {
      setNotice((e as Error).message || ui.party.openFailed);
    } finally {
      setBusy(false);
    }
  }

  const host = () => enter('/api/party/rooms', { isPublic: hostPublic, chart });
  const quickPlay = () => enter('/api/party/quick', { size, back: quitRooms(), chart });

  async function joinByCode(wanted = joinCode.trim().toUpperCase()) {
    if (!isCode(wanted)) {
      setNotice(ui.party.codeFormat);
      return;
    }
    remember();
    setBusy(true);
    setNotice('');
    try {
      const res = await fetch(`/api/party/rooms/${wanted}`);
      if (!res.ok) throw new Error(ui.party.noRoom);
      const info = (await res.json()) as DoorState;
      if (info.full) throw new Error(ui.party.roomFull);
      sessionFlag(seatKey(wanted), true);
      goTo(wanted);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function takeSeat() {
    const clean = remember();
    want.current = { name: clean, avatar };
    send({ t: 'join', id: meRef.current, name: clean, avatar, token: code ? savedSeat(code)?.token : undefined });
  }

  function leaveRoom() {
    setConfirmQuit(false);
    send({ t: 'leave' });
    if (code) {
      quitRooms(code);
      sessionFlag(seatKey(code), false);
      forgetSeat(code);
    }
    want.current = null;
    setStatus('');
    goTo(null);
  }

  function guess(text: string, picked?: SongRef) {
    if (!clip || locked) return;
    send({ t: 'answer', text, pick: picked?.id });
  }

  function changeSetting(key: keyof RoomSettings, dir: number) {
    if (!room) return;
    const [, min, max, step] = settingRanges[key];
    const value = Math.min(max, Math.max(min, room.settings[key] + dir * step));
    send({ t: 'settings', settings: { [key]: value } });
  }

  async function copyInvite() {
    if (!code) return;
    const link = `${location.origin}${PAGE}/${code}`;
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ text: ui.party.inviteText(code), url: link });
      else await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Sharing was cancelled; the code is on screen anyway.
    }
  }

  const head = (
    <div className="game-head">
      <h2>
        {ui.party.title} <span className="tag">{ui.party.multiplayer}</span>
      </h2>
      <Settings mode="party" />
    </div>
  );

  const avatarPicker = (
    <div className="party-avatars" role="radiogroup" aria-label={ui.party.pickInstrument}>
      {avatars.map((a) => (
        <button key={a} type="button" role="radio" aria-checked={avatar === a} aria-label={ui.party.instruments[a]} className={avatar === a ? 'party-avatar on' : 'party-avatar'} onClick={() => setAvatar(a)}>
          {avatarEmoji[a]}
        </button>
      ))}
    </div>
  );

  const nameField = (id: string) => (
    <input
      id={id}
      className="guess-input"
      value={name}
      maxLength={NAME_MAX}
      onChange={(e) => setName(e.target.value)}
      placeholder={ui.yourName}
      aria-label={ui.yourName}
      autoComplete="nickname"
      spellCheck={false}
    />
  );

  // The final scores, in a dialog over the table. It stays open after the room closes.
  const resultsModal = (() => {
    const r = results;
    const name = (id: string) => (id === me ? ui.party.you : (r?.players.find((p) => p.id === id)?.name ?? ui.party.someone));
    const ranked = [...(r?.players ?? [])].sort((a, b) => b.score - a.score || b.solved - a.solved);
    const winners = r?.players.filter((p) => r.winnerIds.includes(p.id)) ?? [];
    const close = () => {
      setResults(null);
      setShareOpen(false);
    };
    const card =
      r &&
      partyResultCard(r.players, me, ui.party.me, r.winnerIds.includes(me), {
        tag: ui.settings.party,
        tagline: ui.shareImage.tagline,
        url: `songless.info${PAGE}`,
        seed: r.game,
      });
    return (
      <Modal open={!!r} onClose={close} title={ui.party.finalScores}>
        {r && (
          <div className="party-over">
            <p className="party-win">
              {winners.length === 0 ? ui.party.nobodyScored : winners.length > 1 ? ui.party.tie(winners.map((w) => (w.id === me ? ui.party.youLower : w.name)).join(ui.party.tieJoin)) : winners[0].id === me ? ui.party.youWin : ui.party.wins(winners[0].name)}
            </p>
            <ol className="party-scores">
              {ranked.map((p) => (
                <li key={p.id}>
                  <span>
                    {avatarEmoji[p.avatar]} {p.name}
                    {p.id === me && ui.party.youTag}
                  </span>
                  <span className="muted">
                    {ui.party.clipScore(p.score, p.solved)}
                  </span>
                </li>
              ))}
            </ol>
            {r.played.length > 0 && (
              <details className="party-played">
                <summary>{ui.party.songsThisGame}</summary>
                <ol>
                  {r.played.map((t, i) => (
                    <li key={i}>
                      <a href={appleMusicLink(t)} target="_blank" rel="noopener">
                        {t.title} · {t.artist}
                      </a>
                      <span className="muted small">{t.by ? `${name(t.by)} +${t.points}` : ui.party.nobody}</span>
                    </li>
                  ))}
                </ol>
              </details>
            )}
            {shareOpen && card && <ShareImage card={card} fileName="songless-party.png" />}
            <div className="settings-actions">
              <button className="btn btn-ghost" onClick={() => setShareOpen((o) => !o)} aria-expanded={shareOpen}>
                {ui.party.share}
              </button>
              <button className="btn btn-primary" onClick={close}>
                {ui.ok}
              </button>
            </div>
          </div>
        )}
      </Modal>
    );
  })();

  // No room yet: pick a name, then Quick play, host, join by code, or pick a public room.
  if (!code) {
    const sizeInfo = tableSizes.find((t) => t.id === size)!;
    return (
      <div className="game party">
        {head}
        {resultsModal}
        <p className="game-sub muted">{ui.party.intro}</p>

        {notice && (
          <p className="party-notice" role="alert">
            {notice}
          </p>
        )}

        <div className="party-lobby">
          <section className="party-box" aria-labelledby="party-who">
            <h3 id="party-who">{ui.party.whoPlaying}</h3>
            {nameField('party-name')}
            {avatarPicker}
            <div className="party-chart">
              <span className="muted small">{ui.party.songsFrom}</span>
              {chartPicker(chart, setChart)}
            </div>
          </section>

          <section className="party-box" aria-labelledby="party-quick">
            <h3 id="party-quick">{ui.party.quickPlay}</h3>
            <div className="chips" role="radiogroup" aria-label={ui.party.tableSize}>
              {tableSizes.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={size === t.id} className={size === t.id ? 'chip active' : 'chip'} onClick={() => setSize(t.id)}>
                  {ui.party.sizes[t.id].label}
                </button>
              ))}
            </div>
            <p className="muted small">{ui.party.quickNote(ui.party.sizes[sizeInfo.id].note)}</p>
            <button className="btn btn-primary btn-block" onClick={quickPlay} disabled={busy}>
              {busy ? ui.party.finding : ui.party.quickPlay}
            </button>
            <section className="party-join" aria-labelledby="party-join">
              <h3 id="party-join">{ui.party.joinWithCode}</h3>
              <form
                className="guess-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  joinByCode();
                }}
              >
                <input
                  className="guess-input party-code-input"
                  value={joinCode}
                  maxLength={4}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                  placeholder="SONG"
                  aria-label={ui.party.roomCode}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button className="btn btn-ghost" type="submit" disabled={busy}>
                  {ui.party.join}
                </button>
              </form>
            </section>
          </section>

          <section className="party-box" aria-labelledby="party-host">
            <h3 id="party-host">{ui.party.host}</h3>
            <div className="chips" role="radiogroup" aria-label={ui.party.privacy}>
              <button type="button" role="radio" aria-checked={hostPublic} className={hostPublic ? 'chip active' : 'chip'} onClick={() => setHostPublic(true)}>
                {ui.party.public}
              </button>
              <button type="button" role="radio" aria-checked={!hostPublic} className={!hostPublic ? 'chip active' : 'chip'} onClick={() => setHostPublic(false)}>
                {ui.party.private}
              </button>
            </div>
            <p className="muted small">{hostPublic ? ui.party.publicNote : ui.party.privateNote}</p>
            <button className="btn btn-primary btn-block" onClick={host} disabled={busy}>
              {ui.party.host}
            </button>
          </section>


          <section className="party-box" aria-labelledby="party-rooms">
            <h3 id="party-rooms">
              {ui.party.publicRooms} <span className="muted small">{publicRooms ? ui.party.openCount(publicRooms.length) : ''}</span>
            </h3>
            {publicRooms === null ? (
              <p className="muted small">{ui.party.looking}</p>
            ) : publicRooms.length === 0 ? (
              <p className="muted small">{ui.party.noRooms}</p>
            ) : (
              <ul className="party-rooms">
                {publicRooms.map((r) => {
                  const full = r.players >= r.seats;
                  return (
                    <li key={r.code}>
                      <button type="button" onClick={() => !full && joinByCode(r.code)} disabled={full || busy}>
                        <b>{r.code}</b>
                        <span className="party-room-meta">
                          <span className="ellipsis">{r.host}</span>
                          <small>
                            {CHART_FLAGS[r.chart ?? 'US'] ?? '🌐'} {ui.charts[r.chart ?? 'US']} · {r.players}/{r.seats} · {r.playing ? ui.party.playing : ui.party.inLobby}
                          </small>
                        </span>
                        <em>{full ? ui.party.full : ui.party.join}</em>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    );
  }

  const isHost = room?.hostId === me;
  const seatsShown = Math.max(room?.settings.seats ?? 2, room?.players.length ?? 0);
  const playerCount = room?.players.length ?? 0;
  const seatOf = new Map(room?.players.map((p, i) => [p.id, slotOf(i, playerCount, seatsShown)]) ?? []);
  const atSlot = new Map(room?.players.map((p) => [seatOf.get(p.id)!, p]) ?? []);
  const ranked = [...(room?.players ?? [])].sort((a, b) => b.score - a.score || b.solved - a.solved);
  const nameOf = (id: string) => (id === me ? ui.party.you : (room?.players.find((p) => p.id === id)?.name ?? ui.party.someone));
  // Seconds until the clip grows (or the round ends), shown to everyone.
  const nextAt = level < LEVEL_AT.length - 1 ? LEVEL_AT[level + 1] : ROUND_MS;
  const secondsLeft = Math.max(0, Math.ceil((nextAt - elapsed) / 1000));
  // The 10-second answer clock only starts once the clip has played.
  const listening = elapsed < LEVEL_AT[level] + listenMs(level);
  const phaseLabel = !room
    ? ''
    : room.phase === 'lobby'
      ? ui.party.phaseWaiting
      : room.phase === 'countdown'
        ? ui.party.phaseReady
        : room.phase === 'over'
          ? ui.party.phaseOver
          : room.phase === 'reveal'
            ? ui.party.phaseAnswer
            : ui.party.phasePlaying;
  const songLabel = !room ? '–' : `${room.phase === 'lobby' || room.phase === 'countdown' ? '–' : room.round}/${room.settings.rounds}`;

  return (
    <div className="game party">
      {head}
      <div className="party-hud">
        <button className="party-chip" onClick={copyInvite} title={ui.party.copyLink}>
          <span>{ui.party.room}</span>
          <strong>{code}</strong>
          <em>{copied ? ui.party.linkCopied : ui.party.copyInvite}</em>
        </button>
        <div className="party-chip">
          <span>{ui.party.players}</span>
          <strong>{room ? `${room.players.length}/${room.settings.seats}` : '–'}</strong>
          <em>{ui.party.inRoom}</em>
        </div>
        <div className="party-chip">
          <span>{ui.party.song}</span>
          <strong>{songLabel}</strong>
          <em>{phaseLabel}</em>
        </div>
        <button className="btn btn-ghost party-quit" onClick={() => setConfirmQuit(true)}>
          {ui.party.quit}
        </button>
      </div>

      <div className="party-stage">
        {Array.from({ length: seatsShown }, (_, i) => {
          const p = atSlot.get(i);
          const b = p ? bubbles[p.id] : undefined;
          const lead = !!p && room?.phase !== 'lobby' && p.score > 0 && p.id === ranked[0]?.id;
          const cls = ['party-seat', p ? '' : 'empty', lead ? 'holder' : '', p && room?.winnerIds.includes(p.id) ? 'winner' : ''].filter(Boolean).join(' ');
          return (
            <div key={i} className={cls} style={seatPosition(i, seatsShown)}>
              {p ? (
                <>
                  <div className="party-face" aria-hidden="true">
                    {avatarEmoji[p.avatar]}
                  </div>
                  <p className="party-name">
                    <span className="ellipsis">{p.name}</span>
                    {p.id === me && <small>{ui.party.youTag}</small>}
                    {p.id === room?.hostId && <small> ★</small>}
                  </p>
                  {!p.connected && <p className="party-wait">{ui.party.away}</p>}
                  {room?.phase !== 'lobby' && <p className="party-score">{p.score}</p>}
                  {b && (
                    <div key={b.key} className={`party-bubble ${b.tone}`}>
                      {b.text}
                    </div>
                  )}
                </>
              ) : (
                <div className="party-face" aria-hidden="true" />
              )}
            </div>
          );
        })}
        {clip && (
          <div className="party-center">
            <ClipPlayer
              compact
              previewUrl={clip.previewUrl}
              trackId={clip.trackId}
              store={clip.store}
              start={clip.start}
              clip={CLIPS[level]}
              autoKey={clip.seq}
              label={ui.party.clipLabel(CLIPS[level], POINTS[level], listening ? ui.party.listen : ui.party.toAnswer(secondsLeft))}
            />
          </div>
        )}
        {room?.phase === 'reveal' && room.last && (
          <div className="party-center">
            <div className={room.last.by ? 'party-answer right' : 'party-answer missed'}>
              {room.last.artwork && <img src={room.last.artwork} alt="" width={48} height={48} />}
              <div>
                <small>{room.last.by ? ui.party.gotIt(nameOf(room.last.by), room.last.points) : ui.party.nobodyGot}</small>
                <strong>{room.last.title}</strong>
                <span>
                  {room.last.artist} ({room.last.year})
                </span>
                <a href={appleMusicLink(room.last)} target="_blank" rel="noopener">
                  {ui.listenApple}
                </a>
              </div>
            </div>
          </div>
        )}
        {room?.phase === 'lobby' && (
          <p className="party-mic idle" style={{ left: '50%', top: '50%' }} aria-hidden="true">
            🎤
          </p>
        )}
        {countdown > 0 && (
          <p className="party-countdown" key={countdown} aria-live="assertive">
            {countdown}
          </p>
        )}
      </div>

      {closed ? (
        <div className="party-box party-panel">
          <p>{closed}</p>
          <button className="btn btn-primary" onClick={() => goTo(null)}>
            {ui.party.backLobby}
          </button>
        </div>
      ) : !room && !doorInfo ? (
        <p className="party-line">{connected ? ui.party.joining : ui.party.connecting}</p>
      ) : !room || !seated ? (
        <div className="party-box party-panel">
          <h3>{ui.party.joinRoom(code)}</h3>
          {nameField('party-seat-name')}
          {avatarPicker}
          {(room ? room.players.length >= room.settings.seats || room.phase === 'over' : doorInfo?.full) ? (
            <p>{room?.phase === 'over' ? ui.party.finished : ui.party.isFull}</p>
          ) : (
            <button className="btn btn-primary btn-block" onClick={takeSeat}>
              {ui.party.takeSeat}
            </button>
          )}
          {(room ? room.phase !== 'lobby' && room.phase !== 'over' : doorInfo?.playing) && <p className="muted small">{ui.party.underWay}</p>}
          {status && <p className="party-notice">{status}</p>}
        </div>
      ) : room.phase === 'lobby' ? (
        <div className="party-box party-panel">
          {isHost ? (
            <>
              <button className="btn btn-primary btn-block" onClick={() => send({ t: 'start' })} disabled={room.players.length < 2}>
                {ui.party.start}
              </button>
              <p className="party-line">
                {room.players.length < 2 ? ui.party.needPlayer : ui.party.ready(room.players.length, room.settings.rounds)}
                {' · '}
                <button className="link-btn" onClick={() => setShowSettings(true)}>
                  {ui.party.roomSettings}
                </button>
              </p>
            </>
          ) : (
            <p className="party-line">{ui.party.waitingFor(room.players.find((p) => p.id === room.hostId)?.name ?? ui.party.theHost)}</p>
          )}
          {status && <p className="party-notice">{status}</p>}
        </div>
      ) : room.phase === 'over' ? (
        <div className="party-box party-panel">
          <p className="party-line">{ui.party.overBack(Math.max(0, Math.ceil((room.until - now) / 1000)))}</p>
          <button className="btn btn-primary" onClick={leaveRoom}>
            {ui.party.backNow}
          </button>
        </div>
      ) : (
        <div className="party-play">
          <p className={`party-line ${clip ? 'mine' : ''}`} aria-live="polite">
            {status ||
              (room.phase === 'countdown'
                ? ui.party.getReady
                : room.phase === 'reveal'
                  ? room.round >= room.settings.rounds
                    ? ui.party.lastSong
                    : ui.party.nextComing
                  : ui.party.nameFirst)}
          </p>
          {clip && <GuessForm songs={titles} onGuess={guess} disabled={locked} />}
          {clip && room.guesses.length > 0 && (
            <ul className="attempts" aria-label={ui.party.wrongGuesses}>
              {room.guesses.slice(-4).map((g, i) => (
                <li key={i} className="attempt attempt-wrong">
                  <span className="attempt-text">
                    {nameOf(g.by)}: {g.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Modal open={showSettings && !!room} onClose={() => setShowSettings(false)} title={ui.party.roomSettings}>
        {room && (
          <ul className="party-settings">
            {(Object.keys(settingRanges) as (keyof RoomSettings)[]).map((key) => {
              const [, min, max] = settingRanges[key];
              const value = room.settings[key];
              const [label, show, help] = settingLabels[key];
              return (
                <li key={key}>
                  <span>
                    {label}
                    <small>{help}</small>
                  </span>
                  <span className="party-stepper">
                    <button className="icon-btn" onClick={() => changeSetting(key, -1)} disabled={!isHost || value <= min} aria-label={ui.party.less(label)}>
                      −
                    </button>
                    <b>{show(value)}</b>
                    <button className="icon-btn" onClick={() => changeSetting(key, 1)} disabled={!isHost || value >= max} aria-label={ui.party.more(label)}>
                      +
                    </button>
                  </span>
                </li>
              );
            })}
            <li className="party-settings-chart">
              <span>
                {ui.party.songsFrom}
                <small>{ui.party.songsFromHelp}</small>
              </span>
              {chartPicker(room.chart ?? 'US', (c) => send({ t: 'settings', settings: {}, chart: c }), !isHost || room.phase !== 'lobby')}
            </li>
            <li>
              <span>
                {ui.party.room}
                <small>{room.isPublic ? ui.party.roomPublicHelp : ui.party.privateNote}</small>
              </span>
              <button className="btn btn-ghost" onClick={() => send({ t: 'settings', settings: {}, isPublic: !room.isPublic })} disabled={!isHost}>
                {room.isPublic ? ui.party.public : ui.party.private}
              </button>
            </li>
          </ul>
        )}
        <div className="settings-actions">
          <button className="btn btn-primary" onClick={() => setShowSettings(false)}>
            {ui.party.done}
          </button>
        </div>
      </Modal>

      <Modal open={confirmQuit} onClose={() => setConfirmQuit(false)} title={ui.party.quitTitle}>
        <p className="muted">
          {room && room.phase !== 'lobby' && room.phase !== 'over' ? ui.party.quitGame : ui.party.quitLobby}
        </p>
        <div className="settings-actions">
          <button className="btn btn-ghost" onClick={() => setConfirmQuit(false)}>
            {ui.cancel}
          </button>
          <button className="btn btn-primary" onClick={leaveRoom}>
            {ui.party.quit}
          </button>
        </div>
      </Modal>
      {resultsModal}
    </div>
  );
}
