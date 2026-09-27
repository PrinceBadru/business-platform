import { db } from '@/lib/db/drizzle';
import { offerings, customers, transactions } from '@/lib/db/schema';
import { withTenantContext } from '@/lib/db/tenant';
import { getCurrentSession } from '@/modules/auth/session';
import { sql } from 'drizzle-orm';

export type SearchResult = {
  type: 'offering' | 'customer' | 'transaction';
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

/**
 * Performs a full-text search across offerings, customers, and transactions
 * within the current tenant context. Uses PostgreSQL ILIKE for broad compatibility
 * (GIN tsvector upgrade can be added via migration as the dataset grows).
 */
export async function globalSearch(
  query: string,
  accountId: string
): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const results: SearchResult[] = [];
  const likePattern = `%${q}%`;

  await withTenantContext(accountId, async (tx) => {
    // Search offerings (products/services)
    const offeringRows = await tx
      .select({
        id: offerings.id,
        name: offerings.name,
        category: offerings.category,
        itemType: offerings.itemType,
      })
      .from(offerings)
      .where(sql`(${offerings.name} ILIKE ${likePattern} OR ${offerings.category} ILIKE ${likePattern})`)
      .limit(5);

    for (const row of offeringRows) {
      results.push({
        type: 'offering',
        id: row.id,
        title: row.name,
        subtitle: `${row.itemType === 'good' ? 'Product' : 'Service'} · ${row.category ?? 'Uncategorised'}`,
        href: `/inventory`,
      });
    }

    // Search customers
    const customerRows = await tx
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
      })
      .from(customers)
      .where(sql`(${customers.name} ILIKE ${likePattern} OR ${customers.phone} ILIKE ${likePattern})`)
      .limit(5);

    for (const row of customerRows) {
      results.push({
        type: 'customer',
        id: row.id,
        title: row.name,
        subtitle: row.phone ? `📞 ${row.phone}` : 'Customer',
        href: `/customers`,
      });
    }
  });

  return results;
}
