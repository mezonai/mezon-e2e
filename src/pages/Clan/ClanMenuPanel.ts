import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class ClanMenuPanel extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  readonly buttons = {
    createCategory: this.page.locator(generateE2eSelector('clan_page.header.modal_panel.item'), {
      hasText: 'Create Category',
    }),
    private: this.page.locator(
      generateE2eSelector('clan_page.modal.create_category.toggle.private')
    ),
    cancelCreateCategory: this.page.locator(
      generateE2eSelector('clan_page.modal.create_category.button.cancel')
    ),
    confirmCreateCategory: this.page.locator(
      generateE2eSelector('clan_page.modal.create_category.button.confirm')
    ),
    showEmpty: this.page.locator(generateE2eSelector('clan_page.header.modal_panel.item'), {
      hasText: 'Show Empty Categories',
    }),
    clanSettings: this.page.locator(generateE2eSelector('clan_page.header.modal_panel.item'), {
      hasText: 'Clan Settings',
    }),
    invitePeople: this.page.locator(generateE2eSelector('clan_page.header.modal_panel.item'), {
      hasText: 'Invite People',
    }),
  };
  readonly links = {};
  readonly text = {
    clanName: this.page.locator(generateE2eSelector('clan_page.header.title.clan_name')),
    createCategory: {
      errorMessage: this.page.locator(
        generateE2eSelector('clan_page.modal.create_category.error_message')
      ),
    },
  };

  readonly input = {
    categoryName: this.page.locator(
      generateE2eSelector('clan_page.modal.create_category.input.category_name')
    ),
  };

  async createCategory(name: string): Promise<boolean> {
    await this.text.clanName.click();
    await this.buttons.showEmpty.click();
    await this.buttons.createCategory.click();
    await this.input.categoryName.waitFor({ state: 'visible', timeout: 5000 });
    await this.input.categoryName.fill(name);
    await this.buttons.confirmCreateCategory.click();
    return true;
  }

  async isCategoryPresent(categoryName: string): Promise<boolean> {
    const categoryLocator = this.page.locator(
      generateE2eSelector('clan_page.side_bar.channel_list.category'),
      { hasText: categoryName }
    );
    try {
      await categoryLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async cancelCreateCategory(name: string): Promise<boolean> {
    await this.text.clanName.click();
    await this.buttons.showEmpty.click();
    await this.buttons.createCategory.click();
    await this.input.categoryName.waitFor({ state: 'visible', timeout: 3000 });
    await this.input.categoryName.fill(name);
    await this.buttons.cancelCreateCategory.click();
    return !(await this.isCategoryPresent(name));
  }

  async openPanel(): Promise<void> {
    await this.text.clanName.click();
    await this.page.waitForTimeout(500);
  }

  async openInvitePeopleModal(): Promise<void> {
    await this.openPanel();
    await this.buttons.invitePeople.click();
    await this.page.waitForTimeout(500);
  }

  async toggleShowEmptyCategory(): Promise<void> {
    await this.openPanel();
    await this.buttons.showEmpty.click();
    await this.page.waitForTimeout(500);
  }

  async closeCreateCategoryModal(): Promise<void> {
    await this.buttons.cancelCreateCategory.click();
    await this.page.waitForTimeout(500);
  }

  async assertCreateCategoryModalVisible(): Promise<void> {
    await this.openPanel();
    await this.buttons.createCategory.click();
    await expect(this.input.categoryName).toBeVisible({ timeout: 5000 });
    await expect(this.buttons.confirmCreateCategory).toBeVisible();
    await expect(this.buttons.invitePeople).not.toBeVisible();
  }

  async assertCreateCategoryModalNotVisible(): Promise<void> {
    await expect(this.input.categoryName).not.toBeVisible({ timeout: 5000 });
  }

  async openCreateCategoryModal(): Promise<void> {
    await this.openPanel();
    await this.buttons.createCategory.click();
    await this.input.categoryName.waitFor({ state: 'visible', timeout: 5000 });
  }

  async fillCreateCategoryModal(name: string): Promise<void> {
    await this.input.categoryName.waitFor({ state: 'visible', timeout: 5000 });
    await this.input.categoryName.fill(name);
    await this.page.waitForTimeout(200);
  }

  async assertCreateCategoryErrorMessage(errorMessage: string): Promise<void> {
    await expect(this.text.createCategory.errorMessage).toBeVisible({ timeout: 5000 });
    await expect(this.text.createCategory.errorMessage).toHaveText(errorMessage);
    await expect(this.buttons.confirmCreateCategory).toBeDisabled();
  }

  async assertCreateCategoryErrorMessageDuplicateVisible(): Promise<void> {
    const duplicateErrorMessage =
      'The category name already exists in the clan. Please enter another name.';
    await this.assertCreateCategoryErrorMessage(duplicateErrorMessage);
  }

  async assertCreateCategoryErrorMessageLengthVisible(): Promise<void> {
    const lengthErrorMessage =
      'Please enter a valid category name (max 64 characters, only words, numbers, _ or -).';
    await this.assertCreateCategoryErrorMessage(lengthErrorMessage);
  }

  async assertCreateCategoryErrorMessageNotVisible(): Promise<void> {
    await expect(this.text.createCategory.errorMessage).not.toBeVisible({ timeout: 5000 });
    await expect(this.buttons.confirmCreateCategory).toBeEnabled();
  }
}
