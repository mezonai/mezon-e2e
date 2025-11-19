import { Page } from '@playwright/test';
import { generateE2eSelector } from './generateE2eSelector';
import { MessagePage } from '@/pages/MessagePage';

export class DirectMessageHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async countGroups(): Promise<number> {
    const messagePage = new MessagePage(this.page);
    let groupCount = 0;
    const listDMItems = await messagePage.getListDMItems();
    const count = await listDMItems.count();

    for (let i = 0; i < count; i++) {
      const dm = listDMItems.nth(i);
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
    const messagePage = new MessagePage(this.page);
    const listDMItems = await messagePage.getListDMItems();
    let userCount = 0;
    const count = await listDMItems.count();

    for (let i = 0; i < count; i++) {
      const dm = listDMItems.nth(i);
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
    const messagePage = new MessagePage(this.page);
    const listDMItems = await messagePage.getListDMItems();
    const { scrollStep = 400, maxScroll = 10000, waitMs = 300 } = options;
    if (name === '') {
      return false;
    }

    let scrolled = 0;

    while (scrolled < maxScroll) {
      const target = listDMItems.filter({
        has: this.page.locator(
          `${generateE2eSelector('chat.direct_message.chat_item.username')}:text-is("${name}")`
        ),
      });

      if (await target.count()) {
        const item = target.first();
        await item.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(120);
        return true;
      }

      const chatListContainer = await messagePage.getChatListContainer();
      const reachedEnd = await chatListContainer.evaluate((el, step) => {
        const before = el.scrollTop;
        el.scrollBy(0, step);
        return el.scrollTop === before || el.scrollTop + el.clientHeight >= el.scrollHeight;
      }, scrollStep);

      await this.page.waitForTimeout(waitMs);

      if (await target.count()) {
        await target.scrollIntoViewIfNeeded();
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
    const messagePage = new MessagePage(this.page);
    const listDMItems = await messagePage.getListDMItems();
    const { scrollStep = 400, maxScroll = 10000, waitMs = 300 } = options;
    if (name === '') {
      return 0;
    }

    let scrolled = 0;
    let count = 0;

    while (scrolled < maxScroll) {
      const target = listDMItems.filter({
        has: this.page.locator(`:text-is("${name}")`),
      });

      const currentCount = await target.count();
      if (currentCount > count) {
        count = currentCount;
      }

      const chatListContainer = await messagePage.getChatListContainer();
      const reachedEnd = await chatListContainer.evaluate((el, step) => {
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
