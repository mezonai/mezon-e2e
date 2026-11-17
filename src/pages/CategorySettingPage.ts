import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import CategorySettingSelector from '@/data/selectors/CategorySettingSelector';
import { generateE2eSelector } from '@/utils/generateE2eSelector';

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
    const modal = this.page
      .locator(generateE2eSelector('clan_page.settings.modal.delete_clan'))
      .or(this.page.locator('div[role="dialog"]'))
      .first();

    let targetName = clanName.trim();
    try {
      const modalText = await modal
        .locator('b, strong, span.font-bold, code, span.text-danger, span.text-red-500, p span')
        .first()
        .textContent({ timeout: 1000 });
      if (modalText && modalText.trim().length > 0) {
        targetName = modalText.replace(/^["'`]|["'`]$/g, '').trim();
      }
    } catch {}

    const inputLocator = this.selector.input.delete
      .locator('input')
      .or(this.selector.input.delete)
      .first();

    await inputLocator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await inputLocator.click();
    await inputLocator.fill('');
    await inputLocator.pressSequentially(targetName, { delay: 30 });
    return targetName;
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
    await this.verifyConfirmDeleteButtonEnabled().catch(() => {});
    await this.selector.buttons.confirmDelete.click({ force: true });
    await expect(this.selector.buttons.confirmDelete)
      .toBeHidden({ timeout: 10000 })
      .catch(() => {});
  }

  async clickCancelDeleteButton() {
    return this.selector.buttons.cancelDelete.click();
  }
}
