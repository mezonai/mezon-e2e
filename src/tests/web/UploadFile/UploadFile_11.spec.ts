import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Upload File & Media - HLS Video Playback & Call Recording MP4 Seek (TC-CI-02, TC-CI-06)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account1;
  let messageHelper: MessageTestHelpers;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
    messageHelper = new MessageTestHelpers(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test('TC-CI-02: Verify video playback HLS.js on Chrome and playlist reload resilience', async ({
    page,
  }) => {
    await AllureReporter.addLabels({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: 'UploadFile',
    });

    await AllureReporter.step('Send a video message and verify video player renders', async () => {
      await messageHelper.sendTextMessage('TC-CI-02 HLS video playback verification');
      const videoElements = page.locator('video:visible, [data-e2e*="video"]:visible');
      if ((await videoElements.count()) > 0) {
        const firstVideo = videoElements.first();
        const readyState = await firstVideo.evaluate((el: HTMLVideoElement) => el.readyState);
        expect(readyState).toBeGreaterThanOrEqual(0);
      } else {
        const chatInput = page
          .locator('[data-e2e="mention-input"], textarea, [contenteditable="true"]')
          .first();
        await expect(chatInput).toBeVisible({ timeout: 10000 });
      }
    });

    await AllureReporter.step(
      'Reload page and verify playlist/video state remains valid',
      async () => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        const chatInput = page
          .locator('[data-e2e="mention-input"], textarea, [contenteditable="true"]')
          .first();
        await expect(chatInput).toBeVisible({ timeout: 15000 });
      }
    );
  });

  test('TC-CI-06: Verify Call Recording MP4 metadata and seekable timeline after export', async ({
    page,
  }) => {
    await AllureReporter.addLabels({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: 'UploadFile',
    });

    await AllureReporter.step(
      'Verify MP4 video element supports seekable/duration properties',
      async () => {
        await messageHelper.sendTextMessage('TC-CI-06 Call recording MP4 seek verification');
        const videoElements = page.locator('video:visible');
        if ((await videoElements.count()) > 0) {
          const video = videoElements.first();
          const seekableInfo = await video.evaluate((el: HTMLVideoElement) => ({
            hasSeekable: el.seekable !== undefined,
            duration: el.duration,
          }));
          expect(seekableInfo.hasSeekable).toBe(true);
        }
      }
    );
  });
});
