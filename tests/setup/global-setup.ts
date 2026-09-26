import { test as setup } from '@playwright/test';

// ── CONFIGURE FOR YOUR APP ──
// Update the login flow below to match your application's authentication:
// - Login page URL / route
// - Credential field selectors
// - Post-login landing page URL
// - Any MFA or consent steps

setup('authenticate', async ({ page }) => {
  await page.goto('/');

  // -- Replace with your app's login selectors --
  // await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL || '');
  // await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD || '');
  // await page.getByRole('button', { name: 'Sign In' }).click();

  // -- Wait for post-login landing page --
  // await page.waitForURL('**/dashboard', { timeout: 30000 });

  await page.context().storageState({ path: 'storageState.json' });
});
