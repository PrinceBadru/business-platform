import { db } from '@/lib/db/drizzle';
import {
  analyticsDirtyScopes,
  analyticsDailyAccount,
  analyticsDailyLocation,
  analyticsDailyOffering,
  analyticsDailyCustomer,
  analyticsComputationRuns,
  transactions,
  transactionLines,
  debts,
  offerings
} from '@/lib/db/schema';
import { eq, and, sql, lte, inArray } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

const SLEEP_MS = 5000;
const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 3;

/**
 * Recomputes the daily rollups for a specific scope (account, location, date).
 * Idempotent: completely replaces the summary rows for that business day based on truth tables.
 */
export async function computeDailyRollups(accountId: string, locationId: string | null, businessDate: string) {
  await withTenantContext(accountId, async (tx) => {
    // 1. Account & Location Metrics
    const baseWhere = locationId 
      ? and(eq(transactions.accountId, accountId), eq(transactions.locationId, locationId), sql`DATE(timezone('UTC', ${transactions.createdAt})) = ${businessDate}::date`)
      : and(eq(transactions.accountId, accountId), sql`DATE(timezone('UTC', ${transactions.createdAt})) = ${businessDate}::date`);

    const [accountStats] = await tx.select({
      revenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transactionType} = 'refund' THEN -${transactions.totalCents} ELSE ${transactions.totalCents} END), 0)::int`,
      count: sql<number>`COUNT(${transactions.id})::int`,
      discount: sql<number>`COALESCE(SUM(${transactions.discountCents}), 0)::int`,
      customers: sql<number>`COUNT(DISTINCT ${transactions.customerId})::int`
    })
    .from(transactions)
    .where(baseWhere);

    // COGS
    const [cogsStats] = await tx.select({
      cogs: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transactionType} = 'refund' THEN -(${transactionLines.unitCostAtTimeOfSaleCents} * ${transactionLines.quantity}) ELSE (${transactionLines.unitCostAtTimeOfSaleCents} * ${transactionLines.quantity}) END), 0)::int`,
    })
    .from(transactionLines)
    .innerJoin(transactions, eq(transactionLines.transactionId, transactions.id))
    .where(baseWhere);

    const grossProfitCents = (accountStats.revenue || 0) - (cogsStats.cogs || 0);

    // Upsert Account
    await tx.insert(analyticsDailyAccount)
      .values({
        accountId,
        businessDate,
        revenueCents: accountStats.revenue,
        cogsCents: cogsStats.cogs,
        grossProfitCents,
        transactionCount: accountStats.count,
        customerCount: accountStats.customers,
        discountCents: accountStats.discount
      })
      .onConflictDoUpdate({
        target: [analyticsDailyAccount.accountId, analyticsDailyAccount.businessDate],
        set: {
          revenueCents: accountStats.revenue,
          cogsCents: cogsStats.cogs,
          grossProfitCents,
          transactionCount: accountStats.count,
          customerCount: accountStats.customers,
          discountCents: accountStats.discount,
          updatedAt: new Date()
        }
      });

    // Upsert Location if applicable
    if (locationId) {
      await tx.insert(analyticsDailyLocation)
        .values({
          accountId,
          locationId,
          businessDate,
          revenueCents: accountStats.revenue,
          cogsCents: cogsStats.cogs,
          grossProfitCents,
          transactionCount: accountStats.count
        })
        .onConflictDoUpdate({
          target: [analyticsDailyLocation.locationId, analyticsDailyLocation.businessDate],
          set: {
            revenueCents: accountStats.revenue,
            cogsCents: cogsStats.cogs,
            grossProfitCents,
            transactionCount: accountStats.count,
            updatedAt: new Date()
          }
        });
    }

    // 2. Offering Metrics
    const offeringStats = await tx.select({
      offeringId: transactionLines.offeringId,
      quantity: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transactionType} = 'refund' THEN -${transactionLines.quantity} ELSE ${transactionLines.quantity} END), 0)::int`,
      revenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transactionType} = 'refund' THEN -${transactionLines.lineTotalCents} ELSE ${transactionLines.lineTotalCents} END), 0)::int`,
      cogs: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transactionType} = 'refund' THEN -(${transactionLines.unitCostAtTimeOfSaleCents} * ${transactionLines.quantity}) ELSE (${transactionLines.unitCostAtTimeOfSaleCents} * ${transactionLines.quantity}) END), 0)::int`,
      discount: sql<number>`COALESCE(SUM(${transactionLines.discountCents}), 0)::int`,
      priceCount: sql<number>`COUNT(${transactionLines.id})::int`,
      sumPrice: sql<number>`SUM(${transactionLines.unitPriceCents})::int`
    })
    .from(transactionLines)
    .innerJoin(transactions, eq(transactionLines.transactionId, transactions.id))
    .where(baseWhere)
    .groupBy(transactionLines.offeringId);

    for (const stat of offeringStats) {
      if (!locationId) continue; // For now we store offering daily stats per location
      const gp = stat.revenue - stat.cogs;
      await tx.insert(analyticsDailyOffering)
        .values({
          accountId,
          locationId,
          offeringId: stat.offeringId,
          businessDate,
          quantitySold: stat.quantity,
          revenueCents: stat.revenue,
          cogsCents: stat.cogs,
          grossProfitCents: gp,
          discountCents: stat.discount,
          priceObservationCount: stat.priceCount,
          sumPrice: stat.sumPrice
        })
        .onConflictDoUpdate({
          target: [analyticsDailyOffering.locationId, analyticsDailyOffering.offeringId, analyticsDailyOffering.businessDate],
          set: {
            quantitySold: stat.quantity,
            revenueCents: stat.revenue,
            cogsCents: stat.cogs,
            grossProfitCents: gp,
            discountCents: stat.discount,
            priceObservationCount: stat.priceCount,
            sumPrice: stat.sumPrice,
            updatedAt: new Date()
          }
        });
    }

    // 3. Customer Metrics
    const customerStats = await tx.select({
      customerId: transactions.customerId,
      revenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transactionType} = 'refund' THEN -${transactions.totalCents} ELSE ${transactions.totalCents} END), 0)::int`,
      count: sql<number>`COUNT(${transactions.id})::int`
    })
    .from(transactions)
    .where(and(baseWhere, sql`${transactions.customerId} IS NOT NULL`))
    .groupBy(transactions.customerId);

    for (const stat of customerStats) {
      if (!stat.customerId) continue;
      await tx.insert(analyticsDailyCustomer)
        .values({
          accountId,
          customerId: stat.customerId,
          businessDate,
          revenueCents: stat.revenue,
          transactionCount: stat.count
        })
        .onConflictDoUpdate({
          target: [analyticsDailyCustomer.customerId, analyticsDailyCustomer.businessDate],
          set: {
            revenueCents: stat.revenue,
            transactionCount: stat.count,
            updatedAt: new Date()
          }
        });
    }
  });
}

/**
 * Worker loop for processing dirty scopes
 */
export async function startAnalyticsWorker() {
  console.log('[Analytics Worker] Starting incremental rollup processor...');
  
  while (true) {
    try {
      // 1. Fetch bounded batch with SKIP LOCKED for concurrency safety
      const query = sql`
        SELECT id, account_id, location_id, business_date, attempts 
        FROM analytics_dirty_scopes 
        WHERE status = 'pending' AND next_run_at <= NOW()
        ORDER BY next_run_at ASC, created_at ASC
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      `;
      const { rows: scopes } = await db.execute(query);

      if (scopes.length === 0) {
        await new Promise(resolve => setTimeout(resolve, SLEEP_MS));
        continue;
      }

      // Mark processing
      const scopeIds = scopes.map(s => s.id as string);
      await db.update(analyticsDirtyScopes)
        .set({ status: 'processing' })
        .where(inArray(analyticsDirtyScopes.id, scopeIds));

      for (const scope of scopes) {
        const startTime = new Date();
        const runId = crypto.randomUUID();
        
        try {
          await db.insert(analyticsComputationRuns).values({
            id: runId,
            accountId: scope.account_id as string,
            jobType: 'daily_rollup',
            startedAt: startTime,
            status: 'running'
          });

          // Perform rollup
          await computeDailyRollups(
            scope.account_id as string, 
            scope.location_id as string | null, 
            scope.business_date as string
          );

          // Mark success
          await db.update(analyticsDirtyScopes)
            .set({ status: 'completed', updatedAt: new Date() })
            .where(eq(analyticsDirtyScopes.id, scope.id as string));

          await db.update(analyticsComputationRuns)
            .set({ status: 'success', completedAt: new Date() })
            .where(eq(analyticsComputationRuns.id, runId));

        } catch (err: any) {
          console.error(`[Analytics Worker] Failed scope ${scope.id}:`, err.message);
          
          const attempts = (scope.attempts as number) + 1;
          const status = attempts >= MAX_ATTEMPTS ? 'failed' : 'pending';
          // Exponential backoff
          const nextRunAt = new Date(Date.now() + Math.pow(2, attempts) * 1000 * 60);

          await db.update(analyticsDirtyScopes)
            .set({ status, attempts, nextRunAt, updatedAt: new Date() })
            .where(eq(analyticsDirtyScopes.id, scope.id as string));

          await db.update(analyticsComputationRuns)
            .set({ status: 'failed', completedAt: new Date(), errorDetails: err.message })
            .where(eq(analyticsComputationRuns.id, runId));
        }
      }
    } catch (err) {
      console.error('[Analytics Worker] Fatal loop error:', err);
      await new Promise(resolve => setTimeout(resolve, SLEEP_MS));
    }
  }
}

// Simple CLI execution
if (require.main === module) {
  startAnalyticsWorker();
}
