import { describe, expect, it } from 'vitest';
import type { RungState, Song } from './game';
import { buildRecord, summarize, upsertRecord } from './history';

const song = (n: number): Song =>
  ({ id: `s${n}`, title: `Title ${n}`, artist: `Artist ${n}`, previewUrl: '', trackId: n }) as unknown as Song;
const ladder = [1, 2, 3, 4, 5].map(song);
const rungs: RungState[] = [
  { attempts: [{ kind: 'right', text: 'x' }] },
  { attempts: [{ kind: 'skip' }, { kind: 'right', text: 'x' }] },
  { attempts: [{ kind: 'skip' }, { kind: 'skip' }, { kind: 'skip' }, { kind: 'skip' }] },
  { attempts: [{ kind: 'wrong', text: 'y' }, { kind: 'skip' }, { kind: 'right', text: 'x' }] },
  { attempts: [{ kind: 'skip' }, { kind: 'skip' }, { kind: 'skip' }, { kind: 'right', text: 'x' }] }
];

describe('history', () => {
  it('builds a self-contained record', () => {
    const r = buildRecord(1, ladder, rungs, 'US', new Date('2026-11-02T10:00:00Z'));
    expect(r.songs.map((s) => s.solvedAt)).toEqual([1, 3, null, 6, 12]);
    expect(r.total).toBe(100 + 70 + 0 + 40 + 20);
    expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.songs[0].title).toBe('Title 1');
  });

  it('replaces an earlier save of the same ladder and sorts newest first', () => {
    const a = buildRecord(3, ladder, rungs);
    const b = buildRecord(5, ladder, rungs);
    const a2 = { ...a, total: 1 };
    const list = upsertRecord(upsertRecord(upsertRecord([], a), b), a2);
    expect(list.map((r) => r.num)).toEqual([5, 3]);
    expect(list[1].total).toBe(1);
  });

  it('keeps each country\'s ladder of the same day apart', () => {
    const us = { ...buildRecord(3, ladder, rungs), chart: undefined };
    const br = buildRecord(3, ladder, rungs, 'BR');
    expect(upsertRecord([us], br)).toHaveLength(2);
    expect(upsertRecord([us, br], { ...buildRecord(3, ladder, rungs), total: 1 }).map((r) => r.total)).toContain(1);
    expect(upsertRecord([us, br], buildRecord(3, ladder, rungs))).toHaveLength(2);
  });

  it('summarizes saved days', () => {
    const list = [buildRecord(1, ladder, rungs), { ...buildRecord(2, ladder, rungs), total: 500 }];
    expect(summarize(list)).toEqual({ days: 2, average: 365, best: 500, solved: 8, songs: 10 });
    expect(summarize([]).average).toBe(0);
  });
});
