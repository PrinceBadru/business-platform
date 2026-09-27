/**
 * Integration tests for the session lifecycle and username-based lookup.
 * Requires a live PostgreSQL connection (run `docker compose up -d` first).
 * Seed data is expected (run `npm run db:seed`).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, client } from '../lib/db/drizzle';
import * as schema from '../lib/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../modules/auth/password';
import crypto from 'crypto';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createTestUser(suffix: string) {
  const email = `test_${suffix}@test.local`;
  const username = `test_${suffix}`;
  const hash = await hashPassword('test_password_123');
  const [user] = await db.insert(schema.users).values({
    email,
    username,
    name: `Test ${suffix}`,
    passwordHash: hash,
  }).returning();
  return user;
}

async function cleanupUser(userId: string) {
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
  await db.delete(schema.users).where(eq(schema.users.id, userId));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Session Lifecycle Integration', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await createTestUser('session');
    userId = user.id;
  });

  afterAll(async () => {
    await cleanupUser(userId);
  });

  it('creates a session with a valid expiry', async () => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    await db.insert(schema.sessions).values({ id: token, userId, expiresAt });

    const rows = await db.select().from(schema.sessions).where(eq(schema.sessions.id, token));
    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe(userId);
    expect(rows[0].revokedAt).toBeNull();
    expect(new Date(rows[0].expiresAt).getTime()).toBeGreaterThan(Date.now());

    // cleanup
    await db.delete(schema.sessions).where(eq(schema.sessions.id, token));
  });

  it('validateSession returns null for revoked sessions', async () => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const revokedAt = new Date();

    await db.insert(schema.sessions).values({ id: token, userId, expiresAt, revokedAt });

    const rows = await db.select().from(schema.sessions).where(
      and(
        eq(schema.sessions.id, token),
        isNull(schema.sessions.revokedAt),
        gt(schema.sessions.expiresAt, new Date()),
      )
    );
    expect(rows).toHaveLength(0); // revoked — should not validate

    await db.delete(schema.sessions).where(eq(schema.sessions.id, token));
  });

  it('validateSession returns null for expired sessions', async () => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() - 1000); // already expired

    await db.insert(schema.sessions).values({ id: token, userId, expiresAt });

    const rows = await db.select().from(schema.sessions).where(
      and(
        eq(schema.sessions.id, token),
        isNull(schema.sessions.revokedAt),
        gt(schema.sessions.expiresAt, new Date()),
      )
    );
    expect(rows).toHaveLength(0); // expired

    await db.delete(schema.sessions).where(eq(schema.sessions.id, token));
  });

  it('revoking a session sets revokedAt', async () => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await db.insert(schema.sessions).values({ id: token, userId, expiresAt });
    await db.update(schema.sessions).set({ revokedAt: new Date() }).where(eq(schema.sessions.id, token));

    const rows = await db.select().from(schema.sessions).where(eq(schema.sessions.id, token));
    expect(rows[0].revokedAt).not.toBeNull();

    await db.delete(schema.sessions).where(eq(schema.sessions.id, token));
  });
});

describe('Username & Email Lookup Integration', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await createTestUser('lookup');
    userId = user.id;
  });

  afterAll(async () => {
    await cleanupUser(userId);
  });

  it('looks up a user by email', async () => {
    const rows = await db.select().from(schema.users).where(eq(schema.users.email, 'test_lookup@test.local'));
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(userId);
  });

  it('looks up a user by username', async () => {
    const rows = await db.select().from(schema.users).where(eq(schema.users.username, 'test_lookup'));
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(userId);
  });

  it('password verification succeeds with the correct password', async () => {
    const rows = await db.select().from(schema.users).where(eq(schema.users.username, 'test_lookup'));
    const user = rows[0];
    expect(await verifyPassword('test_password_123', user.passwordHash!)).toBe(true);
  });

  it('password verification fails with a wrong password', async () => {
    const rows = await db.select().from(schema.users).where(eq(schema.users.username, 'test_lookup'));
    const user = rows[0];
    expect(await verifyPassword('wrong_password', user.passwordHash!)).toBe(false);
  });

  it('email uniqueness constraint prevents duplicate registration', async () => {
    await expect(
      db.insert(schema.users).values({
        email: 'test_lookup@test.local', // same email
        username: 'different_username',
        name: 'Duplicate',
        passwordHash: 'x',
      })
    ).rejects.toThrow();
  });

  it('username uniqueness constraint prevents duplicate usernames', async () => {
    await expect(
      db.insert(schema.users).values({
        email: 'different@test.local',
        username: 'test_lookup', // same username
        name: 'Duplicate',
        passwordHash: 'x',
      })
    ).rejects.toThrow();
  });
});

describe('RBAC Integration — can() with real DB', () => {
  let ownerId: string;
  let employeeId: string;
  let accountId: string;
  let locationId: string;

  beforeAll(async () => {
    // Create test account
    const [account] = await db.insert(schema.accounts).values({
      name: 'RBAC Test Account',
      businessType: 'retail',
    }).returning();
    accountId = account.id;

    // Create test location
    const [location] = await db.insert(schema.locations).values({
      accountId,
      name: 'RBAC Test Location',
    }).returning();
    locationId = location.id;

    // Create owner user
    const owner = await createTestUser('rbac_owner');
    ownerId = owner.id;
    await db.insert(schema.userAccountRoles).values({ userId: ownerId, accountId, role: 'owner' });
    await db.insert(schema.userLocationAccess).values({ userId: ownerId, accountId, locationId });

    // Create employee user with NO location access
    const employee = await createTestUser('rbac_employee');
    employeeId = employee.id;
    await db.insert(schema.userAccountRoles).values({ userId: employeeId, accountId, role: 'employee' });
    // Intentionally no location access granted to employee
  });

  afterAll(async () => {
    await db.delete(schema.userLocationAccess).where(eq(schema.userLocationAccess.accountId, accountId));
    await db.delete(schema.userAccountRoles).where(eq(schema.userAccountRoles.accountId, accountId));
    await db.delete(schema.locations).where(eq(schema.locations.accountId, accountId));
    await db.delete(schema.accounts).where(eq(schema.accounts.id, accountId));
    await cleanupUser(ownerId);
    await cleanupUser(employeeId);
  });

  it('owner can perform any action on the account', async () => {
    const { can } = await import('../modules/rbac/can');
    expect(await can(ownerId, accountId, 'account:delete')).toBe(true);
    expect(await can(ownerId, accountId, 'billing:manage')).toBe(true);
    expect(await can(ownerId, accountId, 'users:manage')).toBe(true);
  });

  it('owner can access any location without explicit grant (owner bypass)', async () => {
    const { can } = await import('../modules/rbac/can');
    expect(await can(ownerId, accountId, 'locations:read', locationId)).toBe(true);
  });

  it('employee can write transactions on the account', async () => {
    const { can } = await import('../modules/rbac/can');
    expect(await can(employeeId, accountId, 'transactions:write')).toBe(true);
  });

  it('employee is denied account:delete', async () => {
    const { can } = await import('../modules/rbac/can');
    expect(await can(employeeId, accountId, 'account:delete')).toBe(false);
  });

  it('employee without location access is denied location-scoped transaction:write', async () => {
    const { can } = await import('../modules/rbac/can');
    expect(await can(employeeId, accountId, 'transactions:write', locationId)).toBe(false);
  });

  it('unknown user has no permissions', async () => {
    const { can } = await import('../modules/rbac/can');
    expect(await can(crypto.randomUUID(), accountId, 'locations:read')).toBe(false);
  });
});

afterAll(async () => {
  await client.end();
});
