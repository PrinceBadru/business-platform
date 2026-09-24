'use server';

import { accounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';
import { requirePermission } from '@/modules/rbac/guard';
import { getCurrentSession } from '@/modules/auth/session';
import { revalidatePath } from 'next/cache';

export async function updateAccountSettings(name: string, businessType: 'retail' | 'services' | 'hybrid', settings: any) {
  // Only owners can change fundamental account structure for now.
  return requirePermission('*')(async () => {
    const session = await getCurrentSession();
    if (!session?.accountId) throw new Error('No active account');
    const accountId = session.accountId;

    await withTenantContext(accountId, async (tx) => {
      await tx.update(accounts)
        .set({ name, businessType, settings })
        .where(eq(accounts.id, accountId));
    });

    revalidatePath('/dashboard/settings');
    revalidatePath('/', 'layout'); // Because account name is in the sidebar
  });
}
