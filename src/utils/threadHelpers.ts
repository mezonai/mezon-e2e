import ChannelSettingSelector from '@/data/selectors/ChannelSettingSelector';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ThreadStatus } from '@/types/clan-page.types';
import { expect, Page } from '@playwright/test';
import { AllureReporter } from './allureHelpers';
import { generateE2eSelector } from './generateE2eSelector';
import generateRandomString from './randomString';

export class ThreadTestHelpers {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async createAndVerifyThread(threadStatus: ThreadStatus, threadName?: string) {
    const clanPage = new ClanPage(this.page);

    const actualThreadName =
      threadName || `${threadStatus.toLowerCase()}-thread-${generateRandomString(10)}`;

    await AllureReporter.addParameter('threadName', actualThreadName);
    await AllureReporter.addParameter('threadStatus', threadStatus);

    await AllureReporter.step(
      `Create new ${threadStatus} thread: ${actualThreadName}`,
      async () => {
        await clanPage.createThread(actualThreadName, threadStatus);
      }
    );

    await AllureReporter.step('Verify thread is present in thread list', async () => {
      const isNewThreadPresent = await clanPage.isNewThreadPresent(actualThreadName);
      expect(isNewThreadPresent).toBe(true);

      await clanPage.openThreadByName(actualThreadName);
      await this.page.reload();

      const isThreadStillPresent = await clanPage.isNewThreadPresent(actualThreadName);
      expect(isThreadStillPresent).toBe(true);
    });

    await AllureReporter.attachScreenshot(
      this.page,
      `${threadStatus} Thread Created - ${actualThreadName}`
    );
  }

  async deleteThread(threadName: string) {
    const selector = new ChannelSettingSelector(this.page);
    const threadItemSelector = selector.sidebar.threadItem.name
      .filter({ hasText: threadName })
      .first();
    await threadItemSelector.click({ button: 'right' });
    const deleteButtonSelector = selector.sidebar.panelItem.item
      .filter({ hasText: 'Delete Thread' })
      .first();
    await deleteButtonSelector.click();

    const confirmButton = this.page.locator(
      generateE2eSelector('modal.confirm_modal.button.confirm')
    );
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();
  }

  async verifyThreadDeletion(threadName: string) {
    const clanPage = new ClanPage(this.page);
    await this.page.waitForTimeout(1000);
    const isThreadPresent = await clanPage.isNewThreadPresent(threadName);
    expect(isThreadPresent).toBe(false);
  }
}
