import { transactions, transactionLines, offerings } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

export async function getDashboardMetrics(accountId: string) {
  return withTenantContext(accountId, async (tx) => {
    // 1. Total Revenue and count
    const [txStats] = await tx.select({
      revenue: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.transactionType} = 'refund' THEN -${transactions.totalCents} ELSE ${transactions.totalCents} END), 0)::text`,
      count: sql<string>`COUNT(${transactions.id})::text`
    }).from(transactions)
    .where(eq(transactions.accountId, accountId));

    // 2. Type stats
    const typeStatsRaw = await tx.select({
      type: offerings.itemType,
      revenue: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.transactionType} = 'refund' THEN -${transactionLines.lineTotalCents} ELSE ${transactionLines.lineTotalCents} END), 0)::text`
    })
    .from(transactionLines)
    .innerJoin(transactions, eq(transactionLines.transactionId, transactions.id))
    .innerJoin(offerings, eq(transactionLines.offeringId, offerings.id))
    .where(eq(transactionLines.accountId, accountId))
    .groupBy(offerings.itemType);

    const typeStats = typeStatsRaw.map(r => ({
      type: r.type,
      revenue: parseInt(r.revenue, 10)
    }));

    // 3. Low stock
    const lowStock = await tx.select({
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
    
    // 4. Recent TX
    const recentTx = await tx.select({
      id: transactions.id,
      totalCents: transactions.totalCents,
      createdAt: transactions.createdAt
    })
    .from(transactions)
    .where(eq(transactions.accountId, accountId))
    .orderBy(desc(transactions.createdAt))
    .limit(5);

    return {
      revenue: parseInt(txStats?.revenue || '0', 10),
      transactionCount: parseInt(txStats?.count || '0', 10),
      typeStats,
      lowStock,
      recentTx
    };
  });
}
