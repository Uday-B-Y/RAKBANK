import { Page } from '@playwright/test';

type ApiWait = { url: RegExp; method?: string; status?: number; timeout?: number };

export class NetworkWatcher {
  static async actionWithApiWait(
    action: () => Promise<void>,
    wait: ApiWait,
    page?: Page
  ) {
    if (!page) throw new Error('NetworkWatcher requires Page');

    const isCI = process.env.CI === 'true'
      || process.env.AZURE === 'true'
      || process.env.AWS_CODEBUILD === 'true'
      || process.env.GITHUB_ACTIONS === 'true';

    const defaultTimeout = isCI ? 60000 : 30000;
    const [response] = await Promise.all([
      page.waitForResponse(
        r =>
          wait.url.test(r.url()) &&
          (!wait.method || r.request().method() === wait.method) &&
          (!wait.status || r.status() === wait.status),
        { timeout: wait.timeout || defaultTimeout }
      ),
      action()
    ]);

    return response;
  }
}
