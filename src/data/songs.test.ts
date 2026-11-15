import { describe, expect, it } from 'vitest';
import { CHARTS, POOL_SHARD, chartOf, poolShardNames } from '../lib/game';
import { pool, poolRows, poolShards, refs, songs } from './songs';

describe('poolShardNames', () => {
  it('numbers each country from 1, moving on every POOL_SHARD songs', () => {
    const charts = [...Array(POOL_SHARD + 1).fill('US'), 'BR'];
    const names = poolShardNames(charts);
    expect(names[0]).toBe('us-1');
    expect(names[POOL_SHARD - 1]).toBe('us-1');
    expect(names[POOL_SHARD]).toBe('us-2');
    expect(names[POOL_SHARD + 1]).toBe('br-1');
  });
});

describe('title files', () => {
  it('together cover every song', () => {
    const ids = CHARTS.flatMap((c) => refs(c).map(([id]) => id));
    expect(new Set(ids)).toEqual(new Set(songs.map((s) => s.id)));
  });

  it('suggest every answer from its own country', () => {
    for (const s of pool) expect(refs(chartOf(s)).some(([id]) => id === s.id)).toBe(true);
  });
});

describe('pool files', () => {
  it('lists every answer in the index', () => {
    expect(poolRows().map(([id]) => id)).toEqual(pool.map((s) => s.id));
  });

  it('finds each song in the shard the index points to', () => {
    const rows = poolRows();
    const names = poolShardNames(rows.map((r) => r[3]));
    rows.forEach(([id], i) => {
      expect(poolShards[names[i]].some((s) => s.id === id)).toBe(true);
    });
  });

  it('keeps each file to one country and POOL_SHARD songs', () => {
    for (const [name, songs] of Object.entries(poolShards)) {
      expect(songs.length).toBeLessThanOrEqual(POOL_SHARD);
      expect(songs.every((s) => (s.chart ?? 'US').toLowerCase() === name.split('-')[0])).toBe(true);
    }
  });
});
