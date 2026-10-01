import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { db, client } from '../lib/db/drizzle';
import * as schema from '../lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { processCheckout } from '../modules/checkout/mutations';

// Mock the current session for auth
import * as sessionModule from '../modules/auth/session';
import * as rbacGuard from '../modules/rbac/guard';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Analytics Invalidation & Idempotency', () => {
  let acmeAccountId: string;
  let adminUserId: string;
  let locationId: string;
  let offeringId: string;

  beforeAll(async () => {
    const accounts = await db.select().from(schema.accounts);
    acmeAccountId = accounts.find(a => a.name === 'Acme Retail')?.id || '';

    const users = await db.select().from(schema.users);
    adminUserId = users[0]?.id || '';

    const locs = await db.select().from(schema.locations).where(eq(schema.locations.accountId, acmeAccountId));
    locationId = locs[0]?.id || '';

    const offs = await db.select().from(schema.offerings).where(eq(schema.offerings.accountId, acmeAccountId));
    offeringId = offs[0]?.id || '';

    vi.spyOn(sessionModule, 'getCurrentSession').mockResolvedValue({
      userId: adminUserId,
      accountId: acmeAccountId,
      sessionId: 'test-session',
      role: 'admin'
    } as any);

    vi.spyOn(rbacGuard, 'requirePermission').mockImplementation((perm: any) => async (cb: any) => await cb());
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  it('successful checkout creates a single dirty scope marker', async () => {
    // Clear scopes for this account
    await db.delete(schema.analyticsDirtyScopes).where(eq(schema.analyticsDirtyScopes.accountId, acmeAccountId));

    await processCheckout(locationId, null, [{ offeringId, quantity: 1 }], false);

    const scopes = await db.select().from(schema.analyticsDirtyScopes).where(eq(schema.analyticsDirtyScopes.accountId, acmeAccountId));
    expect(scopes.length).toBe(1);
    expect(scopes[0].status).toBe('pending');
    expect(scopes[0].offeringIdsChanged).toContain(offeringId);
  });

  it('subsequent checkouts on the same day coalesce into the same pending marker', async () => {
    await processCheckout(locationId, null, [{ offeringId, quantity: 1 }], false);

    const scopes = await db.select().from(schema.analyticsDirtyScopes).where(eq(schema.analyticsDirtyScopes.accountId, acmeAccountId));
    // Should still be exactly 1 because it coalesces via ON CONFLICT DO UPDATE
    expect(scopes.length).toBe(1);
  });

  it('failed business transaction does not create analytics marker (rollback)', async () => {
    const initialScopesCount = (await db.select({ value: count() }).from(schema.analyticsDirtyScopes))[0].value;

    // Force a failure
    await expect(
      processCheckout(locationId, null, [{ offeringId: 'non-existent-id', quantity: 1 }], false)
    ).rejects.toThrow();

    const newScopesCount = (await db.select({ value: count() }).from(schema.analyticsDirtyScopes))[0].value;
    expect(newScopesCount).toBe(initialScopesCount);
  });
});
