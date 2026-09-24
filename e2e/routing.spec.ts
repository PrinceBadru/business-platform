import { test, expect } from '@playwright/test';

test.describe('Routing & Access Control', () => {
  
  test('Sign In page loads successfully', async ({ page }) => {
    // Navigate to sign in
    await page.goto('/sign-in');
    
    // Expect to see the form or auth UI
    await expect(page.locator('text=Sign In').first()).toBeVisible();
  });

  test('Protected dashboard route redirects to sign-in', async ({ page }) => {
    // Attempt to navigate to a protected dashboard route without a session
    await page.goto('/dashboard');

    // Clerk should intercept and redirect to their sign-in page, or our custom /sign-in page
    await page.waitForURL('**/sign-in**', { timeout: 10000 });
    
    // Verify the URL changed successfully to the auth page
    expect(page.url()).toContain('/sign-in');
  });

  test('Protected transactions route redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await page.waitForURL('**/sign-in**', { timeout: 10000 });
    expect(page.url()).toContain('/sign-in');
  });

});
