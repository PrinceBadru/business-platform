import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../modules/auth/password';

describe('Password Hashing (Argon2id)', () => {
  it('produces a hash different from the plain-text input', async () => {
    const hash = await hashPassword('password123');
    expect(hash).not.toBe('password123');
    expect(hash.startsWith('$argon2id')).toBe(true);
  });

  it('verifies the correct password against its hash', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    expect(await verifyPassword('correct-horse-battery-staple', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('returns false for a garbage hash without throwing', async () => {
    expect(await verifyPassword('any', 'dummy_hash')).toBe(false);
  });

  it('returns false for an empty string password', async () => {
    const hash = await hashPassword('secret');
    expect(await verifyPassword('', hash)).toBe(false);
  });

  it('two hashes of the same password are different (salted)', async () => {
    const h1 = await hashPassword('same');
    const h2 = await hashPassword('same');
    expect(h1).not.toBe(h2);
    // but both must verify
    expect(await verifyPassword('same', h1)).toBe(true);
    expect(await verifyPassword('same', h2)).toBe(true);
  });
});
