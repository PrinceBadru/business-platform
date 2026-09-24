'use server';

import { customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';
import { requirePermission } from '@/modules/rbac/guard';
import { getCurrentSession } from '@/modules/auth/session';
import { revalidatePath } from 'next/cache';

export async function createCustomer(name: string, phone: string | null, notes: string | null) {
  return requirePermission('transactions:write')(async () => {
    const session = await getCurrentSession();
    if (!session?.accountId) throw new Error('No active account');
    const accountId = session.accountId;

    await withTenantContext(accountId, async (tx) => {
      await tx.insert(customers).values({
        accountId,
        name,
        phone,
        notes
      });
    });

    revalidatePath('/dashboard/customers');
  });
}

export async function archiveCustomer(customerId: string) {
  return requirePermission('transactions:write')(async () => {
    const session = await getCurrentSession();
    if (!session?.accountId) throw new Error('No active account');
    const accountId = session.accountId;

    await withTenantContext(accountId, async (tx) => {
      await tx.update(customers)
        .set({ isArchived: true })
        .where(and(eq(customers.id, customerId), eq(customers.accountId, accountId)));
    });

    revalidatePath('/dashboard/customers');
  });
}
