import { Page } from '@playwright/test';

export class CIKeepAlive {
  static bind(page: Page) {
    setInterval(() => {
      page.evaluate(() => performance.now()).catch(() => {});
    }, 180000);
  }
}
