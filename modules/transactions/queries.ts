import { transactions, customers, users, locations } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

export async function getTransactions(accountId: string) {
  return withTenantContext(accountId, async (tx) => {
    return tx.select({
      id: transactions.id,
      totalCents: transactions.totalCents,
      createdAt: transactions.createdAt,
      transactionType: transactions.transactionType,
      customerName: customers.name,
      cashierName: users.name,
      locationName: locations.name,
    })
    .from(transactions)
    .leftJoin(customers, eq(transactions.customerId, customers.id))
    .leftJoin(users, eq(transactions.createdBy, users.id))
    .leftJoin(locations, eq(transactions.locationId, locations.id))
    .where(eq(transactions.accountId, accountId))
    .orderBy(desc(transactions.createdAt));
  });
}
