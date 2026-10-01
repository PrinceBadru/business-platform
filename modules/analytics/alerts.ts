import { db } from '@/lib/db/drizzle';
import {
  analyticsDailyAccount,
  analyticsAlerts,
} from '@/lib/db/schema';
import { eq, sql, and, desc, inArray } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

/**
 * Evaluates anomaly detection rules and updates the alert state machine.
 * This should run on a schedule (e.g., end of day) or after rollups.
 */
export async function evaluateAnomalyAlerts(accountId: string) {
  await withTenantContext(accountId, async (tx) => {
    // 1. Fetch the last 14 days of rollups for the account
    const recentRollups = await tx.select({
      date: analyticsDailyAccount.businessDate,
      revenueCents: analyticsDailyAccount.revenueCents,
      transactionCount: analyticsDailyAccount.transactionCount
    })
    .from(analyticsDailyAccount)
    .where(eq(analyticsDailyAccount.accountId, accountId))
    .orderBy(desc(analyticsDailyAccount.businessDate))
    .limit(14);

    if (recentRollups.length < 7) {
      // Not enough data for robust anomaly detection
      return;
    }

    // Split into current period (last 3 days) and baseline period (previous 4-14 days)
    // Actually, comparing "yesterday" vs "7 day average" is standard.
    const currentDay = recentRollups[0];
    const baselineRollups = recentRollups.slice(1, 8); // Previous 7 days
    
    if (baselineRollups.length === 0) return;

    const avgBaselineRevenue = baselineRollups.reduce((sum, r) => sum + r.revenueCents, 0) / baselineRollups.length;
    
    const anomalies = [];

    // Rule: Severe revenue drop (50% below 7-day average)
    if (avgBaselineRevenue > 100000) { // Only evaluate if baseline is meaningful
      if (currentDay.revenueCents < avgBaselineRevenue * 0.5) {
        anomalies.push({
          metricKey: 'revenue_drop',
          comparisonKey: 'vs_7d_avg',
          severity: 'high',
          computedValue: { cents: currentDay.revenueCents },
          baselineValue: { cents: avgBaselineRevenue },
          triggerType: 'anomaly'
        });
      }
    }

    // 2. Process State Machine
    const activeAndCandidateAlerts = await tx.select()
      .from(analyticsAlerts)
      .where(
        and(
          eq(analyticsAlerts.accountId, accountId),
          inArray(analyticsAlerts.status, ['active', 'candidate']),
          eq(analyticsAlerts.metricKey, 'revenue_drop') // We are only evaluating revenue_drop right now
        )
      );

    const activeMap = new Map(activeAndCandidateAlerts.map(a => [a.comparisonKey, a]));

    for (const anomaly of anomalies) {
      const existing = activeMap.get(anomaly.comparisonKey);
      
      if (!existing) {
        // State 0 -> Candidate
        await tx.insert(analyticsAlerts).values({
          accountId,
          metricKey: anomaly.metricKey,
          comparisonKey: anomaly.comparisonKey,
          status: 'candidate',
          severity: anomaly.severity,
          computedValue: anomaly.computedValue,
          baselineValue: anomaly.baselineValue,
          triggerType: anomaly.triggerType,
          consecutivePeriods: 1
        });
      } else {
        // Exists: increment consecutive periods
        const newConsecutive = existing.consecutivePeriods + 1;
        // State Candidate -> Active (if >= 2)
        const newStatus = newConsecutive >= 2 ? 'active' : 'candidate';

        await tx.update(analyticsAlerts)
          .set({
            status: newStatus,
            consecutivePeriods: newConsecutive,
            computedValue: anomaly.computedValue,
            lastFiredAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(analyticsAlerts.id, existing.id));
      }

      // Remove from map so we know it was processed
      activeMap.delete(anomaly.comparisonKey);
    }

    // 3. Resolve alerts that are no longer firing
    for (const [_, staleAlert] of activeMap.entries()) {
      await tx.update(analyticsAlerts)
        .set({
          status: 'resolved',
          updatedAt: new Date()
        })
        .where(eq(analyticsAlerts.id, staleAlert.id));
    }
  });
}
