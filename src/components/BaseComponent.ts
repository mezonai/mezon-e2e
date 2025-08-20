import { type Page, type Locator } from '@playwright/test';

/**
 * Base Component Class
 * Contains common methods for all UI components
 * Follows component composition pattern
 */
export abstract class BaseComponent {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get locator for element
   */
  protected getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Click element with wait
   */
  protected async clickElement(selector: string, timeout: number = 10000): Promise<void> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    await locator.click();
  }

  /**
   * Fill input field
   */
  protected async fillInput(selector: string, text: string, timeout: number = 10000): Promise<void> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    await locator.clear();
    await locator.fill(text);
  }

  /**
   * Get text from element
   */
  protected async getElementText(selector: string, timeout: number = 10000): Promise<string> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    return await locator.innerText();
  }

  /**
   * Check if element is visible
   */
  protected async isVisible(selector: string): Promise<boolean> {
    try {
      const locator = this.getLocator(selector);
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for element to be visible
   */
  protected async waitForVisible(selector: string, timeout: number = 10000): Promise<void> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Select option from dropdown
   */
  protected async selectOption(selector: string, option: string): Promise<void> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible' });
    await locator.selectOption(option);
  }

  /**
   * Check/uncheck checkbox
   */
  protected async setCheckbox(selector: string, checked: boolean): Promise<void> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible' });
    
    const isCurrentlyChecked = await locator.isChecked();
    if (isCurrentlyChecked !== checked) {
      await locator.click();
    }
  }
}