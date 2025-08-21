import { BaseComponent } from './BaseComponent';

/**
 * Dropdown Component
 * Handles all dropdown/select interactions across the application
 */
export class DropdownComponent extends BaseComponent {
  /**
   * Select option by value
   */
  async selectByValue(selector: string, value: string): Promise<void> {
    await this.selectOption(selector, value);
  }

  /**
   * Select option by visible text
   */
  async selectByText(selector: string, text: string): Promise<void> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible' });
    await locator.selectOption({ label: text });
  }

  /**
   * Select option by index (0-based)
   */
  async selectByIndex(selector: string, index: number): Promise<void> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible' });
    await locator.selectOption({ index });
  }

  /**
   * Get selected option text
   */
  async getSelectedText(selector: string): Promise<string> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible' });
    return await locator.innerText();
  }

  /**
   * Get selected option value
   */
  async getSelectedValue(selector: string): Promise<string> {
    const locator = this.getLocator(selector);
    await locator.waitFor({ state: 'visible' });
    return await locator.inputValue();
  }

  /**
   * Get all options text
   */
  async getAllOptionsText(selector: string): Promise<string[]> {
    const locator = this.getLocator(`${selector} option`);
    await this.waitForVisible(selector);
    return await locator.allInnerTexts();
  }

  /**
   * Check if option exists
   */
  async hasOption(selector: string, optionText: string): Promise<boolean> {
    const options = await this.getAllOptionsText(selector);
    return options.includes(optionText);
  }

  /**
   * Open dropdown (for custom dropdowns)
   */
  async openDropdown(selector: string): Promise<void> {
    await this.clickElement(selector);
  }

  /**
   * Select from custom dropdown by clicking option
   */
  async selectFromCustomDropdown(dropdownSelector: string, optionText: string): Promise<void> {
    await this.openDropdown(dropdownSelector);
    const optionSelector = `li:has-text("${optionText}"), div:has-text("${optionText}"), span:has-text("${optionText}")`;
    await this.clickElement(optionSelector);
  }
}
