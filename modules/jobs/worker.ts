import { db } from '@/lib/db/drizzle';
import { jobs, dailySummaries, transactions } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

const SLEEP_MS = 5000;

async function processJob(job: typeof jobs.$inferSelect) {
  try {
    if (job.type === 'calculate_daily_summary') {
      const payload = job.payload as { accountId: string; dateStr: string };
      
      await withTenantContext(payload.accountId, async (tx) => {
        // Simple aggregate logic:
        const [stats] = await tx.select({
          revenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transactionType} = 'refund' THEN -${transactions.totalCents} ELSE ${transactions.totalCents} END), 0)::int`,
          count: sql<number>`COUNT(${transactions.id})::int`
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.accountId, payload.accountId),
            sql`DATE(${transactions.createdAt}) = ${payload.dateStr}::date`
          )
        );

        // Upsert summary
        await tx.insert(dailySummaries)
          .values({
            accountId: payload.accountId,
            date: payload.dateStr,
            revenueCents: stats.revenue,
            transactionCount: stats.count
          })
          .onConflictDoUpdate({
            target: [dailySummaries.accountId, dailySummaries.locationId, dailySummaries.date],
            set: {
              revenueCents: stats.revenue,
              transactionCount: stats.count,
              updatedAt: new Date()
            }
          });
      });
    }

    // Mark as completed
    await db.update(jobs)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(jobs.id, job.id));

    console.log(`[Worker] Processed job ${job.id} of type ${job.type}`);
  } catch (err: any) {
    console.error(`[Worker] Failed job ${job.id}:`, err.message);
    await db.update(jobs)
      .set({ 
        status: job.attempts >= 3 ? 'failed' : 'pending',
        attempts: job.attempts + 1,
        updatedAt: new Date()
      })
      .where(eq(jobs.id, job.id));
  }
}

async function startWorker() {
  console.log('[Worker] Starting background job processor...');
  while (true) {
    try {
      // Fetch 1 pending job
      const [job] = await db.select()
        .from(jobs)
        .where(eq(jobs.status, 'pending'))
        .limit(1)
        .orderBy(jobs.createdAt);

      if (job) {
        // Mark as processing
        await db.update(jobs).set({ status: 'processing' }).where(eq(jobs.id, job.id));
        await processJob(job);
      } else {
        // Sleep if no jobs
        await new Promise(resolve => setTimeout(resolve, SLEEP_MS));
      }
    } catch (err) {
      console.error('[Worker] Fatal loop error:', err);
      await new Promise(resolve => setTimeout(resolve, SLEEP_MS));
    }
  }
}

// Simple invocation if run directly
if (require.main === module) {
  startWorker();
}

export { startWorker };
