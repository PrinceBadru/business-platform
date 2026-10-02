import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db/drizzle';
import * as schema from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { pruneOldAnalytics, forceFormulaMigration } from '../modules/analytics/maintenance';

describe('Analytics Maintenance Tools (Hardening)', () => {
  let acmeAccountId: string;

  beforeAll(async () => {
    const accounts = await db.select().from(schema.accounts);
    acmeAccountId = accounts.find(a => a.name === 'Acme Retail')?.id || '';
  });

  it('prunes daily analytics older than retention window safely', async () => {
    // Insert an extremely old record to ensure it gets pruned
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 5);
    const dateStr = oldDate.toISOString().split('T')[0];

    await db.insert(schema.analyticsDailyAccount).values({
      accountId: acmeAccountId,
      businessDate: dateStr,
      revenueCents: 1000,
      cogsCents: 500,
      grossProfitCents: 500,
      transactionCount: 1,
      customerCount: 1,
      discountCents: 0
    });

    const res = await pruneOldAnalytics(24);
    expect(res.success).toBe(true);
    // Might prune more if other tests left artifacts, but at least 1
    expect(res.deleted.accountRows).toBeGreaterThanOrEqual(1);

    // Verify it's gone
    const records = await db.select().from(schema.analyticsDailyAccount).where(eq(schema.analyticsDailyAccount.businessDate, dateStr));
    expect(records.length).toBe(0);
  });

  it('triggers a formula migration safely', async () => {
    const res = await forceFormulaMigration(acmeAccountId);
    expect(res.success).toBe(true);
    expect(res.message).toContain('deep formula migration');
  });
});
