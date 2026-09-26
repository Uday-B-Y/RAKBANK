import { Page, expect } from '@playwright/test';
import { CIKeepAlive } from '../sync/CIKeepAlive';

export abstract class BasePage {
  private static modalHandlerRegistered = new WeakSet<Page>();

  constructor(protected readonly page: Page) {
    CIKeepAlive.bind(page);
    BasePage.registerModalHandler(page);
  }

  /**
   * Register a global locator handler that auto-dismisses blocking modals.
   *
   * ── CONFIGURE FOR YOUR APP ──
   * The selectors below target a generic modal pattern. Update them to match
   * your application's modal/dialog implementation:
   *   - Bootstrap:  '#alert-modal.in'  / '.modal-backdrop'
   *   - React MUI:  '[role="dialog"][aria-modal="true"]'  / '.MuiBackdrop-root'
   *   - Custom:     update the locator strings accordingly
   *
   * Opt out per-worker: set process.env.DISABLE_MODAL_HANDLER = '1' before
   * constructing any BasePage (for flows that intentionally interact with modals).
   */
  private static registerModalHandler(page: Page): void {
    if (process.env.DISABLE_MODAL_HANDLER === '1') return;
    if (BasePage.modalHandlerRegistered.has(page)) return;
    BasePage.modalHandlerRegistered.add(page);

    // Generic modal handler — matches both Bootstrap and MUI patterns
    page.addLocatorHandler(
      page.locator('#alert-modal.in, [role="dialog"][aria-modal="true"]'),
      async () => {
        const okBtn = page.locator('#alert-modal, [role="dialog"]').getByRole('button', { name: 'OK' });
        if (await okBtn.isVisible().catch(() => false)) {
          await okBtn.click().catch(() => {});
        } else {
          await page.keyboard.press('Escape');
        }
        await page.locator('#alert-modal.in, [role="dialog"][aria-modal="true"]')
          .waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
        await page.evaluate(() => {
          document.querySelectorAll('#alert-modal').forEach((m) => (m as HTMLElement).style.display = 'none');
          document.querySelectorAll('.modal-backdrop, .MuiBackdrop-root').forEach((b) => b.remove());
          document.body.classList.remove('modal-open');
        }).catch(() => {});
      }
    );
  }

  get getPage(): Page {
    return this.page;
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.locator('body')).toBeVisible({ timeout: 30000 });
    await this.dismissBlockingModal();
  }

  private async dismissBlockingModal(): Promise<void> {
    const alertModal = this.page.locator('#alert-modal, [role="dialog"][aria-modal="true"]');
    if (await alertModal.first().isVisible().catch(() => false)) {
      const okBtn = alertModal.first().getByRole('button', { name: 'OK' });
      await okBtn.click({ timeout: 2000 }).catch(async () => {
        await this.page.keyboard.press('Escape');
      });
      await alertModal.first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }

    const backdrop = this.page.locator('.modal-backdrop, .MuiBackdrop-root');
    if (await backdrop.first().isVisible().catch(() => false)) {
      await this.page.keyboard.press('Escape');
      await backdrop.first().waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
    }
  }

  protected async clickBodyCorner(): Promise<void> {
    await this.page.locator('body').click({ position: { x: 0, y: 0 } });
  }

  protected async waitForModalVisible(timeout = 5000): Promise<void> {
    await this.page.locator('#alert-modal, [role="dialog"][aria-modal="true"]')
      .first().waitFor({ state: 'visible', timeout }).catch(() => {});
  }

  protected async waitForModalHidden(timeout = 30000): Promise<void> {
    await this.page.locator('#alert-modal, [role="dialog"][aria-modal="true"]')
      .first().waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  protected async waitForBackdropHidden(timeout = 10000): Promise<void> {
    await this.page.locator('.modal-backdrop, .MuiBackdrop-root')
      .first().waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  protected async clickVisibleButtonByText(label: string): Promise<boolean> {
    return await this.page.evaluate((target) => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent?.trim() === target && (b as HTMLElement).offsetParent !== null);
      if (btn) {
        (btn as HTMLButtonElement).click();
        return true;
      }
      return false;
    }, label);
  }
}
