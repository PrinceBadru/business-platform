import { accounts, locations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

export async function getAccountSettings(accountId: string) {
  return withTenantContext(accountId, async (tx) => {
    const result = await tx.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    return result[0] || null;
  });
}

export async function getAccountLocations(accountId: string) {
  return withTenantContext(accountId, async (tx) => {
    return tx.select().from(locations).where(eq(locations.accountId, accountId));
  });
}
