import { Page, expect } from '@playwright/test';
import { loadLanguage } from './language-helper';

export class LanguageValidator {
  private dict: Record<string, string>;

  constructor(lang: string) {
    this.dict = loadLanguage(lang);
  }

  /** Get translated text by key */
  get(key: string): string {
    const value = this.dict[key];
    if (value === undefined) {
      throw new Error(`Key not found: "${key}"`);
    }
    return value;
  }

  /** Verify element contains translated text (partial match) */
  async expectText(page: Page, selector: string, key: string) {
    await expect(page.locator(selector)).toContainText(this.get(key));
  }

  /** Verify element text matches exactly */
  async expectExactText(page: Page, selector: string, key: string) {
    await expect(page.locator(selector)).toHaveText(this.get(key));
  }

  /** Verify multiple keys at once */
  async expectAll(page: Page, checks: Array<{ selector: string; key: string; exact?: boolean }>) {
    for (const { selector, key, exact } of checks) {
      if (exact) {
        await this.expectExactText(page, selector, key);
      } else {
        await this.expectText(page, selector, key);
      }
    }
  }
}
