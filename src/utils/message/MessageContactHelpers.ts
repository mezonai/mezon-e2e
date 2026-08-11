import { FriendPage } from '@/pages/FriendPage';
import { expect, Page } from '@playwright/test';
import { generateE2eSelector } from '../generateE2eSelector';
import { MessageInboxHelpers } from './MessageInboxHelpers';

export class MessageContactHelpers extends MessageInboxHelpers {
  constructor(page: Page) {
    super(page);
  }

  async verifyShareContactModalVisible() {
    await expect(this.selector.contacts.modal.item).toBeVisible({ timeout: 3000 });
  }

  async shareContactInDMOrChannel(destination: string, shouldVisible = true, clanName?: string) {
    const searchInput = this.selector.contacts.modal.inputSearch;
    await expect(searchInput).toBeVisible({ timeout: 3000 });
    await searchInput.fill(destination);

    let destinationItem = this.selector.contacts.modal.item
      .locator(generateE2eSelector('suggest_item'))
      .filter({ hasText: destination });

    if (clanName) {
      destinationItem = destinationItem.filter({
        has: this.page.locator(generateE2eSelector('suggest_item.clan_name'), {
          hasText: clanName,
        }),
      });
    }

    if (!shouldVisible) {
      await expect(destinationItem).toHaveCount(0);
      return;
    }

    await expect(destinationItem.first()).toBeVisible({ timeout: 5000 });
    await destinationItem.first().click();
    await this.selector.contacts.modal.buttonShare.click();
  }

  async verifyContactSharedInDMOrChannel(username: string) {
    const contactCard = this.selector.messages.last().locator(this.selector.contacts.card);
    await expect(contactCard).toBeVisible({ timeout: 10000 });
    await expect(contactCard.locator(this.selector.contacts.username)).toHaveText(username, {
      timeout: 3000,
    });
  }

  async verifyCallItemVisibleInShareContactCard(username: string, shouldVisible = true) {
    const contactCard = this.selector.messages.last().locator(this.selector.contacts.card);
    await expect(contactCard).toBeVisible({ timeout: 3000 });
    await expect(contactCard.locator(this.selector.contacts.username)).toHaveText(username, {
      timeout: 3000,
    });
    await contactCard.locator(this.selector.contacts.buttonCall).click();

    if (shouldVisible) {
      await expect.poll(() => this.page.url()).toContain('chat/direct/message');
      return;
    }

    await new FriendPage(this.page).verifyReceivedRequestToast('You cannot call yourself.');
  }

  async clickMessageOnShareContactCard() {
    const contactCard = this.selector.messages.last().locator(this.selector.contacts.card);
    await expect(contactCard).toBeVisible({ timeout: 3000 });
    const messageButton = contactCard.locator(this.selector.contacts.buttonMessage);
    await expect(messageButton).toBeVisible({ timeout: 3000 });
    await messageButton.click();
    await expect.poll(() => this.page.url()).toContain('chat/direct/message');
  }
}
