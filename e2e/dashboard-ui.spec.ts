import { test, expect, Page } from '@playwright/test';

// Use demo account credentials
const ACME_EMAIL = 'admin@acmeretail.com';
const ACME_PASSWORD = 'password123';

async function signInWithPassword(page: Page, identifier: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email or Username').fill(identifier);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL('**/dashboard**');
}

test.describe('Dashboard UI Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await signInWithPassword(page, ACME_EMAIL, ACME_PASSWORD);
  });

  const routes = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Point of Sale', path: '/checkout' },
    { name: 'Transactions', path: '/transactions' },
    { name: 'Debts', path: '/debts' },
    { name: 'Customers', path: '/customers' },
    { name: 'Locations', path: '/locations' },
    { name: 'Team', path: '/team' },
    { name: 'Inventory', path: '/inventory' },
    { name: 'Suppliers', path: '/suppliers' },
    { name: 'Billing', path: '/billing' },
    { name: 'Benchmarking', path: '/benchmarking' },
    { name: 'Settings', path: '/settings' },
  ];

  for (const route of routes) {
    test(`Navigating to ${route.name} via sidebar should not throw errors`, async ({ page }) => {
      // First, ensure we are on the dashboard
      await page.goto('/dashboard');
      
      // Click the sidebar link
      await page.getByRole('link', { name: new RegExp('^' + route.name + '$', 'i') }).first().click();
      
      // Wait for URL to change
      await page.waitForURL(`**${route.path}**`);
      
      // Check that Next.js did not render an error overlay
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible({ timeout: 5000 });
      
      // Also ensure "Next.js" error text isn't randomly on screen
      const errorText = page.locator('text="Unhandled Runtime Error"');
      await expect(errorText).toHaveCount(0);
      
      // And ensure it's not a 404 page
      const notFoundText = page.locator('text="Page Not Found"');
      await expect(notFoundText).toHaveCount(0);
    });
  }
});
