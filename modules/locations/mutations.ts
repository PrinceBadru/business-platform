'use server';

import { locations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';
import { requirePermission } from '@/modules/rbac/guard';
import { getCurrentSession } from '@/modules/auth/session';
import { revalidatePath } from 'next/cache';

export async function createLocation(name: string) {
  return requirePermission('locations:write')(async () => {
    const session = await getCurrentSession();
    if (!session?.accountId) throw new Error('No active account');
    const accountId = session.accountId;

    await withTenantContext(accountId, async (tx) => {
      await tx.insert(locations).values({
        accountId,
        name
      });
    });

    revalidatePath('/dashboard/settings');
  });
}

export async function archiveLocation(locationId: string) {
  return requirePermission('locations:write')(async () => {
    const session = await getCurrentSession();
    if (!session?.accountId) throw new Error('No active account');
    const accountId = session.accountId;

    await withTenantContext(accountId, async (tx) => {
      await tx.update(locations)
        .set({ isArchived: true })
        .where(and(eq(locations.id, locationId), eq(locations.accountId, accountId)));
    });

    revalidatePath('/dashboard/settings');
  });
}
