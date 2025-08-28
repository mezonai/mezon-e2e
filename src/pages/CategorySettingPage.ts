import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { generateE2eSelector } from "@/utils/generateE2eSelector";

export class CategorySettingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

   readonly buttons = {
    deleteSidebar: this.page.locator(generateE2eSelector('clan_page.settings.sidebar.delete')),
    confirmDelete: this.page.locator(generateE2eSelector('clan_page.settings.modal.delete_clan.confirm')),
  };

   readonly input = {
    delete: this.page.locator(generateE2eSelector('clan_page.settings.modal.delete_clan.input')),
  };
}
