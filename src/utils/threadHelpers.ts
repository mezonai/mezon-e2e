import { expect, Page } from '@playwright/test';
import { AllureReporter } from './allureHelpers';
import { ClanPage } from '@/pages/ClanPage';
import { ThreadStatus } from '@/types/clan-page.types';
import generateRandomString from './randomString';

export class ThreadTestHelpers {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async createAndVerifyThread(threadStatus: ThreadStatus) {
    const clanPage = new ClanPage(this.page);

    const threadName = `${threadStatus.toLowerCase()}-thread-${generateRandomString(10)}`;

    await AllureReporter.addParameter('threadName', threadName);
    await AllureReporter.addParameter('threadStatus', threadStatus);

    await AllureReporter.step(`Create new ${threadStatus} thread: ${threadName}`, async () => {
      await clanPage.createThread(threadName, threadStatus);
    });

    await AllureReporter.step('Verify thread is present in thread list', async () => {
      const isNewThreadPresent = await clanPage.isNewThreadPresent(threadName);
      expect(isNewThreadPresent).toBe(true);

      await this.page.reload();

      const isThreadStillPresent = await clanPage.isNewThreadPresent(threadName);
      expect(isThreadStillPresent).toBe(true);
    });

    await AllureReporter.attachScreenshot(
      this.page,
      `${threadStatus} Thread Created - ${threadName}`
    );
  }
}
