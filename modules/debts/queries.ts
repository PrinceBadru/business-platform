import { debts, customers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

export async function getDebts(accountId: string) {
  return withTenantContext(accountId, async (tx) => {
    return tx.select({
      id: debts.id,
      amountCents: debts.amountCents,
      remainingCents: debts.remainingCents,
      status: debts.status,
      dateIncurred: debts.dateIncurred,
      customerName: customers.name,
      customerPhone: customers.phone,
      transactionId: debts.transactionId,
    })
    .from(debts)
    .innerJoin(customers, eq(debts.customerId, customers.id))
    .where(eq(debts.accountId, accountId))
    .orderBy(desc(debts.dateIncurred));
  });
}
