import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { db, client } from '../lib/db/drizzle';
import * as schema from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { computeL1Snapshots } from '../modules/analytics/snapshots';
import { getDashboardMetrics } from '../modules/analytics/queries';

// Mock session
import * as sessionModule from '../modules/auth/session';
import * as rbacGuard from '../modules/rbac/guard';

describe('Analytics L1 Snapshots', () => {
  let acmeAccountId: string;

  beforeAll(async () => {
    const accounts = await db.select().from(schema.accounts);
    acmeAccountId = accounts.find(a => a.name === 'Acme Retail')?.id || '';

    vi.spyOn(sessionModule, 'getCurrentSession').mockResolvedValue({
      userId: 'test-user',
      accountId: acmeAccountId,
      sessionId: 'test-session',
      role: 'admin'
    } as any);
    
    vi.spyOn(rbacGuard, 'requirePermission').mockImplementation((perm: any) => async (cb: any) => await cb());
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  it('generates correct snapshot statuses for an empty state', async () => {
    // 1. Delete existing daily summaries and snapshots to force empty state
    await db.delete(schema.analyticsDailyAccount).where(eq(schema.analyticsDailyAccount.accountId, acmeAccountId));
    await db.delete(schema.analyticsMetricSnapshots).where(eq(schema.analyticsMetricSnapshots.accountId, acmeAccountId));

    await computeL1Snapshots(acmeAccountId, null);

    const metrics = await getDashboardMetrics(acmeAccountId);

    expect(metrics.revenue).toBe(0);
    expect(metrics.transactionCount).toBe(0);
    expect(metrics.grossMarginPercent).toBe(0);
    
    // Status should be computed but with 0 values
    expect(metrics.meta.freshnessStatus).not.toBe('insufficient_data'); 
  });

  it('detects updating state when dirty scopes are pending', async () => {
    // Insert a dummy pending scope
    await db.insert(schema.analyticsDirtyScopes).values({
      accountId: acmeAccountId,
      locationId: 'dummy-loc',
      businessDate: '2023-01-01',
      metricFamiliesDirty: ['revenue'],
      status: 'pending'
    });

    const metrics = await getDashboardMetrics(acmeAccountId);
    expect(metrics.meta.freshnessStatus).toBe('updating');

    // Clean up
    await db.delete(schema.analyticsDirtyScopes).where(eq(schema.analyticsDirtyScopes.accountId, acmeAccountId));
  });
});
