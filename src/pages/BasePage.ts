import joinUrlPaths from '@/utils/joinUrlPaths';
import { type Locator, type Page, expect } from '@playwright/test';

export abstract class BasePage {
  public readonly page: Page;
  protected readonly baseURL: string;

  constructor(page: Page, baseURL: string = '') {
    this.page = page;
    this.baseURL = baseURL || process.env.BASE_URL || 'http://127.0.0.1:4200';
  }

  async navigate(path: string = ''): Promise<void> {
    const url = joinUrlPaths(this.baseURL, path);
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForElement(selector: string, timeout: number = 10000): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  }

  async waitForElementToHide(selector: string, timeout: number = 10000): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'hidden', timeout });
  }

  async isElementVisible(selector: string): Promise<boolean> {
    try {
      const locator = this.page.locator(selector);
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      // Ignore errors
      return false;
    }
  }

  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  async getCurrentURL(): Promise<string> {
    return this.page.url();
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  async scrollToElement(selector: string): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.scrollIntoViewIfNeeded();
  }

  async refresh(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  async goBack(): Promise<void> {
    await this.page.goBack();
    await this.waitForPageLoad();
  }

  async assertPageTitle(expectedTitle: string): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(expectedTitle, 'i'));
  }

  async assertCurrentURL(expectedPath: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(expectedPath));
  }

  async assertElementVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async assertElementText(selector: string, expectedText: string): Promise<void> {
    await expect(this.page.locator(selector)).toContainText(expectedText);
  }

  async getElementText(selector: string): Promise<string> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible' });
    return await locator.innerText();
  }
}
