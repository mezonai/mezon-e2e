import { BaseComponent } from './BaseComponent';

/**
 * Input Component
 * Handles all input field interactions across the application
 */
export class InputComponent extends BaseComponent {
  /**
   * Fill input field by selector
   */
  async fillBySelector(selector: string, text: string): Promise<void> {
    await this.fillInput(selector, text);
  }

  /**
   * Fill input field by placeholder
   */
  async fillByPlaceholder(placeholder: string, text: string): Promise<void> {
    const selector = `input[placeholder="${placeholder}"], textarea[placeholder="${placeholder}"]`;
    await this.fillInput(selector, text);
  }

  /**
   * Fill input field by label
   */
  async fillByLabel(label: string, text: string): Promise<void> {
    const selector = `input[id]:has(+ label:has-text("${label}")), input[aria-label="${label}"]`;
    await this.fillInput(selector, text);
  }

  /**
   * Fill input field by name attribute
   */
  async fillByName(name: string, text: string): Promise<void> {
    const selector = `input[name="${name}"], textarea[name="${name}"]`;
    await this.fillInput(selector, text);
  }

  /**
   * Clear input field
   */
  async clear(selector: string): Promise<void> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
  }

  /**
   * Get input value
   */
  async getValue(selector: string): Promise<string> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible' });
    return await locator.inputValue();
  }

  /**
   * Upload file
   */
  async uploadFile(selector: string, filePath: string): Promise<void> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible' });
    await locator.setInputFiles(filePath);
  }

  /**
   * Press key in input field
   */
  async pressKey(selector: string, key: string): Promise<void> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible' });
    await locator.press(key);
  }

  /**
   * Type text with delay
   */
  async typeSlowly(selector: string, text: string, delay: number = 100): Promise<void> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible' });
    await locator.type(text, { delay });
  }
}
