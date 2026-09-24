import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, client } from '../lib/db/drizzle';
import { withTenantContext } from '../lib/db/tenant';
import * as schema from '../lib/db/schema';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm/expressions';

describe('Adversarial RLS Verification', () => {
  let acmeAccountId: string;
  let globexAccountId: string;

  beforeAll(async () => {
    // 1. Create a restricted role to simulate a non-superuser application connection.
    await db.execute(sql.raw(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rls_tester') THEN
          CREATE ROLE rls_tester NOLOGIN;
        END IF;
      END $$;
    `));
    await db.execute(sql.raw(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rls_tester;`));

    // 2. Fetch the generated account IDs from the seeder
    const accounts = await db.select().from(schema.accounts);
    acmeAccountId = accounts.find(a => a.name === 'Acme Retail')?.id || '';
    globexAccountId = accounts.find(a => a.name === 'Globex Services')?.id || '';
    
    if (!acmeAccountId || !globexAccountId) {
      throw new Error("Seeder data missing. Run npm run db:seed first.");
    }
  });

  afterAll(async () => {
    await client.end();
  });

  it('Acme context should only see Acme locations', async () => {
    await withTenantContext(acmeAccountId, async (tx) => {
      await tx.execute(sql.raw(`SET LOCAL ROLE rls_tester;`));
      
      const locations = await tx.select().from(schema.locations);
      
      expect(locations.length).toBeGreaterThan(0);
      expect(locations.every(l => l.accountId === acmeAccountId)).toBe(true);
    });
  });

  it('Globex context should only see Globex offerings', async () => {
    await withTenantContext(globexAccountId, async (tx) => {
      await tx.execute(sql.raw(`SET LOCAL ROLE rls_tester;`));
      
      const offerings = await tx.select().from(schema.offerings);
      
      expect(offerings.length).toBeGreaterThan(0);
      expect(offerings.every(o => o.accountId === globexAccountId)).toBe(true);
    });
  });

  it('Malicious query without WHERE clause is still isolated to the tenant', async () => {
    await withTenantContext(globexAccountId, async (tx) => {
      await tx.execute(sql.raw(`SET LOCAL ROLE rls_tester;`));
      
      const transactions = await tx.select().from(schema.transactions);
      
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions.every(t => t.accountId === globexAccountId)).toBe(true);
    });
  });

  it('Malicious cross-tenant update affects 0 rows', async () => {
    await withTenantContext(globexAccountId, async (tx) => {
      await tx.execute(sql.raw(`SET LOCAL ROLE rls_tester;`));
      
      const result = await tx.update(schema.offerings)
        .set({ priceCents: 1 })
        .where(eq(schema.offerings.accountId, acmeAccountId))
        .returning();
      
      expect(result.length).toBe(0); 
    });
  });

  it('Global context without tenant set returns zero rows', async () => {
    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SET LOCAL ROLE rls_tester;`));
      const locations = await tx.select().from(schema.locations);
      
      expect(locations.length).toBe(0);
    });
  });
});
