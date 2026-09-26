import { NetworkWatcher } from '../sync/NetworkWatcher';
import { Page, Locator } from '@playwright/test';

export abstract class BaseAction {
  protected page: Page | undefined;

  protected setPage(page: Page) {
    this.page = page;
  }

  protected async runWithNetwork(
    action: () => Promise<void>,
    url: RegExp,
    method: string = 'POST',
    status: number = 200,
    timeout?: number
  ) {
    if (!this.page) {
      throw new Error('Page must be set in Action constructor');
    }
    await NetworkWatcher.actionWithApiWait(action, { url, method, status, timeout }, this.page);
  }

  protected async ensureOnHome(): Promise<void> {
    await this.page!.goto('/');
    await this.page!.locator('body').waitFor({ state: 'visible', timeout: 30000 });
  }

  protected async safeFill(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
    await this.page!.keyboard.press('Escape');
  }
}
