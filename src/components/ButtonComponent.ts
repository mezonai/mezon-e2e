import { BaseComponent } from './BaseComponent';

/**
 * Button Component
 * Handles all button interactions across the application
 */
export class ButtonComponent extends BaseComponent {
  /**
   * Click button by text
   */
  async clickByText(buttonText: string): Promise<void> {
    const selector = `button:has-text("${buttonText}"), input[type="submit"][value="${buttonText}"], a:has-text("${buttonText}")`;
    await this.clickElement(selector);
  }

  /**
   * Click button by selector
   */
  async clickBySelector(selector: string): Promise<void> {
    await this.clickElement(selector);
  }

  /**
   * Click submit button
   */
  async clickSubmit(): Promise<void> {
    const selector = 'button[type="submit"], input[type="submit"]';
    await this.clickElement(selector);
  }

  /**
   * Check if button is enabled
   */
  async isEnabled(selector: string): Promise<boolean> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible' });
    return await locator.isEnabled();
  }

  /**
   * Check if button is disabled
   */
  async isDisabled(selector: string): Promise<boolean> {
    const enabled = await this.isEnabled(selector);
    return !enabled;
  }

  /**
   * Hover over button
   */
  async hover(selector: string): Promise<void> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible' });
    await locator.hover();
  }
}