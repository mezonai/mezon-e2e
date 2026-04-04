import { BasePage } from '@/pages/BasePage';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export class ForwardMessageModal extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  readonly forward = {
    item: this.page.locator(generateE2eSelector('suggest_item.username')),
  };

  async findUserInList(userName: string) {
    return this.forward.item.filter({
      hasText: userName,
    });
  }

  async isUserShownInList(userName: string): Promise<boolean> {
    const userItem = await this.findUserInList(userName);
    const count = await userItem.count();
    return count > 0;
  }
}
