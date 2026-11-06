import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import CategorySettingSelector from '@/data/selectors/CategorySettingSelector';

export class CategorySettingPage extends BasePage {
  private readonly selector: CategorySettingSelector;

  constructor(page: Page) {
    super(page);
    this.selector = new CategorySettingSelector(page);
  }

  async getDeleteSidebarButton() {
    return this.selector.buttons.deleteSidebar;
  }

  async clickDeleteSidebarButton() {
    return this.selector.buttons.deleteSidebar.click();
  }

  async fillDeleteInput(clanName: string) {
    return this.selector.input.delete.fill(clanName);
  }

  async isConfirmDeleteDisabled(): Promise<boolean> {
    const classAttr = (await this.selector.buttons.confirmDelete.getAttribute('class')) || '';
    return (
      classAttr.includes('opacity-70') ||
      classAttr.includes('!cursor-default') ||
      classAttr.includes('cursor-not-allowed') ||
      (await this.selector.buttons.confirmDelete.isDisabled())
    );
  }

  async verifyConfirmDeleteButtonDisabled(): Promise<void> {
    await expect(this.selector.buttons.confirmDelete).toHaveClass(
      /opacity-70|!cursor-default|cursor-not-allowed/,
      { timeout: 5000 }
    );
  }

  async verifyConfirmDeleteButtonEnabled(): Promise<void> {
    await expect(this.selector.buttons.confirmDelete).not.toHaveClass(
      /opacity-70|!cursor-default/,
      { timeout: 5000 }
    );
  }

  async getConfirmDeleteButton() {
    return this.selector.buttons.confirmDelete;
  }

  async clickConfirmDeleteButton() {
    return this.selector.buttons.confirmDelete.click();
  }

  async clickCancelDeleteButton() {
    return this.selector.buttons.cancelDelete.click();
  }
}
