import { BasePage } from '@/pages/BasePage';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export class ClanInviteModal extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  readonly button = {
    acceptInvite: this.page.locator(generateE2eSelector('acceptModal.button.acceptInvite')),
  };

  async acceptInvite(): Promise<void> {
    await this.button.acceptInvite.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
