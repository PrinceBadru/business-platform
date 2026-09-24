'use server';

import { offerings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';
import { requirePermission } from '@/modules/rbac/guard';
import { getCurrentSession } from '@/modules/auth/session';
import { revalidatePath } from 'next/cache';

export async function createOffering(data: {
  name: string;
  category?: string;
  itemType: 'good' | 'service';
  tracksStock: boolean;
  unit?: string;
  costCents: number;
  priceCents: number;
  currentStock?: number;
  reorderThreshold?: number;
}) {
  return requirePermission('offerings:write')(async () => {
    const session = await getCurrentSession();
    if (!session?.accountId) throw new Error('No active account');
    const accountId = session.accountId;

    if (data.costCents < 0 || data.priceCents < 0) {
      throw new Error('Money values cannot be negative');
    }

    await withTenantContext(accountId, async (tx) => {
      await tx.insert(offerings).values({
        accountId,
        ...data
      });
    });

    revalidatePath('/dashboard/inventory');
  });
}

export async function archiveOffering(offeringId: string) {
  return requirePermission('offerings:write')(async () => {
    const session = await getCurrentSession();
    if (!session?.accountId) throw new Error('No active account');
    const accountId = session.accountId;

    await withTenantContext(accountId, async (tx) => {
      await tx.update(offerings)
        .set({ isActive: false })
        .where(and(eq(offerings.id, offeringId), eq(offerings.accountId, accountId)));
    });

    revalidatePath('/dashboard/inventory');
  });
}
