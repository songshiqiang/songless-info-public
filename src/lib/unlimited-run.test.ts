import { describe, expect, it } from 'vitest';
import type { Song } from './game';
import { parseRun } from './unlimited-run';

const songs = [{ id: 'a' }, { id: 'b' }] as unknown as Song[];
const saved = {
  song: 'b',
  rung: { attempts: [{ kind: 'skip' as const }] },
  correct: 3,
  points: 240,
  recent: ['a'],
  salt: 42
};

describe('parseRun', () => {
  it('restores a run with its song, clip and score', () => {
    expect(parseRun(saved, songs)).toEqual({ ...saved, song: songs[1] });
  });

  it('keeps a run mid-song even before the first point', () => {
    expect(parseRun({ ...saved, correct: 0, points: 0 }, songs)?.rung.attempts).toHaveLength(1);
  });

  it('starts fresh when nothing has been played', () => {
    expect(parseRun({ ...saved, correct: 0, points: 0, rung: { attempts: [] } }, songs)).toBeNull();
  });

  it('starts fresh when the song is gone from the list', () => {
    expect(parseRun({ ...saved, song: 'gone' }, songs)).toBeNull();
  });

  it('ignores missing or malformed data', () => {
    expect(parseRun(null, songs)).toBeNull();
    expect(parseRun({}, songs)).toBeNull();
    expect(parseRun({ ...saved, correct: -1 }, songs)).toBeNull();
    expect(parseRun({ ...saved, points: '240' as unknown as number }, songs)).toBeNull();
    expect(parseRun({ ...saved, rung: {} as never }, songs)).toBeNull();
    expect(parseRun({ ...saved, recent: 'a' as unknown as string[] }, songs)).toBeNull();
  });
});
