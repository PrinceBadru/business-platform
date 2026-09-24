'use server';

import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from './password';
import { createSession, setSessionCookie } from './session';
import { redirect } from 'next/navigation';

export type AuthState = {
  error?: string;
  success?: boolean;
};

export async function signInWithPassword(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) return { error: 'Missing email or password' };

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (result.length === 0) return { error: 'Invalid email or password' };

  const user = result[0];
  if (!user.passwordHash) return { error: 'Account uses Passkeys. Please sign in with Passkey.' };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: 'Invalid email or password' };

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  redirect('/dashboard');
}

export async function signUpWithPassword(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  if (!email || !password) return { error: 'Missing email or password' };

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return { error: 'Email already in use' };

  const passwordHash = await hashPassword(password);
  
  const [user] = await db.insert(users).values({
    email,
    name: name || email.split('@')[0],
    passwordHash
  }).returning();

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  redirect('/dashboard');
}
