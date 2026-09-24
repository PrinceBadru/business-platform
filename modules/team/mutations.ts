'use server';

import { db } from '@/lib/db/drizzle';
import { users, userAccountRoles, userLocationAccess } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';
import { requirePermission } from '@/modules/rbac/guard';
import { getCurrentSession } from '@/modules/auth/session';
import { revalidatePath } from 'next/cache';
import type { Role } from '@/modules/rbac/permissions';

export async function inviteTeamMember(email: string, name: string, role: Role) {
  return requirePermission('users:manage')(async () => {
    const session = await getCurrentSession();
    if (!session?.accountId) throw new Error('No active account');
    const accountId = session.accountId;

    // users table is global, we must bypass tenant context to check/insert global identity
    // eslint-disable-next-line no-restricted-syntax
    let user = await db.select().from(users).where(eq(users.email, email)).limit(1).then(r => r[0]);
    if (!user) {
      // eslint-disable-next-line no-restricted-syntax
      user = await db.insert(users).values({ email, name }).returning().then(r => r[0]);
    }

    // Now safely map the global user to the isolated tenant via RLS context
    await withTenantContext(accountId, async (tx) => {
      const existing = await tx.select().from(userAccountRoles).where(eq(userAccountRoles.userId, user.id)).limit(1);
      if (existing.length === 0) {
        await tx.insert(userAccountRoles).values({
          accountId,
          userId: user.id,
          role
        });
      } else {
        await tx.update(userAccountRoles).set({ role }).where(eq(userAccountRoles.userId, user.id));
      }
    });

    revalidatePath('/dashboard/team');
  });
}

export async function removeTeamMember(userId: string) {
  return requirePermission('users:manage')(async () => {
    const session = await getCurrentSession();
    if (!session?.accountId) throw new Error('No active account');
    const accountId = session.accountId;

    if (userId === session.userId) throw new Error('Cannot remove yourself');

    await withTenantContext(accountId, async (tx) => {
      await tx.delete(userAccountRoles).where(eq(userAccountRoles.userId, userId));
      await tx.delete(userLocationAccess).where(eq(userLocationAccess.userId, userId));
    });

    revalidatePath('/dashboard/team');
  });
}
