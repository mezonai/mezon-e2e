import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class MessageContactSelector {
  constructor(private readonly page: Page) {}

  readonly card = this.page.locator(generateE2eSelector('chat.share_contact'));
  readonly displayName = this.page.locator(generateE2eSelector('chat.share_contact.display_name'));
  readonly username = this.page.locator(generateE2eSelector('chat.share_contact.username'));
  readonly buttonCall = this.page.locator(generateE2eSelector('chat.share_contact.button.call'));
  readonly buttonMessage = this.page.locator(
    generateE2eSelector('chat.share_contact.button.message')
  );

  readonly modal = {
    item: this.page.locator(generateE2eSelector('modal.share_contact')),
    inputSearch: this.page.locator(generateE2eSelector('modal.share_contact.input.search')),
    buttonCancel: this.page.locator(generateE2eSelector('modal.share_contact.button.cancel')),
    buttonShare: this.page.locator(generateE2eSelector('modal.share_contact.button.share')),
  };
}
