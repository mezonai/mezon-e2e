import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Locator, Page } from '@playwright/test';

export default class MessageActionSelector {
  private readonly items: Locator = this.page.locator(
    generateE2eSelector('chat.message_action_modal.button.base')
  );

  constructor(private readonly page: Page) {}

  readonly pin = this.items.filter({ hasText: 'Pin message' });
  readonly unpin = this.items.filter({ hasText: 'Unpin Message' });
  readonly addToInbox = this.items.filter({ hasText: 'Add To Inbox' });
  readonly markUnread = this.items.filter({ hasText: 'Mark Unread' });
  readonly topicDiscussion = this.items.filter({ hasText: 'Topic Discussion' });
  readonly copyText = this.items.filter({ hasText: 'Copy Text' });
  readonly delete = this.items.filter({ hasText: 'Delete Message' });
  readonly edit = this.items.filter({ hasText: 'Edit Message' });
  readonly forward = this.items.filter({ hasText: 'Forward Message' });
  readonly forwardAll = this.items.filter({ hasText: 'Forward All' });
  readonly createThread = this.items.filter({ hasText: 'Create Thread' });
  readonly confirmPin = this.page.locator(
    generateE2eSelector('chat.message_action_modal.confirm_modal.button.confirm'),
    { hasText: 'Oh yeah. Pin it' }
  );
  readonly confirmDelete = this.page.locator(
    generateE2eSelector('chat.message_action_modal.confirm_modal.button.confirm'),
    { hasText: 'Delete' }
  );
}
