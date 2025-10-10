import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CategoryPage extends BasePage {
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
  };
  readonly links = {};
  readonly text = {
    clanName: this.page.locator(generateE2eSelector('clan_page.header.title.clan_name')),
  };

  readonly input = {
    categoryName: this.page.locator(
      generateE2eSelector('clan_page.modal.create_category.input.category_name')
    ),
  };

  /* Only Support public category */
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
      // Ignore errors
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
}
