import { customers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

export async function getCustomers(accountId: string) {
  return withTenantContext(accountId, async (tx) => {
    return tx.select().from(customers)
      .where(eq(customers.accountId, accountId))
      .orderBy(desc(customers.createdAt));
  });
}
