/**
 * E2E Auth & Authorization tests.
 * Covers: sign-up → onboarding → dashboard, sign-in by email,
 * sign-in by username, protected route guards, and tenant isolation.
 *
 * Requires: `npm run dev` server running on http://localhost:3000
 * Seed data expected: `npm run db:seed`
 */
import { test, expect, type Page } from '@playwright/test';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACME_EMAIL    = 'admin@acmeretail.com';
const ACME_USERNAME = 'acme_admin';
const ACME_PASSWORD = 'password123';

const GLOBEX_EMAIL    = 'admin@globex.com';
const GLOBEX_USERNAME = 'globex_admin';
const GLOBEX_PASSWORD = 'password123';

// Unique email/username per test run so tests are idempotent
const RUN_ID = Date.now();
const NEW_EMAIL    = `e2e_${RUN_ID}@test.local`;
const NEW_USERNAME = `e2e_${RUN_ID}`;
const NEW_PASSWORD = 'E2eTestPass!99';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function signInWithPassword(page: Page, identifier: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email or Username').fill(identifier);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
}

async function clearAuth(page: Page) {
  // Clear cookies to reset auth state between tests
  await page.context().clearCookies();
}

// ─── 1. Unauthenticated Route Guards ─────────────────────────────────────────

test.describe('Unauthenticated route guards', () => {
  test('/ loads the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
  });

  test('/sign-in page renders the identifier field', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByLabel('Email or Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('/sign-up page renders the username field', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('/dashboard redirects to /sign-in when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/sign-in**', { timeout: 10_000 });
    expect(page.url()).toContain('/sign-in');
  });

  test('/onboarding redirects to /sign-in when unauthenticated', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForURL('**/sign-in**', { timeout: 10_000 });
    expect(page.url()).toContain('/sign-in');
  });

  test('/inventory redirects to /sign-in when unauthenticated', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForURL('**/sign-in**', { timeout: 10_000 });
    expect(page.url()).toContain('/sign-in');
  });

  test('/customers redirects to /sign-in when unauthenticated', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForURL('**/sign-in**', { timeout: 10_000 });
    expect(page.url()).toContain('/sign-in');
  });
});

// ─── 2. Sign-in by Email ──────────────────────────────────────────────────────

test.describe('Sign-in by email (Acme Retail)', () => {
  test.beforeEach(async ({ page }) => { await clearAuth(page); });

  test('signs in with email and reaches /dashboard', async ({ page }) => {
    await signInWithPassword(page, ACME_EMAIL, ACME_PASSWORD);
    await page.waitForURL('**/dashboard**', { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('shows an error for a wrong password', async ({ page }) => {
    await signInWithPassword(page, ACME_EMAIL, 'wrong_password');
    await expect(page.locator('p.text-red-500')).toBeVisible({ timeout: 8_000 });
  });

  test('shows an error for an unknown email', async ({ page }) => {
    await signInWithPassword(page, 'nobody@nowhere.com', ACME_PASSWORD);
    await expect(page.locator('p.text-red-500')).toBeVisible({ timeout: 8_000 });
  });
});

// ─── 3. Sign-in by Username ───────────────────────────────────────────────────

test.describe('Sign-in by username', () => {
  test.beforeEach(async ({ page }) => { await clearAuth(page); });

  test('Acme admin signs in with username "acme_admin"', async ({ page }) => {
    await signInWithPassword(page, ACME_USERNAME, ACME_PASSWORD);
    await page.waitForURL('**/dashboard**', { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('Globex admin signs in with username "globex_admin"', async ({ page }) => {
    await signInWithPassword(page, GLOBEX_USERNAME, GLOBEX_PASSWORD);
    await page.waitForURL('**/dashboard**', { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('shows an error for an unknown username', async ({ page }) => {
    await signInWithPassword(page, 'nonexistent_username', ACME_PASSWORD);
    await expect(page.locator('p.text-red-500')).toBeVisible({ timeout: 8_000 });
  });
});

// ─── 4. Sign-up → Onboarding → Dashboard ─────────────────────────────────────

test.describe('Sign-up → Onboarding → Dashboard flow', () => {
  test('new user signs up, completes onboarding, and reaches dashboard', async ({ page }) => {
    // Step 1: Sign Up
    await page.goto('/sign-up');
    await page.getByLabel('Full Name').fill('E2E Test User');
    await page.getByLabel('Username').fill(NEW_USERNAME);
    await page.getByLabel('Email').fill(NEW_EMAIL);
    await page.getByLabel('Password').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: /create account/i }).click();

    // Should land on /onboarding
    await page.waitForURL('**/onboarding**', { timeout: 15_000 });
    expect(page.url()).toContain('/onboarding');

    // Step 2: Onboarding
    await page.getByLabel('Business Name').fill('E2E Business Co.');
    // Select Retail business type
    await page.locator('input[name="businessType"][value="retail"]').check();
    await page.getByLabel('First Location Name').fill('E2E Main Store');
    await page.getByRole('button', { name: /create business/i }).click();

    // Step 3: Should reach dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('duplicate email on sign-up shows an error', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByLabel('Full Name').fill('Duplicate');
    await page.getByLabel('Username').fill(`dup_${RUN_ID}`);
    await page.getByLabel('Email').fill(ACME_EMAIL); // already seeded
    await page.getByLabel('Password').fill('SomePass123!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.locator('p.text-red-500')).toBeVisible({ timeout: 8_000 });
  });

  test('duplicate username on sign-up shows an error', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByLabel('Full Name').fill('Duplicate Username');
    await page.getByLabel('Username').fill(ACME_USERNAME); // already seeded
    await page.getByLabel('Email').fill(`unique_dup_${RUN_ID}@test.local`);
    await page.getByLabel('Password').fill('SomePass123!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.locator('p.text-red-500')).toBeVisible({ timeout: 8_000 });
  });

  test('invalid username format on sign-up shows an error', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByLabel('Full Name').fill('Bad Username');
    await page.getByLabel('Username').fill('ab'); // too short
    await page.getByLabel('Email').fill(`baduser_${RUN_ID}@test.local`);
    await page.getByLabel('Password').fill('SomePass123!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.locator('p.text-red-500')).toBeVisible({ timeout: 8_000 });
  });
});

// ─── 5. Authenticated Route Access ───────────────────────────────────────────

test.describe('Authenticated route access', () => {
  // Re-use a signed-in session across these tests via storageState
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
    await signInWithPassword(page, ACME_EMAIL, ACME_PASSWORD);
    await page.waitForURL('**/dashboard**', { timeout: 15_000 });
  });

  test('/dashboard is accessible after sign-in', async ({ page }) => {
    expect(page.url()).toContain('/dashboard');
    // The dashboard should render content, not redirect
    await expect(page.locator('h1')).toBeVisible();
  });

  test('/inventory is accessible after sign-in', async ({ page }) => {
    await page.goto('/inventory');
    // Should NOT redirect to sign-in
    await expect(page).not.toHaveURL(/sign-in/, { timeout: 5_000 });
  });

  test('/customers is accessible after sign-in', async ({ page }) => {
    await page.goto('/customers');
    await expect(page).not.toHaveURL(/sign-in/, { timeout: 5_000 });
  });

  test('/onboarding redirects to /dashboard when tenant is already set', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForURL('**/dashboard**', { timeout: 10_000 });
    expect(page.url()).toContain('/dashboard');
  });
});

// ─── 6. Tenant Isolation ─────────────────────────────────────────────────────

test.describe('Tenant isolation — Acme vs Globex', () => {
  test('Acme dashboard does not show Globex data', async ({ page }) => {
    await clearAuth(page);
    await signInWithPassword(page, ACME_EMAIL, ACME_PASSWORD);
    await page.waitForURL('**/dashboard**', { timeout: 15_000 });

    const content = await page.locator('body').textContent();
    expect(content).not.toContain('Globex Services');
  });

  test('Globex dashboard does not show Acme data', async ({ page }) => {
    await clearAuth(page);
    await signInWithPassword(page, GLOBEX_EMAIL, GLOBEX_PASSWORD);
    await page.waitForURL('**/dashboard**', { timeout: 15_000 });

    const content = await page.locator('body').textContent();
    expect(content).not.toContain('Acme Retail');
  });
});
