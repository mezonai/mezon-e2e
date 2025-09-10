import { Page, Locator } from '@playwright/test';
import { generateE2eSelector } from './generateE2eSelector';

export class DirectMessageHelper {
  readonly textarea: Locator;
  readonly memberList: Locator;
  readonly groupList: Locator;
  readonly groupName: Locator;
  readonly group: Locator;

  constructor(private page: Page) {
    this.textarea = page.locator(generateE2eSelector('mention.input'));
    this.memberList = page.locator(generateE2eSelector('chat.direct_message.chat_list'));
    this.groupList = page
      .locator(generateE2eSelector('chat.direct_message.chat_list'))
      .filter({ has: page.locator('p:has-text("Members")') })
      .locator(generateE2eSelector('chat.direct_message.chat_item.namegroup'));
    this.group = this.page
      .locator(generateE2eSelector('chat.direct_message.chat_list'))
      .filter({ has: this.page.locator('p', { hasText: 'Members' }) })
      .first();
    this.groupName = page.locator(generateE2eSelector('chat.direct_message.chat_item.namegroup'));
  }

  async countGroups(): Promise<number> {
    let groupCount = 0;
    const count = await this.memberList.count();

    for (let i = 0; i < count; i++) {
      const dm = this.memberList.nth(i);
      const pCount = await dm.locator('p').count();
      if (pCount > 0) {
        const text = await dm.locator('p').first().textContent();
        if (text?.includes('Members')) {
          groupCount++;
        }
      }
    }
    return groupCount;
  }

  async countUsers(): Promise<number> {
    let userCount = 0;
    const count = await this.memberList.count();

    for (let i = 0; i < count; i++) {
      const dm = this.memberList.nth(i);
      const pCount = await dm.locator('p').count();

      if (pCount === 0) {
        userCount++;
      } else {
        const text = await dm.locator('p').first().textContent();
        if (!text?.includes('Members')) {
          userCount++;
        }
      }
    }
    return userCount;
  }
}
