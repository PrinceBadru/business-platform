import { db } from '@/lib/db/drizzle';
import {
  analyticsDailyAccount,
  analyticsDailyLocation,
  analyticsDailyOffering,
  analyticsDailyCustomer,
  analyticsMetricSnapshots
} from '@/lib/db/schema';
import { lte, lt } from 'drizzle-orm';
import { enqueueAnalyticsRepair } from './repair';

/**
 * Prunes analytical daily data older than a specified retention period (e.g. 24 months).
 * This prevents the daily rollup tables from growing indefinitely.
 */
export async function pruneOldAnalytics(retentionMonths = 24) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - retentionMonths);

  // We can't guarantee isolation contexts here as this is a cross-tenant maintenance job,
  // but we are only performing DELETEs based on timestamps.
  // In a true multi-tenant strict environment, we'd iterate over all tenants.
  
  const dateStr = cutoff.toISOString().split('T')[0];

  const res1 = await db.delete(analyticsDailyAccount).where(lt(analyticsDailyAccount.businessDate, dateStr));
  const res2 = await db.delete(analyticsDailyLocation).where(lt(analyticsDailyLocation.businessDate, dateStr));
  const res3 = await db.delete(analyticsDailyOffering).where(lt(analyticsDailyOffering.businessDate, dateStr));
  const res4 = await db.delete(analyticsDailyCustomer).where(lt(analyticsDailyCustomer.businessDate, dateStr));

  return {
    success: true,
    message: `Pruned daily analytics older than ${retentionMonths} months.`,
    deleted: {
      accountRows: res1.count,
      locationRows: res2.count,
      offeringRows: res3.count,
      customerRows: res4.count
    }
  };
}

/**
 * Triggers a massive backfill across the entire account if a formula version has changed.
 * This will wipe cached snapshots so the UI temporarily reads 'Updating...' until the worker catches up.
 */
export async function forceFormulaMigration(accountId: string) {
  // Wipe all L1 snapshots so that the frontend knows they are stale
  await db.delete(analyticsMetricSnapshots).where(lt(analyticsMetricSnapshots.formulaVersion, 2));

  // Enqueue a deep repair. Let's do a 5-year maximum window as a safety cap.
  const start = new Date();
  start.setFullYear(start.getFullYear() - 5);
  const end = new Date();

  const res = await enqueueAnalyticsRepair(
    accountId,
    null,
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  );

  return {
    success: true,
    message: `Dropped old snapshots and enqueued deep formula migration backfill for ${res.enqueued} active days.`
  };
}
