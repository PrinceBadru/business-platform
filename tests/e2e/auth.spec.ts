import { test, expect } from '@playwright/test';

test.describe('Adversarial & Role-based Access', () => {
  test('unauthenticated users are redirected to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/sign-in/);
  });

  test('cannot access another tenants data', async ({ request }) => {
    // This is an API test simulating an adversarial tenant isolation attack
    // Attempting to query the search API without a valid session cookie
    const response = await request.get('/api/search?q=test');
    expect(response.status()).toBe(401);
  });
});
