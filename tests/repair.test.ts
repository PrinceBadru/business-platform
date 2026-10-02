import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, client } from '../lib/db/drizzle';
import * as schema from '../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { enqueueAnalyticsRepair } from '../modules/analytics/repair';

describe('Analytics Repair & Backfill Engine', () => {
  let acmeAccountId: string;

  beforeAll(async () => {
    const accounts = await db.select().from(schema.accounts);
    acmeAccountId = accounts.find(a => a.name === 'Acme Retail')?.id || '';
  });

  it('safely handles empty date ranges with no transactions', async () => {
    // Generate a future date range where there are no transactions
    const result = await enqueueAnalyticsRepair(
      acmeAccountId, 
      null, 
      '2099-01-01', 
      '2099-01-31'
    );
    expect(result.success).toBe(true);
    expect(result.enqueued).toBe(0);
  });

  it('enqueues dirty scopes for dates containing transactions', async () => {
    // 1. Manually insert a transaction to ensure there is activity
    const locs = await db.select().from(schema.locations).where(eq(schema.locations.accountId, acmeAccountId));
    const locationId = locs[0]?.id || '';
    
    const usrs = await db.select().from(schema.users);
    const userId = usrs[0]?.id || '';

    const now = new Date();
    await db.insert(schema.transactions).values({
      accountId: acmeAccountId,
      locationId: locationId,
      customerId: null,
      transactionType: 'sale',
      totalCents: 5000,
      createdBy: userId,
      createdAt: now,
    });

    // 2. Trigger repair for today
    const dateStr = now.toISOString().split('T')[0];
    const result = await enqueueAnalyticsRepair(
      acmeAccountId, 
      null, 
      dateStr, 
      dateStr
    );
    
    expect(result.success).toBe(true);
    expect(result.enqueued).toBeGreaterThan(0);

    // 3. Verify it was placed in the queue
    const queuedScopes = await db.select()
      .from(schema.analyticsDirtyScopes)
      .where(
        and(
          eq(schema.analyticsDirtyScopes.accountId, acmeAccountId),
          eq(schema.analyticsDirtyScopes.status, 'pending')
        )
      );
    
    expect(queuedScopes.length).toBeGreaterThan(0);
  });
});
