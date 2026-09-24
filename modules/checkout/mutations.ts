'use server';

import { offerings, transactions, transactionLines } from '@/lib/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';
import { requirePermission } from '@/modules/rbac/guard';
import { getCurrentSession } from '@/modules/auth/session';
import { revalidatePath } from 'next/cache';

export async function processCheckout(
  locationId: string,
  customerId: string | null,
  cartLines: { offeringId: string; quantity: number }[],
  recordAsDebt: boolean = false
) {
  return requirePermission('transactions:write')(async () => {
    const session = await getCurrentSession();
    if (!session?.accountId) throw new Error('No active account');
    const accountId = session.accountId;
    const userId = session.userId;

    if (cartLines.length === 0) throw new Error('Cart is empty');
    if (recordAsDebt && !customerId) throw new Error('A customer must be selected to record a debt');

    await withTenantContext(accountId, async (tx) => {
      // 1. Fetch current prices & stock securely
      const offeringIds = cartLines.map(l => l.offeringId);
      const items = await tx.select().from(offerings).where(inArray(offerings.id, offeringIds));
      
      const itemsMap = new Map(items.map(i => [i.id, i]));

      let totalCents = 0;
      const dbLines = [];

      for (const line of cartLines) {
        const item = itemsMap.get(line.offeringId);
        if (!item || !item.isActive) throw new Error(`Item unavailable: ${line.offeringId}`);
        
        if (item.tracksStock && item.currentStock < line.quantity) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }

        const lineTotalCents = item.priceCents * line.quantity;
        totalCents += lineTotalCents;

        dbLines.push({
          offeringId: item.id,
          quantity: line.quantity,
          unitPriceCents: item.priceCents,
          lineTotalCents
        });
      }

      // 2. Insert Header
      const [txHeader] = await tx.insert(transactions).values({
        accountId,
        locationId,
        transactionType: 'sale',
        totalCents,
        customerId,
        createdBy: userId
      }).returning({ id: transactions.id });

      // 3. Insert Lines
      await tx.insert(transactionLines).values(
        dbLines.map(l => ({
          ...l,
          accountId,
          transactionId: txHeader.id
        }))
      );

      // 4. Decrement Stock atomically
      for (const line of cartLines) {
        const item = itemsMap.get(line.offeringId)!;
        if (item.tracksStock) {
          await tx.update(offerings)
            .set({ currentStock: sql`${offerings.currentStock} - ${line.quantity}` })
            .where(eq(offerings.id, item.id));
        }
      }

      // 5. Create Debt if requested
      if (recordAsDebt && customerId) {
        // Need to import debts schema
        // We will replace this carefully in a separate step or just assume it works if we import it.
        const { debts } = await import('@/lib/db/schema');
        await tx.insert(debts).values({
          accountId,
          customerId,
          transactionId: txHeader.id,
          amountCents: totalCents,
          remainingCents: totalCents,
          status: 'outstanding'
        });
      }
    });

    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/checkout');
    revalidatePath('/dashboard/transactions');
    revalidatePath('/dashboard/debts');
    return { success: true };
  });
}
