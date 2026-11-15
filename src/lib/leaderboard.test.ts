import { describe, expect, it } from 'vitest';
import { checkRun, cleanName, compareRows, nameKey } from './leaderboard';

const ok = { player: 'abcdefgh1234', name: 'Dana', password: 'secret1', avatar: '🎧', correct: 3, score: 210, filter: 'All decades · All genres' };

describe('checkRun', () => {
  it('accepts a plausible run', () => {
    expect(checkRun(ok)).toBeNull();
  });
  it('rejects scores no run could reach', () => {
    expect(checkRun({ ...ok, score: 301 })).toBe('Bad score.');
    expect(checkRun({ ...ok, score: 310 })).toBe('Bad score.');
    expect(checkRun({ ...ok, score: 50 })).toBe('Bad score.');
    expect(checkRun({ ...ok, score: 215 })).toBe('Bad score.');
  });
  it('rejects empty names, zero songs and bad ids', () => {
    expect(checkRun({ ...ok, name: '   ' })).toBe('Enter a name.');
    expect(checkRun({ ...ok, correct: 0, score: 0 })).toBe('Bad song count.');
    expect(checkRun({ ...ok, correct: 1.5 })).toBe('Bad song count.');
    expect(checkRun({ ...ok, player: 'x' })).toBe('Bad player id.');
    expect(checkRun({ ...ok, avatar: '<img>' })).toBe('Bad avatar.');
    expect(checkRun({ ...ok, avatar: '' })).toBeNull();
  });
  it('requires a password of a sensible length', () => {
    const bad = 'Password must be 6 to 72 characters.';
    expect(checkRun({ ...ok, password: undefined })).toBe(bad);
    expect(checkRun({ ...ok, password: '12345' })).toBe(bad);
    expect(checkRun({ ...ok, password: 'x'.repeat(73) })).toBe(bad);
    expect(checkRun({ ...ok, password: '123456' })).toBeNull();
  });
});

describe('cleanName', () => {
  it('trims, collapses spaces and caps the length', () => {
    expect(cleanName('  a   b \n c ')).toBe('a b c');
    expect(cleanName('x'.repeat(40))).toHaveLength(20);
    expect(cleanName('a\u202eb')).toBe('ab');
  });
  it('treats case and spacing variants as the same name', () => {
    expect(nameKey(' Dana  Lee ')).toBe(nameKey('danalee'));
    expect(nameKey('\uff24\uff21\uff2e\uff21')).toBe('dana');
  });
});

describe('compareRows', () => {
  it('orders by score, then songs, then earliest', () => {
    const rows = [
      { score: 200, correct: 2, at: 5 },
      { score: 200, correct: 3, at: 9 },
      { score: 300, correct: 3, at: 9 },
      { score: 200, correct: 2, at: 1 }
    ];
    expect(rows.sort(compareRows).map((r) => r.at)).toEqual([9, 9, 1, 5]);
  });
});
