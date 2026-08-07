import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class MessageInboxSelector {
  constructor(private readonly page: Page) {}

  private readonly actionTabs = this.page.locator(
    generateE2eSelector('chat.channel_message.inbox.action_tabs')
  );

  readonly topics = {
    item: {
      container: this.page.locator(generateE2eSelector('chat.channel_message.inbox.topics')),
      initMessage: this.page.locator(
        generateE2eSelector('chat.channel_message.inbox.topics.init_message')
      ),
      lastReplyMessage: this.page.locator(
        generateE2eSelector('chat.channel_message.inbox.topics.last_reply_message')
      ),
      buttonJump: this.page.locator(
        generateE2eSelector('chat.channel_message.inbox.topics.button.jump')
      ),
    },
    triggerTab: this.actionTabs.filter({ hasText: 'Topics' }),
  };

  readonly messages = {
    triggerTab: this.actionTabs.filter({ hasText: 'Messages' }),
  };

  readonly forYou = {
    triggerTab: this.actionTabs.filter({ hasText: 'For You' }),
    item: {
      button: {
        remove: this.page.locator(
          generateE2eSelector('chat.channel_message.inbox.for_you.button.remove')
        ),
        jump: this.page.locator(
          generateE2eSelector('chat.channel_message.inbox.for_you.button.jump')
        ),
      },
      container: this.page.locator(generateE2eSelector('chat.channel_message.inbox.for_you')),
      username: this.page.locator(
        generateE2eSelector('chat.channel_message.inbox.for_you.username')
      ),
      message: this.page.locator(generateE2eSelector('chat.channel_message.inbox.for_you.message')),
      timestamp: this.page.locator(
        generateE2eSelector('chat.channel_message.inbox.for_you.timestamp')
      ),
    },
  };
}
