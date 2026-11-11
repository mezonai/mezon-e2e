import { expect, Locator, Page } from '@playwright/test';
import { generateE2eSelector } from '../generateE2eSelector';
import { MessageMediaHelpers } from './MessageMediaHelpers';

const MESSAGE_ITEM_SELECTOR = generateE2eSelector('message.item');

export class MessageInboxHelpers extends MessageMediaHelpers {
  constructor(page: Page) {
    super(page);
  }

  async openHeaderInboxButton() {
    const tooltip = this.page.locator(
      '.rc-tooltip:not(.rc-tooltip-hidden), [data-e2e*="inbox"][class*="popover"], div:has(> [data-e2e*="inbox.action_tabs"])'
    );
    if (
      await tooltip
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return;
    }
    const inboxButton = this.page
      .locator('button[data-e2e="chat-channel_message-header-button-inbox"]')
      .last()
      .or(this.selector.headerInboxButton.last());

    try {
      await expect(inboxButton).toBeVisible({ timeout: 3000 });
    } catch {
      const channelLocator = this.page
        .locator(generateE2eSelector('clan_page.channel_list.item.name'))
        .filter({ hasText: 'general' })
        .first();
      try {
        await expect(channelLocator).toBeVisible({ timeout: 5000 });
        await channelLocator.click();
      } catch {
        const firstChannel = this.page
          .locator(generateE2eSelector('clan_page.channel_list.item.name'))
          .first();
        await expect(firstChannel).toBeVisible({ timeout: 5000 });
        await firstChannel.click();
      }
      await this.page.waitForTimeout(1000);
      await expect(inboxButton).toBeVisible({ timeout: 10000 });
    }

    await inboxButton.click();
    await this.page.waitForTimeout(500);
  }

  async openChatBox() {
    const chatInput = this.page
      .locator('[data-e2e="mention-input"], textarea, input[placeholder*="thoughts"]')
      .first();
    if (await chatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      return;
    }
    const chatButton = this.selector.headerChatButton.first();
    await expect(chatButton).toBeVisible({ timeout: 10000 });
    await chatButton.click({ force: true });
    await expect(chatInput)
      .toBeVisible({ timeout: 10000 })
      .catch(() => {});
  }

  async openMessageTabInInbox() {
    await expect(this.selector.inbox.messages.triggerTab).toBeVisible({ timeout: 5000 });
    await this.selector.inbox.messages.triggerTab.click();
  }

  async openForYouTabInInbox() {
    await expect(this.selector.inbox.forYou.triggerTab).toBeVisible({ timeout: 5000 });
    await this.selector.inbox.forYou.triggerTab.click();
  }

  async verifyFirstForYouMessage(username: string, message: string) {
    const firstItem = this.selector.inbox.forYou.item.container.first();
    const firstUsername = firstItem.locator(
      generateE2eSelector('chat.channel_message.inbox.for_you.username')
    );
    const firstMessage = firstItem.locator(
      generateE2eSelector('chat.channel_message.inbox.for_you.message')
    );
    const firstTimestamp = firstItem.locator(
      generateE2eSelector('chat.channel_message.inbox.for_you.timestamp')
    );

    await expect(firstItem).toBeVisible({ timeout: 5000 });
    await expect(firstUsername).toHaveText(username);
    await expect(firstMessage).toHaveText(message);
    await expect(firstTimestamp).toHaveText(/^Today at \d{2}:\d{2}$/);
  }

  async removeFirstForYouMessage() {
    const items = this.selector.inbox.forYou.item.container;
    const firstItem = items.first();

    await expect(firstItem).toBeVisible({ timeout: 5000 });
    await firstItem.hover();
    await this.selector.inbox.forYou.item.button.remove.first().click();
  }

  async assertMessageInInboxByContent(messageContent: string) {
    const msgTab = this.selector.inbox.messages.triggerTab.first();
    if (await msgTab.isVisible().catch(() => false)) {
      await msgTab.click().catch(() => {});
    }
    const inboxMessage = this.selector.inboxMessages.filter({ hasText: messageContent }).first();
    await expect(inboxMessage).toBeVisible({ timeout: 10000 });
  }

  async jumpToMentionMessageFromInbox(messageContent: string) {
    const mentionItem = this.selector.inboxMessages.filter({ hasText: messageContent }).first();

    await expect(mentionItem).toBeVisible({ timeout: 5000 });
    const itemContainer = this.page
      .locator(generateE2eSelector('chat.channel_message.inbox.mentions'))
      .filter({ hasText: messageContent })
      .first();
    if (await itemContainer.isVisible().catch(() => false)) {
      await itemContainer.hover();
    } else {
      await mentionItem.hover({ force: true });
    }

    const jumpButton = this.selector.inbox.forYou.item.button.jump.first();
    await expect(jumpButton).toBeVisible({ timeout: 5000 });
    await jumpButton.click();

    const originalMessage = this.page
      .locator(MESSAGE_ITEM_SELECTOR)
      .filter({ hasText: messageContent })
      .last();
    await expect(originalMessage).toBeVisible({ timeout: 10000 });
  }

  async openTopicTabOnInboxPopover() {
    return this.selector.inbox.topics.triggerTab.click();
  }

  async verifyCreatedTopicOnInboxPopover(initMessage: string): Promise<Locator> {
    const { container, initMessage: initMessageLocator } = this.selector.inbox.topics.item;
    await expect(initMessageLocator.first()).toContainText(initMessage);
    return container.first();
  }

  async clickJumpToTopicFromInboxPopover(topicLocator: Locator) {
    await topicLocator.hover();
    await topicLocator.locator(this.selector.inbox.topics.item.buttonJump).click();
  }

  async verifyCreatedTopicIsOpen(initMessage: string, lastReply: string) {
    await expect(this.selector.topicBox).toBeVisible({ timeout: 3000 });
    await expect(this.selector.topicMessages.first()).toContainText(initMessage);
    await expect(this.selector.topicMessages.last()).toContainText(lastReply);
  }
}
