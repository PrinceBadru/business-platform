'use server';

import { db } from '@/lib/db/drizzle';
import { sessions, userAccountRoles, userLocationAccess } from '@/lib/db/schema';
import { getCurrentSession } from '@/modules/auth/session';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Switches the active account for the current session.
 * Validates that the user actually belongs to the requested account.
 */
export async function switchAccount(accountId: string) {
  const session = await getCurrentSession();
  if (!session) redirect('/sign-in');

  // Verify the user actually belongs to this account
  const membership = await db
    .select()
    .from(userAccountRoles)
    .where(
      and(
        eq(userAccountRoles.userId, session.userId),
        eq(userAccountRoles.accountId, accountId)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    throw new Error('Not authorized to access this account.');
  }

  await db
    .update(sessions)
    .set({ accountId })
    .where(eq(sessions.id, session.id));

  revalidatePath('/');
  redirect('/dashboard');
}

/**
 * Switches the active location for the current session.
 * Validates the user has access to the requested location.
 */
export async function switchLocation(locationId: string) {
  const session = await getCurrentSession();
  if (!session?.accountId) redirect('/sign-in');

  // Verify user has access to this location
  const access = await db
    .select()
    .from(userLocationAccess)
    .where(
      and(
        eq(userLocationAccess.userId, session.userId),
        eq(userLocationAccess.locationId, locationId),
        eq(userLocationAccess.accountId, session.accountId)
      )
    )
    .limit(1);

  if (access.length === 0) {
    throw new Error('Not authorized to access this location.');
  }

  await db
    .update(sessions)
    .set({ locationId })
    .where(eq(sessions.id, session.id));

  revalidatePath('/');
  redirect('/dashboard');
}
