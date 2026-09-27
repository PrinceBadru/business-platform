'use server';

import { db } from '@/lib/db/drizzle';
import { users, userAccountRoles } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { hashPassword, verifyPassword } from './password';
import { createSession, setSessionCookie } from './session';
import { redirect } from 'next/navigation';

export type AuthState = {
  error?: string;
  success?: boolean;
};

/**
 * Accepts either an email address or a username in the `identifier` field.
 * Looks up the user by whichever matches and then verifies the password.
 */
export async function signInWithPassword(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const identifier = (formData.get('identifier') as string)?.trim();
  const password = formData.get('password') as string;

  if (!identifier || !password) return { error: 'Missing credentials.' };

  // Determine whether the identifier looks like an email or a username
  const isEmail = identifier.includes('@');

  const result = await db
    .select()
    .from(users)
    .where(
      isEmail
        ? eq(users.email, identifier)
        : eq(users.username, identifier)
    )
    .limit(1);

  if (result.length === 0) return { error: 'Invalid email/username or password.' };

  const user = result[0];
  if (!user.passwordHash) {
    return { error: 'This account uses Passkeys. Please sign in with your Passkey.' };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: 'Invalid email/username or password.' };

  // Fetch default account for the user to set in the session
  const roles = await db.select().from(userAccountRoles).where(eq(userAccountRoles.userId, user.id)).limit(1);
  const defaultAccountId = roles.length > 0 ? roles[0].accountId : undefined;

  const { token, expiresAt } = await createSession(user.id, undefined, undefined, defaultAccountId);
  await setSessionCookie(token, expiresAt);

  redirect('/dashboard');
}

/**
 * Registers a new user with name, email, username, and password.
 * Both email and username must be globally unique.
 */
export async function signUpWithPassword(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim();
  const username = (formData.get('username') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const name = (formData.get('name') as string)?.trim();

  if (!email || !password) return { error: 'Email and password are required.' };
  if (!username) return { error: 'Username is required.' };

  // Validate username: alphanumeric + underscores only, 3–50 chars
  if (!/^[a-z0-9_]{3,50}$/.test(username)) {
    return {
      error: 'Username must be 3–50 characters and may only contain letters, numbers, and underscores.',
    };
  }

  // Check for conflicts in a single query
  const conflicts = await db
    .select({ email: users.email, username: users.username })
    .from(users)
    .where(or(eq(users.email, email), eq(users.username, username)));

  for (const row of conflicts) {
    if (row.email === email) return { error: 'That email address is already registered.' };
    if (row.username === username) return { error: 'That username is already taken.' };
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({
      email,
      username,
      name: name || username,
      passwordHash,
    })
    .returning();

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  redirect('/onboarding');
}
