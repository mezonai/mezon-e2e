import joinUrlPaths from '@/utils/joinUrlPaths';
import { type Page } from '@playwright/test';

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

  async goBack(): Promise<void> {
    await this.page.goBack();
    await this.waitForPageLoad();
  }
}
