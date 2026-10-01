import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { db, client } from '../lib/db/drizzle';
import * as schema from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { evaluateAnomalyAlerts } from '../modules/analytics/alerts';

describe('State-Machine Alerts Engine', () => {
  let acmeAccountId: string;

  beforeAll(async () => {
    const accounts = await db.select().from(schema.accounts);
    acmeAccountId = accounts.find(a => a.name === 'Acme Retail')?.id || '';
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  it('detects a revenue drop anomaly and creates a candidate alert', async () => {
    // 1. Setup mock daily rollups (7 days baseline, 1 day current)
    // Baseline avg > 100000, current < 50%
    await db.delete(schema.analyticsAlerts).where(eq(schema.analyticsAlerts.accountId, acmeAccountId));
    await db.delete(schema.analyticsDailyAccount).where(eq(schema.analyticsDailyAccount.accountId, acmeAccountId));

    // Insert 7 baseline days
    for (let i = 1; i <= 7; i++) {
      await db.insert(schema.analyticsDailyAccount).values({
        accountId: acmeAccountId,
        businessDate: `2023-01-0${i}`,
        revenueCents: 150000,
        cogsCents: 50000,
        grossProfitCents: 100000,
        transactionCount: 10,
        customerCount: 10
      });
    }

    // Insert current day (huge drop)
    await db.insert(schema.analyticsDailyAccount).values({
      accountId: acmeAccountId,
      businessDate: `2023-01-08`,
      revenueCents: 20000, // < 50% of 150000
      cogsCents: 5000,
      grossProfitCents: 15000,
      transactionCount: 2,
      customerCount: 2
    });

    // Evaluate
    await evaluateAnomalyAlerts(acmeAccountId);

    const alerts = await db.select().from(schema.analyticsAlerts).where(eq(schema.analyticsAlerts.accountId, acmeAccountId));
    expect(alerts).toHaveLength(1);
    expect(alerts[0].status).toBe('candidate');
    expect(alerts[0].metricKey).toBe('revenue_drop');
  });

  it('upgrades a candidate alert to active if it persists on day 2', async () => {
    // Insert another day with a drop
    await db.insert(schema.analyticsDailyAccount).values({
      accountId: acmeAccountId,
      businessDate: `2023-01-09`,
      revenueCents: 25000, // Still < 50% of 150000 (roughly)
      cogsCents: 5000,
      grossProfitCents: 15000,
      transactionCount: 2,
      customerCount: 2
    });

    // Evaluate
    await evaluateAnomalyAlerts(acmeAccountId);

    const alerts = await db.select().from(schema.analyticsAlerts).where(eq(schema.analyticsAlerts.accountId, acmeAccountId));
    expect(alerts).toHaveLength(1);
    expect(alerts[0].status).toBe('active');
    expect(alerts[0].consecutivePeriods).toBe(2);
  });

  it('resolves an active alert when the anomaly stops', async () => {
    // Insert a recovery day
    await db.insert(schema.analyticsDailyAccount).values({
      accountId: acmeAccountId,
      businessDate: `2023-01-10`,
      revenueCents: 160000, // Recovered!
      cogsCents: 50000,
      grossProfitCents: 100000,
      transactionCount: 12,
      customerCount: 10
    });

    // Evaluate
    await evaluateAnomalyAlerts(acmeAccountId);

    const alerts = await db.select().from(schema.analyticsAlerts).where(eq(schema.analyticsAlerts.accountId, acmeAccountId));
    expect(alerts).toHaveLength(1);
    expect(alerts[0].status).toBe('resolved');
  });
});
