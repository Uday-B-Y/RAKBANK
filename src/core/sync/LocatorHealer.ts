import { Page, Locator } from '@playwright/test';

export class LocatorHealer {
  constructor(private readonly page: Page) {}

  async resolveWithFallback(
    primary: string,
    fallback: string[]
  ): Promise<Locator> {
    const candidates = [primary, ...fallback];

    for (const selector of candidates) {
      const loc = this.page.locator(selector);
      const count = await loc.count();

      if (count === 1) {
        return loc;
      }
    }

    throw new Error(`All fallback locators failed: ${primary}`);
  }
}
