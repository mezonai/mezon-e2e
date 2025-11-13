import MessageSelector from '@/data/selectors/MessageSelector';
import { Page } from '@playwright/test';
import { generateE2eSelector } from './generateE2eSelector';

export class DirectMessageHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async countGroups(): Promise<number> {
    const selector = new MessageSelector(this.page);
    let groupCount = 0;
    const count = await selector.listDMItems.count();

    for (let i = 0; i < count; i++) {
      const dm = selector.listDMItems.nth(i);
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
    const selector = new MessageSelector(this.page);
    let userCount = 0;
    const count = await selector.listDMItems.count();

    for (let i = 0; i < count; i++) {
      const dm = selector.listDMItems.nth(i);
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
    const selector = new MessageSelector(this.page);
    const { scrollStep = 400, maxScroll = 10000, waitMs = 300 } = options;
    if (name === '') {
      return false;
    }

    let scrolled = 0;

    while (scrolled < maxScroll) {
      const target = selector.listDMItems.filter({
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

      const reachedEnd = await selector.chatListContainer.evaluate((el, step) => {
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
    const selector = new MessageSelector(this.page);
    const { scrollStep = 400, maxScroll = 10000, waitMs = 300 } = options;
    if (name === '') {
      return 0;
    }

    let scrolled = 0;
    let count = 0;

    while (scrolled < maxScroll) {
      const target = selector.listDMItems.filter({
        has: selector.page.locator(`:text-is("${name}")`),
      });

      const currentCount = await target.count();
      if (currentCount > count) {
        count = currentCount;
      }

      const reachedEnd = await selector.chatListContainer.evaluate((el, step) => {
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
