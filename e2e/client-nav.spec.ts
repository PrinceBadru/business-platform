import { test, expect, Page } from '@playwright/test';

const ACME_EMAIL = 'admin@acmeretail.com';
const ACME_PASSWORD = 'password123';

async function signInWithPassword(page: Page, identifier: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email or Username').fill(identifier);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL('**/dashboard**');
}

test.describe('Dashboard Sidebar Navigation (Client-Side)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await signInWithPassword(page, ACME_EMAIL, ACME_PASSWORD);
  });

  test('Clicking all sidebar links works without throwing errors', async ({ page }) => {
    const links = [
      'Dashboard',
      'Inventory',
      'Transactions',
      'Customers',
      'Suppliers',
      'Debts',
      'Team',
      'Benchmarking',
      'Settings',
      'Point of Sale',
      'Locations',
      'Billing'
    ];

    for (const linkText of links) {
      console.log(`Clicking ${linkText}...`);
      await page.getByRole('link', { name: linkText, exact: true }).click();
      
      // Check that Next.js did not render an error overlay
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible({ timeout: 5000 });
      
      const errorText = page.locator('text="Unhandled Runtime Error"');
      await expect(errorText).toHaveCount(0);
      
      const notFoundText = page.locator('text="Page Not Found"');
      await expect(notFoundText).toHaveCount(0);
    }
  });
});
