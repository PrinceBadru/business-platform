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

test.describe('UI Actions Mutation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await signInWithPassword(page, ACME_EMAIL, ACME_PASSWORD);
  });

  test('Creating an inventory item works', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    
    // Fill the add item form
    await page.getByPlaceholder('Haircut / Widget').fill('Test Product');
    await page.getByPlaceholder('25.00').fill('15.50');
    await page.getByPlaceholder('10.00').fill('10.00');
    
    // Submit
    await page.getByRole('button', { name: 'Add Item' }).click();
    
    // Expect the new item to appear in the list
    await expect(page.locator('text="Test Product"')).toBeVisible({ timeout: 5000 });
  });

  test('Creating a customer works', async ({ page }) => {
    await page.goto('/dashboard/customers');
    
    // Assuming placeholder based on common patterns
    await page.getByPlaceholder('John Doe').fill('Test Customer');
    await page.getByRole('button', { name: 'Add Customer' }).click();
    
    await expect(page.locator('text="Test Customer"')).toBeVisible({ timeout: 5000 });
  });
});
