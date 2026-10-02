import { transactions, transactionLines, offerings, analyticsMetricSnapshots, analyticsDirtyScopes, analyticsAlerts } from '@/lib/db/schema';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

export type FreshnessStatus = 'fresh' | 'updating' | 'insufficient_data';

export async function getDashboardMetrics(accountId: string) {
  return withTenantContext(accountId, async (tx) => {
    // 1. Fetch Snapshots
    const snapshots = await tx.select()
      .from(analyticsMetricSnapshots)
      .where(
        and(
          eq(analyticsMetricSnapshots.accountId, accountId),
          eq(analyticsMetricSnapshots.periodKey, 'all_time')
        )
      );

    const snapshotMap = new Map(snapshots.map(s => [s.metricKey, s]));

    const revenueSnapshot = snapshotMap.get('total_revenue');
    const txCountSnapshot = snapshotMap.get('transaction_count');
    const salesByTypeSnapshot = snapshotMap.get('sales_by_type');
    const lowStockSnapshot = snapshotMap.get('low_stock_alerts');
    const grossMarginSnapshot = snapshotMap.get('gross_margin');

    const revenueCents = revenueSnapshot?.value && typeof revenueSnapshot.value === 'object' && 'cents' in revenueSnapshot.value 
      ? Number(revenueSnapshot.value.cents) 
      : 0;

    const txCount = txCountSnapshot?.value && typeof txCountSnapshot.value === 'object' && 'count' in txCountSnapshot.value 
      ? Number(txCountSnapshot.value.count) 
      : 0;

    const salesByType = salesByTypeSnapshot?.value as any || {};
    const typeStats = [
      { type: 'good', revenue: salesByType.goodsRevenueCents || 0 },
      { type: 'service', revenue: salesByType.servicesRevenueCents || 0 }
    ];

    const lowStockRaw = lowStockSnapshot?.value as any || {};
    const lowStock = lowStockRaw.items || [];
    
    const grossMargin = grossMarginSnapshot?.value as any || {};

    // 2. Fetch Recent Transactions (Still real-time, just 5 rows)
    const recentTx = await tx.select({
      id: transactions.id,
      totalCents: transactions.totalCents,
      createdAt: transactions.createdAt
    })
    .from(transactions)
    .where(eq(transactions.accountId, accountId))
    .orderBy(desc(transactions.createdAt))
    .limit(5);

    // 3. Fetch Active Alerts
    const activeAlerts = await tx.select()
      .from(analyticsAlerts)
      .where(
        and(
          eq(analyticsAlerts.accountId, accountId),
          eq(analyticsAlerts.status, 'active')
        )
      )
      .orderBy(desc(analyticsAlerts.updatedAt));

    // 4. Determine Freshness Status
    const [pendingScope] = await tx.select({ id: analyticsDirtyScopes.id })
      .from(analyticsDirtyScopes)
      .where(and(eq(analyticsDirtyScopes.accountId, accountId), eq(analyticsDirtyScopes.status, 'pending')))
      .limit(1);

    const isMissingData = !revenueSnapshot;
    const freshnessStatus: FreshnessStatus = isMissingData 
      ? 'insufficient_data' 
      : (pendingScope ? 'updating' : 'fresh');

    return {
      revenue: revenueCents,
      transactionCount: txCount,
      grossMarginPercent: grossMargin.percent || 0,
      typeStats,
      lowStock,
      recentTx,
      activeAlerts,
      meta: {
        freshnessStatus,
        computedAt: revenueSnapshot?.computedAt || new Date(),
        sourceWatermark: revenueSnapshot?.sourceWatermark || new Date(),
        formulaVersion: revenueSnapshot?.formulaVersion || 1
      }
    };
  });
}
