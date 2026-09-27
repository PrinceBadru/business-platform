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

test.describe('Console Error Checks', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('No console errors when navigating sidebar', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', exception => {
      consoleErrors.push(exception.message);
    });

    await signInWithPassword(page, ACME_EMAIL, ACME_PASSWORD);

    const links = [
      'Dashboard',
      'Inventory',
      'Transactions',
      'Customers',
      'Suppliers',
      'Debts',
      'Team',
      'Benchmarking',
      'Settings'
    ];

    for (const linkText of links) {
      await page.getByRole('link', { name: linkText, exact: true }).click();
      await page.waitForTimeout(500); // give time for errors to log
    }

    expect(consoleErrors).toEqual([]);
  });
});
