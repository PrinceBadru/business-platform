'use server';

import { db } from '@/lib/db/drizzle';
import { sessions, userAccountRoles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentSession } from '@/modules/auth/session';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function switchAccount(accountId: string) {
  const session = await getCurrentSession();
  if (!session) throw new Error('Unauthorized');

  // Verify the user actually belongs to this account!
  const hasAccess = await db.select().from(userAccountRoles)
    .where(and(
      eq(userAccountRoles.userId, session.userId),
      eq(userAccountRoles.accountId, accountId)
    )).limit(1);
    
  if (hasAccess.length === 0) {
    throw new Error('Forbidden: User does not belong to this account.');
  }

  await db.update(sessions)
    .set({ accountId })
    .where(eq(sessions.id, session.id));

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
