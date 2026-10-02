import { db } from '@/lib/db/drizzle';
import {
  analyticsDailyOffering,
} from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

// Helper: Calculate Price Elasticity via Log-Log OLS Regression
export function calculatePriceElasticity(
  observations: { priceCents: number; quantity: number }[]
): { elasticity: number; status: string; distinctPrices: number; rSquared: number } {
  // Gate 1: At least 30 transactions/observations
  if (observations.length < 30) {
    return { elasticity: 0, status: 'insufficient_data_points', distinctPrices: 0, rSquared: 0 };
  }

  // Find unique prices
  const distinctPrices = new Set(observations.map(o => o.priceCents)).size;

  // Gate 2: At least 3 distinct price points
  if (distinctPrices < 3) {
    return { elasticity: 0, status: 'insufficient_price_variation', distinctPrices, rSquared: 0 };
  }

  // Pre-calculate sums for log-log regression: ln(Q) = a + E * ln(P)
  // X = ln(price), Y = ln(quantity)
  let sumX = 0;
  let sumY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  let sumXY = 0;
  
  const n = observations.length;
  let validN = 0;

  for (const obs of observations) {
    if (obs.priceCents <= 0 || obs.quantity <= 0) continue; // Can't log-transform <= 0
    
    const x = Math.log(obs.priceCents / 100); // dollars
    const y = Math.log(obs.quantity);
    
    sumX += x;
    sumY += y;
    sumX2 += x * x;
    sumY2 += y * y;
    sumXY += x * y;
    validN++;
  }

  if (validN < 30) {
     return { elasticity: 0, status: 'insufficient_valid_data_points', distinctPrices, rSquared: 0 };
  }

  // Calculate slope (Elasticity E)
  const denominator = (validN * sumX2) - (sumX * sumX);
  
  // Gate 3: Spread check (denominator will be very small if prices barely vary)
  if (denominator < 0.0001) {
    return { elasticity: 0, status: 'insufficient_price_spread', distinctPrices, rSquared: 0 };
  }

  const elasticity = ((validN * sumXY) - (sumX * sumY)) / denominator;

  // Calculate R-Squared as a confidence/reliability surrogate
  const numeratorRSq = ((validN * sumXY) - (sumX * sumY)) ** 2;
  const denominatorRSq = denominator * ((validN * sumY2) - (sumY * sumY));
  
  const rSquared = denominatorRSq === 0 ? 0 : numeratorRSq / denominatorRSq;

  // Gate 4: Reliability Rule (e.g. R-Squared > 0.1, meaning at least 10% variance explained)
  if (rSquared < 0.1) {
    return { elasticity, status: 'low_confidence', distinctPrices, rSquared };
  }

  return { elasticity, status: 'computed', distinctPrices, rSquared };
}

/**
 * Computes price elasticity for a specific offering.
 * Expected to be run rarely (e.g. monthly) on a low-priority queue.
 */
export async function computeOfferingElasticity(accountId: string, offeringId: string) {
  return withTenantContext(accountId, async (tx) => {
    // Fetch last 90 days of daily offering summaries
    const recentRollups = await tx.select({
      priceCents: analyticsDailyOffering.sumPrice, // Actually we need average price per day
      priceObservationCount: analyticsDailyOffering.priceObservationCount,
      quantitySold: analyticsDailyOffering.quantitySold,
    })
    .from(analyticsDailyOffering)
    .where(
      and(
        eq(analyticsDailyOffering.accountId, accountId),
        eq(analyticsDailyOffering.offeringId, offeringId)
      )
    )
    .orderBy(desc(analyticsDailyOffering.businessDate))
    .limit(90);

    // Expand daily aggregates back into pseudo-observations for the regression.
    // In a real system, you'd want actual line-item prices, but the design calls for using rollups.
    // We will use the average price of the day as the price observation.
    const observations: { priceCents: number; quantity: number }[] = [];
    
    for (const r of recentRollups) {
      if (r.priceObservationCount > 0 && r.quantitySold > 0) {
        // We push the daily aggregated block as a single 'day' observation
        // Or weight it by transaction count. For simplicity, we treat each day as an observation.
        observations.push({
          priceCents: r.priceCents / r.priceObservationCount,
          quantity: r.quantitySold
        });
      }
    }

    const result = calculatePriceElasticity(observations);

    return {
      ...result,
      dataPoints: observations.length,
      formulaVersion: 1,
      explanation: result.status === 'computed' 
        ? `A 1% increase in price is correlated with a ${Math.abs(result.elasticity).toFixed(2)}% ${result.elasticity < 0 ? 'decrease' : 'increase'} in volume. (Observational estimate, not necessarily causal).`
        : 'Data does not meet the strict statistical requirements for elasticity calculation.'
    };
  });
}
