import { test, expect } from '@playwright/test';

test.describe('Routing & Access Control', () => {

  test('Landing page loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Nexus Finance').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign In' }).first()).toBeVisible();
  });

  test('Sign In page loads successfully', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.locator('text=Sign In').first()).toBeVisible();
  });

  test('Protected dashboard route redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/sign-in**', { timeout: 10000 });
    expect(page.url()).toContain('/sign-in');
  });

  test('Protected transactions route redirects to sign-in', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForURL('**/sign-in**', { timeout: 10000 });
    expect(page.url()).toContain('/sign-in');
  });

  test('Protected inventory route redirects to sign-in', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForURL('**/sign-in**', { timeout: 10000 });
    expect(page.url()).toContain('/sign-in');
  });

});
