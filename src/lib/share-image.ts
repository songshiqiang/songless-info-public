// The picture players post after a game: their score and a waveform per song, lit for as
// long as they had to listen. It never names a song, so it can't spoil anything.
import { CLIPS, MAX_SCORE, POINTS, rungScore, type RungState } from './game';
import type { SaveResult } from './leaderboard';

export const WIDTH = 1080;
export const HEIGHT = 1350;
const PAD = 84;
const ROW_H = 100;
const ROW_GAP = 18;
const SOLO_BARS = 48;
const PARTY_BARS = 28;
const PARTY_NAME_W = 270;
const PARTY_ROWS = 5;

const COLORS = {
  dark: { bg: '#12131a', ink: '#f3f1ea', muted: '#8e8c9c', accent: '#c6f135', rest: '#2e3040', miss: '#ff9f5a', other: '#b8b6c4' },
  lime: { bg: '#c6f135', ink: '#12131a', muted: 'rgba(18,19,26,.72)', accent: '#12131a', rest: 'rgba(18,19,26,.16)', miss: '#12131a', other: 'rgba(18,19,26,.6)' },
};
const FONT = '"Space Grotesk", Inter, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif';

export interface Row {
  /** How much of the waveform is lit, 0 to 1. */
  lit: number;
  tone: 'hit' | 'miss' | 'other';
  label: string;
  name?: string;
}

export interface Card {
  tag: string;
  hero: string;
  suffix: string;
  /** Set when the score has a place on the leaderboard: the card then stacks rank, score and songs. */
  rank?: string;
  rows: Row[];
  tagline: string;
  url: string;
  /** The full lime card, for a perfect score or a party win. */
  lime: boolean;
  seed: number;
}

/** Seconds of clip a song took; null when it was never named. */
export function rungClip(r: RungState): number | null {
  const i = r.attempts.findIndex((a) => a.kind === 'right');
  return i === -1 ? null : CLIPS[i];
}

export const totalScore = (rungs: RungState[]) => rungs.reduce((sum, r) => sum + rungScore(r), 0);

/** A song's row, lit for the clip it took out of the longest one. */
export function soloRow(clip: number | null, seconds: (n: number) => string): Row {
  return clip === null
    ? { lit: 1, tone: 'miss', label: '✕' }
    : { lit: clip / CLIPS[CLIPS.length - 1], tone: 'hit', label: seconds(clip) };
}

interface PartyPlayer {
  id: string;
  name: string;
  score: number;
  solved: number;
}

/** Players tied on score share a place. */
export const partyPlace = (players: PartyPlayer[], score: number) => 1 + players.filter((p) => p.score > score).length;

/** The top of the table as rows, always including this player. */
export function partyRows(players: PartyPlayer[], me: string, meLabel: string): Row[] {
  const ranked = [...players].sort((a, b) => b.score - a.score || b.solved - a.solved);
  const top = ranked.slice(0, PARTY_ROWS);
  const mine = ranked.find((p) => p.id === me);
  if (mine && !top.includes(mine)) top[PARTY_ROWS - 1] = mine;
  const best = ranked[0]?.score || 1;
  return top.map((p) => ({
    lit: p.score / best,
    tone: p.id === me ? 'hit' : 'other',
    label: String(p.score),
    name: `${partyPlace(players, p.score)}  ${p.id === me ? meLabel : p.name}`,
  }));
}

interface CardFrame {
  tag: string;
  tagline: string;
  url: string;
  seed: number;
}

/** A Daily result: the score, and how long each song took. */
export function dailyResultCard(clips: (number | null)[], seconds: (n: number) => string, frame: CardFrame): Card {
  const total = clips.reduce<number>((sum, clip) => sum + (clip === null ? 0 : POINTS[CLIPS.indexOf(clip as (typeof CLIPS)[number])]), 0);
  return {
    ...frame,
    hero: String(total),
    suffix: `/${MAX_SCORE}`,
    rows: clips.map((clip) => soloRow(clip, seconds)),
    lime: total === MAX_SCORE,
  };
}

/** A Party result: this player's score and place, over the leaderboard. */
export function partyResultCard(players: PartyPlayer[], me: string, meLabel: string, won: boolean, frame: CardFrame): Card {
  const mine = players.find((p) => p.id === me);
  return {
    ...frame,
    hero: String(mine?.score ?? Math.max(0, ...players.map((p) => p.score))),
    suffix: mine ? `#${partyPlace(players, mine.score)}` : '',
    rows: partyRows(players, me, meLabel),
    lime: won,
  };
}

/** A saved Unlimited run, showing what the leaderboard holds: place, score and songs. */
export function savedRunCard(
  card: Card,
  { rank, row }: SaveResult,
  labels: { rank: (n: number) => string; points: (n: number) => string; songs: (n: number) => string },
): Card {
  return {
    ...card,
    hero: labels.points(row.score),
    suffix: labels.songs(row.correct),
    rank: labels.rank(rank),
  };
}

/** Bar heights (0 to 1) for one row: made up, the same every time for one seed. */
export function waveBars(count: number, seed: number, row: number): number[] {
  let s = (seed * 977 + row * 131 + 31) % 2147483647 || 1;
  return Array.from({ length: count }, (_, b) => {
    s = (s * 16807) % 2147483647;
    return 0.16 + 0.84 * Math.abs(Math.sin(b * 0.55 + row)) * (0.45 + (0.55 * s) / 2147483647);
  });
}

/** How many bars show as lit; anything above nothing shows at least one. */
export const litBars = (count: number, lit: number) => (lit > 0 ? Math.max(1, Math.round(count * lit)) : 0);

function ellipsize(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let chars = Array.from(text);
  while (chars.length && ctx.measureText(`${chars.join('')}…`).width > max) chars = chars.slice(0, -1);
  return `${chars.join('')}…`;
}

function fontLoads(card: Card) {
  const text = [card.tag, card.hero, card.suffix, card.rank ?? '', card.tagline, card.url, ...card.rows.flatMap((r) => [r.label, r.name ?? ''])].join('');
  const fonts = ['700 46px', '500 34px'].flatMap((f) => [`${f} "Space Grotesk"`, `${f.replace('700', '600')} Inter`]);
  return Promise.all(fonts.map((f) => document.fonts.load(f, text)));
}

/** Waits as long as the fonts take, for when a picture in the wrong font is worse than a late one. */
export const preloadFonts = (cards: Card[]) => Promise.all(cards.map(fontLoads));

/** The fonts arrive from the network; for a player, a picture in a system font beats no picture. */
async function loadFonts(card: Card) {
  await Promise.race([fontLoads(card).catch(() => {}), new Promise((done) => setTimeout(done, 2000))]);
}

export async function renderShareImage(card: Card): Promise<Blob> {
  await loadFonts(card);
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;
  const c = COLORS[card.lime ? 'lime' : 'dark'];
  const right = WIDTH - PAD;
  const font = (weight: number, size: number) => `${weight} ${size}px ${FONT}`;
  const line = (x: number, y1: number, y2: number, width: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
  };

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textBaseline = 'alphabetic';

  // The header: the logo's five bars, the name, what was played.
  const headY = 130;
  [[0, 8], [10, 3], [18, 6], [26, 1], [36, 8]].forEach(([x, inset]) =>
    line(PAD + 6 + x, headY - 34 + inset * 1.5, headY + 8 - inset * 1.5, 5.5, c.accent),
  );
  ctx.textAlign = 'left';
  ctx.fillStyle = c.ink;
  ctx.font = font(700, 46);
  ctx.fillText('Songless', PAD + 72, headY);
  ctx.textAlign = 'right';
  ctx.fillStyle = c.muted;
  ctx.font = font(500, 38);
  ctx.fillText(card.tag, right, headY);

  // The footer. A long address in a long language leaves the tagline less room.
  const footY = 1258;
  ctx.textAlign = 'right';
  ctx.fillStyle = c.accent;
  ctx.font = font(700, 34);
  ctx.fillText(card.url, right, footY);
  const taglineRoom = right - PAD - ctx.measureText(card.url).width - 32;
  let taglineSize = 34;
  ctx.font = font(500, taglineSize);
  while (ctx.measureText(card.tagline).width > taglineRoom && taglineSize > 20) ctx.font = font(500, --taglineSize);
  ctx.textAlign = 'left';
  ctx.fillStyle = c.muted;
  ctx.fillText(card.tagline, PAD, footY);

  // The rows sit on the footer, whatever their number.
  const rowsH = card.rows.length * ROW_H + Math.max(0, card.rows.length - 1) * ROW_GAP;
  const rowsTop = footY - 90 - rowsH;
  card.rows.forEach((row, i) => {
    const mid = rowsTop + i * (ROW_H + ROW_GAP) + ROW_H / 2;
    const count = row.name === undefined ? SOLO_BARS : PARTY_BARS;
    const color = row.tone === 'miss' ? c.miss : row.tone === 'hit' ? c.accent : c.other;
    const labelW = row.name === undefined ? 122 : 150;
    const left = row.name === undefined ? PAD : PAD + PARTY_NAME_W + 20;
    const span = right - labelW - left - 9;
    const lit = litBars(count, row.lit);
    waveBars(count, card.seed, i).forEach((h, b) => {
      const half = (Math.max(0, h * ROW_H - 9)) / 2;
      line(left + 4.5 + (b * span) / (count - 1), mid - half, mid + half, 9, b < lit ? color : c.rest);
    });
    ctx.textBaseline = 'middle';
    if (row.name !== undefined) {
      ctx.textAlign = 'left';
      ctx.fillStyle = row.tone === 'hit' ? c.accent : c.ink;
      ctx.font = font(700, 38);
      ctx.fillText(ellipsize(ctx, row.name, PARTY_NAME_W), PAD, mid);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = color;
    ctx.font = font(700, 46);
    ctx.fillText(row.label, right, mid);
    ctx.textBaseline = 'alphabetic';
  });

  const heroRoom = rowsTop - 60 - (headY + 60);
  ctx.textAlign = 'left';

  if (card.rank) {
    // A ranked run reads top to bottom: place, score, songs.
    const LINES = [1, 0.62, 0.34];
    const LEADING = 1.1;
    const rankSize = Math.min(300, heroRoom / (LINES.reduce((a, b) => a + b, 0) * LEADING));
    let y = headY + 60 + (heroRoom - LINES.reduce((a, b) => a + b, 0) * LEADING * rankSize) / 2;
    [
      { text: card.rank, weight: 700, color: c.accent },
      { text: card.hero, weight: 700, color: c.ink },
      { text: card.suffix, weight: 500, color: c.muted },
    ].forEach(({ text, weight, color }, i) => {
      let size = rankSize * LINES[i];
      y += size * LEADING;
      ctx.font = font(weight, size);
      while (ctx.measureText(text).width > right - PAD && size > 20) ctx.font = font(weight, (size -= 2));
      ctx.fillStyle = color;
      ctx.fillText(text, PAD, y - rankSize * LINES[i] * 0.2);
    });
  } else {
    // The score fills what's left, shrinking if a long run needs more digits.
    const suffixGap = 16;
    let size = Math.min(290, heroRoom * 1.2);
    const suffixSize = () => Math.round(size * 0.25);
    const measure = () => {
      ctx.font = font(700, size);
      const hero = ctx.measureText(card.hero).width;
      ctx.font = font(500, suffixSize());
      return { hero, width: hero + suffixGap + ctx.measureText(card.suffix).width };
    };
    while (measure().width > right - PAD && size > 60) size -= 6;
    const { hero } = measure();
    const base = headY + 60 + heroRoom / 2 + size * 0.36;
    ctx.fillStyle = c.accent;
    ctx.font = font(700, size);
    ctx.fillText(card.hero, PAD, base);
    ctx.fillStyle = c.muted;
    ctx.font = font(500, suffixSize());
    ctx.fillText(card.suffix, PAD + hero + suffixGap, base);
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No image'))), 'image/png'),
  );
}
