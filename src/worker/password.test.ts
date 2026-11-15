import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('accepts the right password and rejects others', async () => {
    const stored = await hashPassword('secret1');
    expect(await verifyPassword('secret1', stored)).toBe(true);
    expect(await verifyPassword('secret2', stored)).toBe(false);
    expect(await verifyPassword('', stored)).toBe(false);
  });

  it('never stores the password and salts each hash', async () => {
    const [a, b] = await Promise.all([hashPassword('secret1'), hashPassword('secret1')]);
    expect(a).not.toContain('secret1');
    expect(a).not.toBe(b);
  });

  it('handles non-ASCII passwords', async () => {
    expect(await verifyPassword('密码🎧123', await hashPassword('密码🎧123'))).toBe(true);
  });
});
