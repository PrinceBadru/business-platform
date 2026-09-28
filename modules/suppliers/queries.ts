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

export async function getSupplierHistory(accountId: string, supplierId: string) {
  return withTenantContext(accountId, async (tx) => {
    const { stockMovements, offerings } = await import('@/lib/db/schema');
    const { eq, and, desc } = await import('drizzle-orm');
    
    const deliveries = await tx.select({
      id: stockMovements.id,
      quantityAdded: stockMovements.quantityChange,
      offeringName: offerings.name,
      date: stockMovements.createdAt,
    })
    .from(stockMovements)
    .innerJoin(offerings, eq(stockMovements.offeringId, offerings.id))
    .where(and(
      eq(offerings.supplierId, supplierId),
      eq(stockMovements.reason, 'supplier_delivery')
    ))
    .orderBy(desc(stockMovements.createdAt))
    .limit(10);
    
    return deliveries;
  });
}
