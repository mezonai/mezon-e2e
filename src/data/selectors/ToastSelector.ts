import { Page, expect } from '@playwright/test';

export class ToastSelector {
  private page: Page;
  private static readonly TOAST_BODY_SELECTOR = '.Toastify__toast-body';

  constructor(page: Page) {
    this.page = page;
  }

  get success() {
    return this.page.locator('.Toastify__toast--success');
  }

  get error() {
    return this.page.locator('.Toastify__toast--error');
  }

  get info() {
    return this.page.locator('.Toastify__toast--info');
  }

  async verifySuccessToast(expectedMessage?: string): Promise<void> {
    await this.success.first().waitFor({ state: 'visible', timeout: 10000 });
    if (expectedMessage) {
      const toastMessage = await this.success
        .first()
        .locator(ToastSelector.TOAST_BODY_SELECTOR)
        .textContent();
      expect(toastMessage).toContain(expectedMessage);
    }
  }

  async verifyErrorToast(expectedMessage?: string): Promise<void> {
    await this.error.first().waitFor({ state: 'visible', timeout: 10000 });
    if (expectedMessage) {
      const toastMessage = await this.error
        .first()
        .locator(ToastSelector.TOAST_BODY_SELECTOR)
        .textContent();
      expect(toastMessage).toContain(expectedMessage);
    }
  }

  async verifyInfoToast(expectedMessage?: string): Promise<void> {
    await this.info.first().waitFor({ state: 'visible', timeout: 10000 });
    if (expectedMessage) {
      const toastMessage = await this.info
        .first()
        .locator(ToastSelector.TOAST_BODY_SELECTOR)
        .textContent();
      expect(toastMessage).toContain(expectedMessage);
    }
  }
}
