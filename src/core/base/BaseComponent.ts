import { Locator, Page, expect } from '@playwright/test';

export abstract class BaseComponent {
  protected readonly root: Locator;

  constructor(protected readonly page: Page, selectorOrLocator: string | Locator) {
    this.root =
      typeof selectorOrLocator === 'string'
        ? page.locator(selectorOrLocator)
        : selectorOrLocator;
  }

  async waitForVisible(): Promise<void> {
    await expect(this.root).toBeVisible({ timeout: 30000 });
  }

  async waitForHidden(): Promise<void> {
    await expect(this.root).toBeHidden({ timeout: 30000 });
  }

  async isVisibleWithin(timeout = 10000): Promise<boolean> {
    return this.root.waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);
  }

  async waitForText(locator: Locator, expectedText: string, timeoutMs = 15000): Promise<void> {
    await expect(locator).toContainText(expectedText, { timeout: timeoutMs });
  }
}
