import { describe, expect, it } from 'vitest';
import type { Song } from './game';
import { libraryStats } from './library';

const song = (over: Partial<Song>): Song =>
  ({ id: 'x', title: 'T', artist: 'A', year: 2000, decade: '00s', trackId: 1, previewUrl: '', pool: true, ...over }) as Song;

describe('libraryStats', () => {
  const stats = libraryStats([
    song({ artist: 'A', year: 1985, decade: '80s', genre: 'Rock' }),
    song({ artist: 'A', year: 2021, decade: '20s', genre: 'Rock', chart: 'ZH' }),
    song({ artist: 'B', genre: undefined }),
    song({ artist: 'C', year: 1970, pool: false })
  ]);

  it('counts answers apart from guess suggestions', () => {
    expect(stats.suggestions).toBe(4);
    expect(stats.answers).toBe(3);
    expect(stats.artists).toBe(2);
    expect([stats.firstYear, stats.lastYear]).toEqual([1985, 2021]);
  });

  it('keeps the decade order and sorts genres by size', () => {
    expect(stats.decades[0]).toEqual(['80s', 1]);
    expect(stats.decades[2]).toEqual(['00s', 1]);
    expect(stats.genres[0]).toEqual(['Rock', 2]);
  });

  it('treats a missing genre as Pop and a missing chart as the US', () => {
    expect(stats.genres).toContainEqual(['Pop', 1]);
    expect(stats.charts).toContainEqual(['USA', 2]);
    expect(stats.charts).toContainEqual(['Chinese', 1]);
  });

  it('ranks artists by answers', () => {
    expect(stats.topArtists[0]).toEqual(['A', 2]);
  });
});
