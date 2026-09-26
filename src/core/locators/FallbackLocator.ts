import { Page, Locator } from '@playwright/test';
import { GlobalLocatorTelemetry } from '@/core/telemetry/locator-telemetry';

interface LocatorConfig {
  primary: string;
  fallback: string[];
  score: number;
}

export class FallbackLocator {

  private promoted = false;

  constructor(
    private readonly page: Page,
    private readonly config: LocatorConfig
  ) {}

  private async resolve(): Promise<Locator> {

    const start = Date.now();
    let attempts = 0;

    const health = GlobalLocatorTelemetry.getSelectorHealth(
      this.config.primary
    );

    const shouldPromote =
      GlobalLocatorTelemetry.shouldPromoteFallback(
        this.config.primary
      );

    const selectorOrder = shouldPromote && this.config.fallback.length > 0
      ? [this.config.fallback[0], this.config.primary]
      : [this.config.primary, ...this.config.fallback];

    for (const selector of selectorOrder) {
      try {
        attempts++;
        const locator = this.page.locator(selector);
        await locator.first().waitFor({ timeout: 1500 });

        const fallbackUsed =
          selector !== this.config.primary;

        GlobalLocatorTelemetry.record({
          primary: this.config.primary,
          fallbackUsed,
          attempts,
          durationMs: Date.now() - start
        });

        return locator;

      } catch {
        continue;
      }
    }

    throw new Error(
      `Locator failed: ${this.config.primary}`
    );
  }

  async click() {
    const locator = await this.resolve();
    await locator.click();
  }

  async fill(value: string) {
    const locator = await this.resolve();
    await locator.fill(value);
  }

  async getText(): Promise<string> {
    const locator = await this.resolve();
    return locator.innerText();
  }
}
