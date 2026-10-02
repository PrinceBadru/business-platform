import { db } from '@/lib/db/drizzle';
import {
  analyticsDirtyScopes,
  transactions
} from '@/lib/db/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

/**
 * Triggers a bounded backfill or repair for a specific account and date range.
 * This is safe because it only enqueues dirty scopes. The background worker
 * will pick these up and process them idempotently without blocking the repair request.
 */
export async function enqueueAnalyticsRepair(
  accountId: string,
  locationId: string | null,
  startDate: string,
  endDate: string
) {
  return withTenantContext(accountId, async (tx) => {
    // We need to find all distinct business dates that had transactions
    // in the requested window to avoid enqueuing empty days unnecessarily.
    
    // Convert dates to proper strings if they aren't already
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    // Query distinct dates from transactions
    // In a real production system, this could also scan inventory movements and debts.
    const activeDates = await tx.select({
      businessDate: sql<string>`DATE(${transactions.createdAt})`
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.accountId, accountId),
        locationId ? eq(transactions.locationId, locationId) : undefined,
        gte(transactions.createdAt, start),
        lte(transactions.createdAt, end)
      )
    )
    .groupBy(sql`DATE(${transactions.createdAt})`);

    const scopesToInsert = activeDates.map((record) => ({
      accountId,
      locationId: locationId || null,
      businessDate: record.businessDate,
      metricFamiliesDirty: ['revenue', 'inventory', 'debt'],
      status: 'pending' as const
    }));

    if (scopesToInsert.length === 0) {
      return { success: true, enqueued: 0, message: 'No activity found in the specified date range.' };
    }

    // Insert dirty scopes. ON CONFLICT do nothing because if it's already pending, 
    // the worker will pick it up anyway.
    await tx.insert(analyticsDirtyScopes)
      .values(scopesToInsert)
      .onConflictDoUpdate({
        target: [analyticsDirtyScopes.accountId, analyticsDirtyScopes.locationId, analyticsDirtyScopes.businessDate],
        set: {
          status: 'pending',
          updatedAt: new Date()
        }
      });

    return { 
      success: true, 
      enqueued: scopesToInsert.length, 
      message: `Enqueued ${scopesToInsert.length} daily scopes for repair.` 
    };
  });
}
