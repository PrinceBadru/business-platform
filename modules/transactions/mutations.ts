'use server';

import { transactions, transactionLines, offerings, stockMovements, analyticsDirtyScopes, accounts } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';
import { requirePermission } from '@/modules/rbac/guard';
import { getCurrentSession } from '@/modules/auth/session';
import { revalidatePath } from 'next/cache';

export async function processRefund(originalTransactionId: string) {
  return requirePermission('transactions:write')(async () => {
    const session = await getCurrentSession();
    if (!session?.accountId) throw new Error('No active account');
    const accountId = session.accountId;
    const userId = session.userId;

    await withTenantContext(accountId, async (tx) => {
      // 1. Find original transaction
      const [originalTx] = await tx.select()
        .from(transactions)
        .where(eq(transactions.id, originalTransactionId));

      if (!originalTx) throw new Error('Transaction not found');
      if (originalTx.transactionType === 'refund') throw new Error('Cannot refund a refund');

      // 2. Fetch original lines
      const originalLines = await tx.select()
        .from(transactionLines)
        .where(eq(transactionLines.transactionId, originalTransactionId));

      // 3. Create Refund Header
      const [refundTx] = await tx.insert(transactions).values({
        accountId,
        locationId: originalTx.locationId,
        transactionType: 'refund',
        totalCents: originalTx.totalCents, // positive because of check constraint
        customerId: originalTx.customerId,
        createdBy: userId
      }).returning({ id: transactions.id });

      // 4. Create Refund Lines
      if (originalLines.length > 0) {
        await tx.insert(transactionLines).values(
          originalLines.map(line => ({
            accountId,
            transactionId: refundTx.id,
            offeringId: line.offeringId,
            quantity: line.quantity, // positive
            unitPriceCents: line.unitPriceCents,
            unitCostAtTimeOfSaleCents: line.unitCostAtTimeOfSaleCents,
            discountCents: line.discountCents,
            lineTotalCents: line.lineTotalCents
          }))
        );

        // 5. Restore stock
        for (const line of originalLines) {
          const [item] = await tx.select().from(offerings).where(eq(offerings.id, line.offeringId));
          if (item && item.tracksStock) {
            await tx.update(offerings)
              .set({ currentStock: sql`${offerings.currentStock} + ${line.quantity}` })
              .where(eq(offerings.id, item.id));

            await tx.insert(stockMovements).values({
              accountId,
              locationId: originalTx.locationId,
              offeringId: item.id,
              quantityChange: line.quantity,
              reason: 'refund',
              transactionId: refundTx.id,
              createdBy: userId
            });
          }
        }
      }

      // 6. Enqueue Analytics Dirty Scope (Post-Commit Marker)
      const [account] = await tx.select({ timezone: accounts.timezone }).from(accounts).where(eq(accounts.id, accountId));
      const businessDate = new Date().toLocaleDateString('en-CA', { timeZone: account?.timezone || 'UTC' });
      const offeringIds = originalLines.map(l => l.offeringId);
      const customerIdsChanged = originalTx.customerId ? [originalTx.customerId] : [];
      
      await tx.insert(analyticsDirtyScopes).values({
        accountId,
        locationId: originalTx.locationId,
        businessDate,
        metricFamiliesDirty: ['revenue', 'inventory', 'customer'],
        offeringIdsChanged: offeringIds,
        customerIdsChanged,
        status: 'pending'
      }).onConflictDoUpdate({
        target: [analyticsDirtyScopes.accountId, analyticsDirtyScopes.locationId, analyticsDirtyScopes.businessDate],
        set: {
          status: 'pending',
          attempts: 0,
          metricFamiliesDirty: sql`
            COALESCE((SELECT jsonb_agg(DISTINCT x) FROM jsonb_array_elements_text(analytics_dirty_scopes.metric_families_dirty || '["revenue", "inventory", "customer"]'::jsonb) t(x)), '[]'::jsonb)
          `,
          offeringIdsChanged: sql`
            COALESCE((SELECT jsonb_agg(DISTINCT x) FROM jsonb_array_elements_text(analytics_dirty_scopes.offering_ids_changed || ${JSON.stringify(offeringIds)}::jsonb) t(x)), '[]'::jsonb)
          `,
          customerIdsChanged: sql`
            COALESCE((SELECT jsonb_agg(DISTINCT x) FROM jsonb_array_elements_text(analytics_dirty_scopes.customer_ids_changed || ${JSON.stringify(customerIdsChanged)}::jsonb) t(x)), '[]'::jsonb)
          `,
          sourceEventWatermark: sql`now()`
        }
      });
    });

    revalidatePath('/dashboard/transactions');
    revalidatePath('/dashboard/dashboard');
    revalidatePath('/dashboard/inventory');
    return { success: true };
  });
}
