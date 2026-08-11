import { expect, Page } from '@playwright/test';
import { generateE2eSelector } from '../generateE2eSelector';
import { MessageContactHelpers } from './MessageContactHelpers';

const MESSAGE_ITEM_SELECTOR = generateE2eSelector('message.item');

export class MessageTopicHelpers extends MessageContactHelpers {
  constructor(page: Page) {
    super(page);
  }

  getTopicMessageItemByText(messageText: string) {
    return this.page.locator(
      `${generateE2eSelector('discussion.box.topic')} ${MESSAGE_ITEM_SELECTOR}:has-text("${messageText}")`
    );
  }

  getDisplayNameInTopicByMessageText(messageText: string) {
    return this.getTopicMessageItemByText(messageText).locator(
      generateE2eSelector('base_profile.display_name')
    );
  }

  async createTopicToInitMessage(message: string) {
    const topicMessage = `Topic message - ${Date.now()}`;
    const messageItem = this.page.locator(MESSAGE_ITEM_SELECTOR).filter({ hasText: message });
    await expect(messageItem).toBeVisible({ timeout: 3000 });

    await messageItem.click({ button: 'right' });
    await expect(this.selector.topicDiscussionMessageButton).toBeVisible({ timeout: 2000 });
    await this.selector.topicDiscussionMessageButton.click();
    await expect(this.selector.topicInput).toBeVisible({ timeout: 2000 });

    await this.selector.topicInput.fill(topicMessage);
    await this.selector.topicInput.press('Enter');
    await expect(this.selector.topicMessages.filter({ hasText: topicMessage })).toBeVisible({
      timeout: 5000,
    });
    await this.page.reload();
  }

  async verifyNameOnInitTopicMessageIsMatchWithClanSetting(name: string, messageText: string) {
    const channelDisplayName = this.selector.displayNameOnMessageChannel.last();
    await expect(channelDisplayName).toBeVisible({ timeout: 3000 });
    await expect(channelDisplayName).toHaveText(name);

    const viewTopicButton = this.selector.viewTopicButton.last();
    await expect(viewTopicButton).toBeVisible({ timeout: 3000 });
    await viewTopicButton.click();
    await expect(this.selector.topicInput).toBeVisible({ timeout: 2000 });
    await expect(this.getDisplayNameInTopicByMessageText(messageText)).toHaveText(name);

    await this.selector.closeTopicBoxButton.click();
    await expect(this.selector.topicInput).toBeHidden({ timeout: 2000 });
  }

  async openTopicBoxByMessage(message: string) {
    const messageItem = this.page.locator(MESSAGE_ITEM_SELECTOR).filter({ hasText: message });
    await expect(messageItem).toBeVisible({ timeout: 5000 });

    const viewTopicButton = messageItem.locator(
      generateE2eSelector('chat.topic.button.view_topic')
    );
    await expect(viewTopicButton).toBeVisible({ timeout: 2000 });
    await viewTopicButton.click();
    await this.page.waitForTimeout(1000);
  }

  async closeTopicBox() {
    await expect(this.selector.closeTopicBoxButton).toBeVisible({ timeout: 5000 });
    await this.selector.closeTopicBoxButton.click();
    await expect(this.selector.topicInput).toBeHidden({ timeout: 5000 });
  }

  async sendMessageInTopicBox(topicMessage: string) {
    await expect(this.selector.topicInput).toBeVisible({ timeout: 2000 });
    await this.selector.topicInput.fill(topicMessage);
    await this.selector.topicInput.press('Enter');
    await expect(this.selector.topicMessages.filter({ hasText: topicMessage })).toBeVisible({
      timeout: 5000,
    });
  }

  async getTotalTopicMessages(message: string): Promise<number> {
    const messageItem = this.page.locator(MESSAGE_ITEM_SELECTOR).filter({ hasText: message });
    await expect(messageItem).toBeVisible({ timeout: 5000 });
    const replyCount = messageItem.locator(generateE2eSelector('chat.topic.number_replies'));
    await expect(replyCount).toBeVisible({ timeout: 2000 });
    return Number((await replyCount.innerText()).replace(/\D+/g, ''));
  }
}
