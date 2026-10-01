import { db } from '@/lib/db/drizzle';
import {
  analyticsDailyAccount,
  analyticsDailyOffering,
  analyticsMetricSnapshots,
  offerings,
  debts
} from '@/lib/db/schema';
import { eq, sum, sql, and, desc } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

export async function computeL1Snapshots(accountId: string, locationId: string | null) {
  await withTenantContext(accountId, async (tx) => {
    const periodKey = 'all_time';
    const formulaVersion = 1;
    const computedAt = new Date();
    // Use the latest businessDate as watermark
    const [latestRollup] = await tx.select({ date: analyticsDailyAccount.businessDate })
      .from(analyticsDailyAccount)
      .where(eq(analyticsDailyAccount.accountId, accountId))
      .orderBy(desc(analyticsDailyAccount.businessDate))
      .limit(1);
    
    const sourceWatermark = latestRollup ? new Date(latestRollup.date) : new Date();

    // 1. Totals from Daily Account
    const [totals] = await tx.select({
      revenueCents: sql<number>`SUM(${analyticsDailyAccount.revenueCents})::int`,
      cogsCents: sql<number>`SUM(${analyticsDailyAccount.cogsCents})::int`,
      grossProfitCents: sql<number>`SUM(${analyticsDailyAccount.grossProfitCents})::int`,
      transactionCount: sql<number>`SUM(${analyticsDailyAccount.transactionCount})::int`,
      customerCount: sql<number>`SUM(${analyticsDailyAccount.customerCount})::int`,
    })
    .from(analyticsDailyAccount)
    .where(eq(analyticsDailyAccount.accountId, accountId));

    const revenue = totals?.revenueCents || 0;
    const cogs = totals?.cogsCents || 0;
    const gp = totals?.grossProfitCents || 0;
    const txCount = totals?.transactionCount || 0;
    const customerCount = totals?.customerCount || 0;

    // Gross Margin (%)
    const grossMargin = revenue > 0 ? (gp / revenue) : 0;
    
    // Markup (%)
    const markup = cogs > 0 ? (gp / cogs) : 0;

    // We do not have structured OPEX. Mark net margin as missing_input / not_applicable.
    
    // Write Snapshots
    const metricsToSave = [
      { key: 'total_revenue', value: { cents: revenue }, status: 'computed' },
      { key: 'total_cogs', value: { cents: cogs }, status: 'computed' },
      { key: 'gross_profit', value: { cents: gp }, status: 'computed' },
      { key: 'gross_margin', value: { percent: grossMargin }, status: 'computed' },
      { key: 'markup', value: { percent: markup }, status: 'computed' },
      { key: 'transaction_count', value: { count: txCount }, status: 'computed' },
      { key: 'customer_count', value: { count: customerCount }, status: 'computed' },
      { key: 'net_profit', value: {}, status: 'missing_input' }, // Structured OPEX is deferred
    ];

    for (const m of metricsToSave) {
      await tx.insert(analyticsMetricSnapshots).values({
        accountId,
        locationId,
        metricKey: m.key,
        periodKey,
        value: m.value,
        sufficiencyStatus: m.status,
        formulaVersion,
        computedAt,
        sourceWatermark
      }).onConflictDoUpdate({
        target: [analyticsMetricSnapshots.accountId, analyticsMetricSnapshots.locationId, analyticsMetricSnapshots.offeringId, analyticsMetricSnapshots.metricKey, analyticsMetricSnapshots.periodKey],
        set: {
          value: m.value,
          sufficiencyStatus: m.status,
          formulaVersion,
          computedAt,
          sourceWatermark
        }
      });
    }

    // 2. Rankings (Sales by Type)
    const [goodsStats] = await tx.select({
      revenueCents: sql<number>`SUM(${analyticsDailyOffering.revenueCents})::int`
    })
    .from(analyticsDailyOffering)
    .innerJoin(offerings, eq(analyticsDailyOffering.offeringId, offerings.id))
    .where(and(eq(analyticsDailyOffering.accountId, accountId), eq(offerings.itemType, 'good')));

    const [servicesStats] = await tx.select({
      revenueCents: sql<number>`SUM(${analyticsDailyOffering.revenueCents})::int`
    })
    .from(analyticsDailyOffering)
    .innerJoin(offerings, eq(analyticsDailyOffering.offeringId, offerings.id))
    .where(and(eq(analyticsDailyOffering.accountId, accountId), eq(offerings.itemType, 'service')));

    await tx.insert(analyticsMetricSnapshots).values({
      accountId,
      locationId,
      metricKey: 'sales_by_type',
      periodKey,
      value: { 
        goodsRevenueCents: goodsStats?.revenueCents || 0, 
        servicesRevenueCents: servicesStats?.revenueCents || 0 
      },
      sufficiencyStatus: 'computed',
      formulaVersion,
      computedAt,
      sourceWatermark
    }).onConflictDoUpdate({
      target: [analyticsMetricSnapshots.accountId, analyticsMetricSnapshots.locationId, analyticsMetricSnapshots.offeringId, analyticsMetricSnapshots.metricKey, analyticsMetricSnapshots.periodKey],
      set: {
        value: { goodsRevenueCents: goodsStats?.revenueCents || 0, servicesRevenueCents: servicesStats?.revenueCents || 0 },
        sufficiencyStatus: 'computed',
        formulaVersion,
        computedAt,
        sourceWatermark
      }
    });

    // 3. Stock Thresholds (Hard threshold alert logic)
    const lowStockItems = await tx.select({
      id: offerings.id,
      name: offerings.name,
      currentStock: offerings.currentStock,
      reorderThreshold: offerings.reorderThreshold
    })
    .from(offerings)
    .where(
      sql`${offerings.accountId} = ${accountId} AND ${offerings.tracksStock} = true AND ${offerings.currentStock} <= GREATEST(${offerings.reorderThreshold}, 5)`
    )
    .limit(5);

    await tx.insert(analyticsMetricSnapshots).values({
      accountId,
      locationId,
      metricKey: 'low_stock_alerts',
      periodKey,
      value: { items: lowStockItems },
      sufficiencyStatus: 'computed',
      formulaVersion,
      computedAt,
      sourceWatermark
    }).onConflictDoUpdate({
      target: [analyticsMetricSnapshots.accountId, analyticsMetricSnapshots.locationId, analyticsMetricSnapshots.offeringId, analyticsMetricSnapshots.metricKey, analyticsMetricSnapshots.periodKey],
      set: {
        value: { items: lowStockItems },
        sufficiencyStatus: 'computed',
        formulaVersion,
        computedAt,
        sourceWatermark
      }
    });

    // 4. Debt Aging
    const [debtStats] = await tx.select({
      outstandingCents: sql<number>`SUM(${debts.remainingCents})::int`,
      count: sql<number>`COUNT(${debts.id})::int`
    })
    .from(debts)
    .where(and(eq(debts.accountId, accountId), eq(debts.status, 'outstanding')));

    await tx.insert(analyticsMetricSnapshots).values({
      accountId,
      locationId,
      metricKey: 'debt_aging',
      periodKey,
      value: { 
        outstandingCents: debtStats?.outstandingCents || 0,
        count: debtStats?.count || 0
      },
      sufficiencyStatus: debtStats?.count ? 'computed' : 'insufficient_data',
      formulaVersion,
      computedAt,
      sourceWatermark
    }).onConflictDoUpdate({
      target: [analyticsMetricSnapshots.accountId, analyticsMetricSnapshots.locationId, analyticsMetricSnapshots.offeringId, analyticsMetricSnapshots.metricKey, analyticsMetricSnapshots.periodKey],
      set: {
        value: { outstandingCents: debtStats?.outstandingCents || 0, count: debtStats?.count || 0 },
        sufficiencyStatus: debtStats?.count ? 'computed' : 'insufficient_data',
        formulaVersion,
        computedAt,
        sourceWatermark
      }
    });
  });
}
