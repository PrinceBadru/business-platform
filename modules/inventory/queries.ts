import { offerings } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

export async function getOfferings(accountId: string) {
  return withTenantContext(accountId, async (tx) => {
    return tx.select().from(offerings)
      .where(eq(offerings.accountId, accountId))
      .orderBy(desc(offerings.createdAt));
  });
}
