import { db } from '@/lib/db/drizzle';
import {
  analyticsDailyAccount,
  analyticsDailyOffering,
  analyticsDailyCustomer,
  analyticsDailySupplier,
  offerings
} from '@/lib/db/schema';
import { eq, sql, and, desc, gte } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

// Helper: Calculate simple moving average (SMA)
export function calculateSMA(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

// Helper: Calculate exponential moving average (EMA)
export function calculateEMA(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = values[values.length - 1]; // Start with the oldest value
  for (let i = values.length - 2; i >= 0; i--) { // Iterate forward in time (assuming index 0 is newest)
    ema = (values[i] * k) + (ema * (1 - k));
  }
  return ema;
}

// Helper: Calculate Median Absolute Deviation (MAD)
export function calculateMAD(values: number[]): { median: number; mad: number } {
  if (values.length === 0) return { median: 0, mad: 0 };
  
  const sorted = [...values].sort((a, b) => a - b);
  const getMedian = (arr: number[]) => {
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };

  const median = getMedian(sorted);
  const absoluteDeviations = values.map(v => Math.abs(v - median)).sort((a, b) => a - b);
  const mad = getMedian(absoluteDeviations);

  return { median, mad };
}

// Helper: Calculate Z-Score
export function calculateZScore(value: number, values: number[]): number {
  if (values.length < 2) return 0;
  const mean = calculateSMA(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0; // Avoid division by zero
  return (value - mean) / stdDev;
}

// Helper: Calculate Ordinary Least Squares (OLS) Trend Slope
export function calculateTrendSlope(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: 0 };

  // Assume time t is index (0, 1, 2, ..., n-1) with 0 being oldest
  let sumT = 0;
  let sumY = 0;
  let sumT2 = 0;
  let sumTY = 0;

  for (let i = 0; i < n; i++) {
    const t = n - 1 - i; // Older values have smaller t
    const y = values[i];
    sumT += t;
    sumY += y;
    sumT2 += t * t;
    sumTY += t * y;
  }

  const denominator = (n * sumT2) - (sumT * sumT);
  if (denominator === 0) return { slope: 0, intercept: 0 };

  const slope = ((n * sumTY) - (sumT * sumY)) / denominator;
  const intercept = (sumY - (slope * sumT)) / n;

  return { slope, intercept };
}

/**
 * Generates L2 statistical metrics for a given account.
 */
export async function computeL2Metrics(accountId: string) {
  return withTenantContext(accountId, async (tx) => {
    // 1. Fetch the last 30 days of rollups for the account
    const recentRollups = await tx.select({
      date: analyticsDailyAccount.businessDate,
      revenueCents: analyticsDailyAccount.revenueCents,
      transactionCount: analyticsDailyAccount.transactionCount
    })
    .from(analyticsDailyAccount)
    .where(eq(analyticsDailyAccount.accountId, accountId))
    .orderBy(desc(analyticsDailyAccount.businessDate))
    .limit(30);

    const revenueSeries = recentRollups.map(r => r.revenueCents);

    const metrics: any = {
      status: recentRollups.length < 14 ? 'insufficient_data' : 'computed',
      dataPoints: recentRollups.length,
    };

    if (recentRollups.length >= 14) {
      metrics.revenueSMA14 = calculateSMA(revenueSeries.slice(0, 14));
      metrics.revenueEMA14 = calculateEMA(revenueSeries.slice(0, 14), 14);
      metrics.revenueTrend = calculateTrendSlope(revenueSeries.slice(0, 14));
      metrics.revenueAnomaly = calculateMAD(revenueSeries.slice(0, 14));
    }

    if (recentRollups.length >= 30) {
      metrics.revenueZScore = calculateZScore(revenueSeries[0], revenueSeries.slice(1, 30));
    }

    // 2. Compute ABC / Pareto Classification for Offerings
    // Only sort offerings with activity in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const offeringTotals = await tx.select({
      offeringId: analyticsDailyOffering.offeringId,
      totalRevenue: sql<number>`SUM(${analyticsDailyOffering.revenueCents})::int`
    })
    .from(analyticsDailyOffering)
    .where(
      and(
        eq(analyticsDailyOffering.accountId, accountId),
        gte(analyticsDailyOffering.businessDate, dateStr)
      )
    )
    .groupBy(analyticsDailyOffering.offeringId);

    const totalOfferingRevenue = offeringTotals.reduce((sum, o) => sum + o.totalRevenue, 0);
    
    // Sort descending
    offeringTotals.sort((a, b) => b.totalRevenue - a.totalRevenue);

    let cumulativeRevenue = 0;
    const abcClassification = offeringTotals.map(offering => {
      cumulativeRevenue += offering.totalRevenue;
      const cumulativePercentage = totalOfferingRevenue > 0 ? (cumulativeRevenue / totalOfferingRevenue) : 0;
      
      let classification = 'C';
      if (cumulativePercentage <= 0.70) classification = 'A';
      else if (cumulativePercentage <= 0.90) classification = 'B';

      return {
        offeringId: offering.offeringId,
        revenue: offering.totalRevenue,
        classification
      };
    });

    metrics.abcClassification = abcClassification.slice(0, 50); // Store top 50 for snapshot

    // 3. Compute Herfindahl-Hirschman Index (HHI) for Customers
    const customerTotals = await tx.select({
      customerId: analyticsDailyCustomer.customerId,
      totalRevenue: sql<number>`SUM(${analyticsDailyCustomer.revenueCents})::int`
    })
    .from(analyticsDailyCustomer)
    .where(
      and(
        eq(analyticsDailyCustomer.accountId, accountId),
        gte(analyticsDailyCustomer.businessDate, dateStr)
      )
    )
    .groupBy(analyticsDailyCustomer.customerId);

    const totalCustomerRevenue = customerTotals.reduce((sum, c) => sum + c.totalRevenue, 0);
    
    let hhiCustomer = 0;
    if (totalCustomerRevenue > 0) {
      for (const customer of customerTotals) {
        const share = (customer.totalRevenue / totalCustomerRevenue) * 100;
        hhiCustomer += share * share;
      }
    }
    metrics.hhiCustomer = hhiCustomer; // Range 0 to 10,000 (monopoly)

    return metrics;
  });
}
