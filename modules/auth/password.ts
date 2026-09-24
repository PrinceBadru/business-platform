import * as argon2 from 'argon2';

/**
 * Hashes a plain-text password using Argon2id with OWASP 2025 recommended defaults.
 * Replaces the legacy bcryptjs implementation for superior security.
 */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, {
    type: argon2.argon2id,
    timeCost: 3,
    memoryCost: 65536,
    parallelism: 4,
  });
}

/**
 * Verifies a plain-text password against an Argon2 hash in constant time.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch (err) {
    return false;
  }
}
