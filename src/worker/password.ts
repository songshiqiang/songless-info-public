// Salted password hashes for the leaderboard. The iteration count is kept low enough for the
// Workers Free plan's CPU limit, and stored with each hash so it can be raised later.

const ITERATIONS = 10_000;

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(await derive(password, salt, ITERATIONS))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, iterations, salt, hash] = stored.split('$');
  const want = fromBase64(hash);
  const got = await derive(password, fromBase64(salt), Number(iterations));
  // Compares every byte, so the time taken doesn't reveal how close a guess was.
  return got.reduce((diff, byte, i) => diff | (byte ^ want[i]), got.length ^ want.length) === 0;
}
