'use server';

import { suppliers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';
import { requirePermission } from '@/modules/rbac/guard';
import { getCurrentSession } from '@/modules/auth/session';
import { revalidatePath } from 'next/cache';

export async function createSupplier(name: string, contactInfo: string | null) {
  return requirePermission('offerings:write')(async () => {
    const session = await getCurrentSession();
    if (!session?.accountId) throw new Error('No active account');
    const accountId = session.accountId;

    await withTenantContext(accountId, async (tx) => {
      await tx.insert(suppliers).values({
        accountId,
        name,
        contactInfo
      });
    });

    revalidatePath('/dashboard/suppliers');
  });
}

export async function archiveSupplier(supplierId: string) {
  return requirePermission('offerings:write')(async () => {
    const session = await getCurrentSession();
    if (!session?.accountId) throw new Error('No active account');
    const accountId = session.accountId;

    await withTenantContext(accountId, async (tx) => {
      await tx.update(suppliers)
        .set({ isArchived: true })
        .where(and(eq(suppliers.id, supplierId), eq(suppliers.accountId, accountId)));
    });

    revalidatePath('/dashboard/suppliers');
  });
}
