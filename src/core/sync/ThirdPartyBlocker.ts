import { Page } from '@playwright/test';

// ── CONFIGURE FOR YOUR APP ──
// Add domains of third-party scripts that interfere with test stability
// (analytics, chat widgets, A/B testing, etc.)
const BLOCKED_PATTERN = /\.(intercom\.io|hotjar\.com|segment\.com|fullstory\.com|pendo\.io|survicate\.com|whatfix\.com)\//;

export class ThirdPartyBlocker {
  private static registered = new WeakSet<Page>();

  static async block(page: Page): Promise<void> {
    if (ThirdPartyBlocker.registered.has(page)) return;
    ThirdPartyBlocker.registered.add(page);

    await page.route(BLOCKED_PATTERN, route => route.abort());

    page.addLocatorHandler(
      page.locator('[data-third-party-popup], #wfx-player-popup, .intercom-lightweight-app'),
      async () => {
        const closeBtn = page
          .locator('[data-third-party-popup], #wfx-player-popup, .intercom-lightweight-app')
          .locator('button, [aria-label="Close"], .close')
          .first();
        if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await closeBtn.click().catch(() => {});
        } else {
          await page.keyboard.press('Escape');
        }
      }
    );
  }
}
