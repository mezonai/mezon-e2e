import { Page, expect } from '@playwright/test';

export class ToastSelector {
  private page: Page;
  private static readonly TOAST_BODY_SELECTOR = '.Toastify__toast-body';

  constructor(page: Page) {
    this.page = page;
  }

  get container() {
    return this.page.locator('.Toastify__toast-container');
  }

  get toast() {
    return this.page.locator('.Toastify__toast');
  }

  get toastBody() {
    return this.page.locator(ToastSelector.TOAST_BODY_SELECTOR);
  }

  get toastClose() {
    return this.page.locator('.Toastify__close-button');
  }

  get success() {
    return this.page.locator('.Toastify__toast--success');
  }

  get error() {
    return this.page.locator('.Toastify__toast--error');
  }

  get warning() {
    return this.page.locator('.Toastify__toast--warning');
  }

  get info() {
    return this.page.locator('.Toastify__toast--info');
  }

  get progressBar() {
    return this.page.locator('.Toastify__progress-bar');
  }

  async waitForToast(timeout: number = 10000): Promise<void> {
    await this.toast.first().waitFor({ state: 'visible', timeout });
  }

  async waitForToastToDisappear(timeout: number = 10000): Promise<void> {
    await this.toast.first().waitFor({ state: 'hidden', timeout });
  }

  async getToastMessage(): Promise<string> {
    await this.waitForToast();
    return (await this.toastBody.first().textContent()) || '';
  }

  async verifyToastMessage(expectedMessage: string): Promise<void> {
    await this.waitForToast();
    const toastMessage = await this.getToastMessage();
    expect(toastMessage).toContain(expectedMessage);
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

  async verifyWarningToast(expectedMessage?: string): Promise<void> {
    await this.warning.first().waitFor({ state: 'visible', timeout: 10000 });
    if (expectedMessage) {
      const toastMessage = await this.warning
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

  async closeToast(): Promise<void> {
    await this.toastClose.first().click();
  }

  async isToastVisible(): Promise<boolean> {
    const toastCount = await this.toast.count();
    return toastCount > 0;
  }

  async getToastType(): Promise<string> {
    await this.waitForToast();

    if ((await this.success.count()) > 0) return 'success';
    if ((await this.error.count()) > 0) return 'error';
    if ((await this.warning.count()) > 0) return 'warning';
    if ((await this.info.count()) > 0) return 'info';

    return 'default';
  }

  async waitForToastAndVerify(
    expectedType: 'success' | 'error' | 'warning' | 'info',
    expectedMessage?: string
  ): Promise<void> {
    switch (expectedType) {
      case 'success':
        await this.verifySuccessToast(expectedMessage);
        break;
      case 'error':
        await this.verifyErrorToast(expectedMessage);
        break;
      case 'warning':
        await this.verifyWarningToast(expectedMessage);
        break;
      case 'info':
        await this.verifyInfoToast(expectedMessage);
        break;
    }
  }
}
