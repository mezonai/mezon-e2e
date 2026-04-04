import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class CategorySettingSelector {
  constructor(private readonly page: Page) {
    this.page = page;
  }

  readonly buttons = {
    deleteSidebar: this.page.locator(generateE2eSelector('clan_page.settings.sidebar.delete')),
    confirmDelete: this.page.locator(
      generateE2eSelector('clan_page.settings.modal.delete_clan.confirm')
    ),
  };

  readonly input = {
    delete: this.page.locator(generateE2eSelector('clan_page.settings.modal.delete_clan.input')),
  };
}
