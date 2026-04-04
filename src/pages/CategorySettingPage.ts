import { Page } from '@playwright/test';
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

  async clickConfirmDeleteButton() {
    return this.selector.buttons.confirmDelete.click();
  }
}
