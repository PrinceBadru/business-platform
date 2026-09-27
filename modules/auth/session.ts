import { db } from '../../lib/db/drizzle';
import * as schema from '../../lib/db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'auth_session';

export type Session = typeof schema.sessions.$inferSelect;

/**
 * Creates a new server-side session and inserts it into the database.
 */
export async function createSession(userId: string, ipAddress?: string, userAgent?: string, accountId?: string): Promise<{ token: string, expiresAt: Date }> {
  // Generate an opaque random 32-byte hex string
  const token = crypto.randomBytes(32).toString('hex');
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await db.insert(schema.sessions).values({
    id: token,
    userId,
    accountId,
    expiresAt,
    ipAddress,
    userAgent
  });

  return { token, expiresAt };
}

/**
 * Validates a session against the database. Applies rolling expiry if active.
 * MUST be called from a Node.js runtime (e.g. Server Components or Server Actions).
 */
export async function validateSession(token: string): Promise<Session | null> {
  const result = await db.select()
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.id, token),
        isNull(schema.sessions.revokedAt),
        gt(schema.sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const session = result[0];

  // Rolling window: If less than 12 hours remaining, extend by another 24 hours.
  const timeRemaining = session.expiresAt.getTime() - Date.now();
  if (timeRemaining < 1000 * 60 * 60 * 12) {
    const newExpiry = new Date();
    newExpiry.setHours(newExpiry.getHours() + 24);
    
    await db.update(schema.sessions)
      .set({ expiresAt: newExpiry })
      .where(eq(schema.sessions.id, session.id));
    
    session.expiresAt = newExpiry;
  }

  return session;
}

/**
 * Marks a session as revoked, effectively logging the user out across devices if used widely.
 */
export async function invalidateSession(token: string): Promise<void> {
  await db.update(schema.sessions)
    .set({ revokedAt: new Date() })
    .where(eq(schema.sessions.id, token));
}

/**
 * Helper to get the current session securely bound to the request cookies.
 */
export async function getCurrentSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt
  });
}

export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
