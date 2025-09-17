import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { generateE2eSelector } from '@/utils/generateE2eSelector';

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

  readonly categoryItem = {
    item: this.page.locator(generateE2eSelector('clan_page.side_bar.channel_list.category')),
    itemName: this.page.locator(
      generateE2eSelector('clan_page.side_bar.channel_list.category.name')
    ),
    addChannel: this.page.locator(generateE2eSelector('clan_page.side_bar.button.add_channel')),
  };

  readonly panelCategory = {
    edit: this.page.locator(
      `${generateE2eSelector('clan_page.side_bar.panel.category_panel')} ${generateE2eSelector('panel.panel_item')}`,
      { hasText: 'Edit Category' }
    ),
    delete: this.page.locator(
      `${generateE2eSelector('clan_page.side_bar.panel.category_panel')} ${generateE2eSelector('panel.panel_item')}`,
      { hasText: 'Delete Category' }
    ),
  };

  readonly modal = {
    deleteCategory: {
      button: {
        confirm: this.page.locator(generateE2eSelector('modal.confirm_modal.button.confirm'), {
          hasText: 'Delete Category',
        }),
        cancel: this.page.locator(generateE2eSelector('modal.confirm_modal.button.cancel')),
      },
    },
    editCategory: {
      button: {
        delete: this.page.locator(
          generateE2eSelector('clan_page.modal.delete_category.button.delete')
        ),
      },
    },
  };

  async createCategory(name: string, type: 'private' | 'public'): Promise<boolean> {
    await this.text.clanName.click();

    await this.buttons.showEmpty.click();

    await this.buttons.createCategory.click();

    await this.input.categoryName.waitFor({ state: 'visible', timeout: 5000 });
    await this.input.categoryName.fill(name);

    if (type === 'private') {
      await this.buttons.private.click();
    }

    await this.buttons.confirmCreateCategory.click();

    return true;
  }

  async isCategoryPresent(categoryName: string): Promise<boolean> {
    const categoryLocator = this.page.locator(
      generateE2eSelector('clan_page.side_bar.channel_list.category.name'),
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

  async deleteCategory(categoryName: string): Promise<boolean> {
    const categoryItem = this.categoryItem.itemName.filter({ hasText: categoryName });
    await categoryItem.click({ button: 'right' });
    await this.panelCategory.edit.click();
    await this.modal.editCategory.button.delete.click();
    await this.modal.deleteCategory.button.confirm.click();
    return true;
  }

  async isCategoryDeleted(categoryName: string): Promise<boolean> {
    const categoryLocator = this.categoryItem.itemName.filter({
      hasText: categoryName,
    });

    try {
      await categoryLocator.waitFor({ state: 'hidden', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
