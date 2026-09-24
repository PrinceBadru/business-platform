import { suppliers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

export async function getSuppliers(accountId: string) {
  return withTenantContext(accountId, async (tx) => {
    return tx.select().from(suppliers)
      .where(eq(suppliers.accountId, accountId))
      .orderBy(desc(suppliers.createdAt));
  });
}
