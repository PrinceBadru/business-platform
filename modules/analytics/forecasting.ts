import { db } from '@/lib/db/drizzle';
import {
  analyticsDailyAccount,
} from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

// Helper: Calculate Weekly Seasonality Indices
export function calculateWeeklySeasonality(values: number[]): { indices: number[], status: string } {
  // Requires at least 14 days (2 weekly cycles)
  // Assumes values array is ordered [newest, ..., oldest]
  if (values.length < 14) {
    return { indices: [], status: 'insufficient_data' };
  }

  // Reverse to [oldest, ..., newest] for easier chronologic math
  const chronologic = [...values].reverse();
  const n = chronologic.length;

  // 1. Calculate 7-day Simple Moving Average (CMA surrogate)
  const sma = new Array(n).fill(null);
  for (let i = 6; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < 7; j++) {
      sum += chronologic[i - j];
    }
    sma[i] = sum / 7;
  }

  // 2. Calculate Ratios (Actual / SMA)
  // To avoid division by zero, if SMA is 0, ratio is 1
  const ratios = new Array(n).fill(null);
  for (let i = 6; i < n; i++) {
    ratios[i] = sma[i] === 0 ? 1 : chronologic[i] / sma[i];
  }

  // 3. Average the ratios by day-of-week index
  const daySums = new Array(7).fill(0);
  const dayCounts = new Array(7).fill(0);
  
  for (let i = 6; i < n; i++) {
    const dayOfWeek = i % 7;
    daySums[dayOfWeek] += ratios[i];
    dayCounts[dayOfWeek]++;
  }

  const rawIndices = daySums.map((sum, idx) => dayCounts[idx] > 0 ? sum / dayCounts[idx] : 1);

  // 4. Normalize so the sum of indices equals 7
  const sumIndices = rawIndices.reduce((a, b) => a + b, 0);
  
  // If zero variance edge case causes all 0s
  if (sumIndices === 0) {
    return { indices: [1,1,1,1,1,1,1], status: 'zero_variance' };
  }

  const normalizationFactor = 7 / sumIndices;
  const indices = rawIndices.map(idx => idx * normalizationFactor);

  return { indices, status: 'computed' };
}

// Helper: Holt's Linear Trend Forecasting
export function calculateHoltForecast(values: number[], horizon: number, alpha = 0.2, beta = 0.1): { forecast: number[], status: string, level: number, trend: number } {
  // Gate: requires 30 days
  if (values.length < 30) {
    return { forecast: [], status: 'insufficient_data', level: 0, trend: 0 };
  }
  
  // Hard cap horizon at the training window length
  const boundedHorizon = Math.min(horizon, values.length);
  
  const chronologic = [...values].reverse();
  const n = chronologic.length;

  // Initialize level and trend
  let L = chronologic[0];
  let T = chronologic[1] - chronologic[0];

  // Apply Holt's smoothing over the historical window
  for (let i = 1; i < n; i++) {
    const Y = chronologic[i];
    const prevL = L;
    L = alpha * Y + (1 - alpha) * (L + T);
    T = beta * (L - prevL) + (1 - beta) * T;
  }

  // Generate forecast for horizon
  const forecast = [];
  for (let h = 1; h <= boundedHorizon; h++) {
    // Avoid negative forecasts for business metrics like revenue
    const prediction = Math.max(0, L + (h * T));
    forecast.push(prediction);
  }

  // Very basic variance check for zero variance data
  const variance = chronologic.reduce((sum, val) => sum + Math.abs(val - chronologic[0]), 0);
  const status = variance === 0 ? 'zero_variance' : 'computed';

  return { forecast, status, level: L, trend: T };
}

/**
 * Computes scheduled sparse L3 metrics (seasonality, forecasting)
 * This runs less frequently (e.g. weekly) and caches state.
 */
export async function computeL3Forecasts(accountId: string) {
  return withTenantContext(accountId, async (tx) => {
    // Fetch up to 90 days for robust seasonal training
    const recentRollups = await tx.select({
      date: analyticsDailyAccount.businessDate,
      revenueCents: analyticsDailyAccount.revenueCents,
    })
    .from(analyticsDailyAccount)
    .where(eq(analyticsDailyAccount.accountId, accountId))
    .orderBy(desc(analyticsDailyAccount.businessDate))
    .limit(90);

    const revenueSeries = recentRollups.map(r => r.revenueCents);

    const seasonality = calculateWeeklySeasonality(revenueSeries);
    
    // Generate a 14-day forecast
    const forecast = calculateHoltForecast(revenueSeries, 14);

    return {
      seasonality,
      forecast,
      trainingWatermark: recentRollups[0]?.date || new Date().toISOString(),
      dataPoints: revenueSeries.length,
      formulaVersion: 1
    };
  });
}
