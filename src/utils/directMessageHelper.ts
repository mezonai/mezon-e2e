import { Locator, Page } from '@playwright/test';
import { generateE2eSelector } from './generateE2eSelector';

export class DirectMessageHelper {
  readonly textarea: Locator;
  readonly memberList: Locator;
  readonly groupList: Locator;
  readonly groupName: Locator;
  readonly group: Locator;
  readonly userNamesInDM: Locator;
  readonly chatListContainer: Locator;
  readonly chatList: Locator;

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
    this.userNamesInDM = page.locator(
      generateE2eSelector('chat.direct_message.chat_item.username')
    );
    this.chatListContainer = page.locator(
      generateE2eSelector('chat.direct_message.chat_list_container')
    );
    this.chatList = page.locator(generateE2eSelector('chat.direct_message.chat_list'));
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

  async scrollUntilVisible(
    name: string,
    options: {
      scrollStep?: number;
      maxScroll?: number;
      waitMs?: number;
    } = {}
  ): Promise<boolean> {
    const { scrollStep = 400, maxScroll = 10000, waitMs = 300 } = options;
    if (name === '') {
      return false;
    }

    let scrolled = 0;

    while (scrolled < maxScroll) {
      const target = this.chatList.filter({
        has: this.page.locator(`:text-is("${name}")`),
      });

      const reachedEnd = await this.chatListContainer.evaluate((el, step) => {
        const before = el.scrollTop;
        el.scrollBy(0, step);
        return el.scrollTop === before || el.scrollTop + el.clientHeight >= el.scrollHeight;
      }, scrollStep);

      await this.page.waitForTimeout(waitMs);
      if (await target.count()) {
        await target.first().scrollIntoViewIfNeeded();
        return true;
      }

      if (reachedEnd) {
        break;
      }

      scrolled += scrollStep;
    }

    return false;
  }

  async scrollToCountDMbyName(
    name: string,
    options: {
      scrollStep?: number;
      maxScroll?: number;
      waitMs?: number;
    } = {}
  ): Promise<number> {
    const { scrollStep = 400, maxScroll = 10000, waitMs = 300 } = options;
    if (name === '') {
      return 0;
    }

    let scrolled = 0;
    let count = 0;

    while (scrolled < maxScroll) {
      const target = this.chatList.filter({
        has: this.page.locator(`:text-is("${name}")`),
      });

      const currentCount = await target.count();
      if (currentCount > count) {
        count = currentCount;
      }

      const reachedEnd = await this.chatListContainer.evaluate((el, step) => {
        const before = el.scrollTop;
        el.scrollBy(0, step);
        return el.scrollTop === before || el.scrollTop + el.clientHeight >= el.scrollHeight;
      }, scrollStep);

      if (reachedEnd) {
        break;
      }

      scrolled += scrollStep;
      await this.page.waitForTimeout(waitMs);
    }

    return count;
  }
}
