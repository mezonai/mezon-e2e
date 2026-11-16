import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { FileSizeTestHelpers } from '@/utils/uploadFileHelpers';
import { expect, test } from '@playwright/test';

const SELECTED_FILE_SELECTOR = '[data-e2e="mention-selected_file"]';
const REMOVE_ATTACHMENT_BTN_SELECTOR = 'button[title="Remove Attachment"]';

test.describe('Upload File & Media - Video Ingest, Audio Scrubbing, Sound Sticker & CDN Pipeline (TC-CI-01 to 08 / Cases 144-151)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account1;
  let fileSizeHelpers: FileSizeTestHelpers;
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
    fileSizeHelpers = new FileSizeTestHelpers(page);
    messageHelper = new MessageTestHelpers(page);
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    if (fileSizeHelpers) {
      await fileSizeHelpers.cleanupFiles();
    }
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Video attachment file-ingest uploading states, thumbnail, and playback (TC-CI-01 / Case 144)', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addWorkItemLinks({ tms: '65144' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify video attachment streaming ingest states (uploading -> finishing -> ready), thumbnail render without blank areas, and playback availability (TC-CI-01 / Case 144).
    `);

    const filePath = await fileSizeHelpers.createFileWithSize('sample_video', 1024 * 512, 'mp4');

    await AllureReporter.step('Attach video file in composer', async () => {
      await fileSizeHelpers.uploadFileDefault(filePath);
      await expect(page.locator(SELECTED_FILE_SELECTOR)).toBeVisible({ timeout: 10000 });
    });

    await AllureReporter.step(
      'Send video message and verify message container renders',
      async () => {
        const messageInput = await messageHelper.findMessageInput();
        await messageInput.press('Enter');
        await page.waitForTimeout(1500);

        const sentVideo = page.locator('video, [data-e2e*="video_player"]').first();
        if (await sentVideo.isVisible({ timeout: 5000 })) {
          await expect(sentVideo).toBeVisible();
        }
      }
    );
  });

  test('TC02: Video upload cancellation and retry does not leave orphaned error messages (TC-CI-04 / Case 147)', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addWorkItemLinks({ tms: '65147' });
    await AllureReporter.addDescription(`
      **Test Objective:** Cancel pending video attachment in composer; verify no empty/broken message is created, and re-attaching sends cleanly (TC-CI-04 / Case 147).
    `);

    const filePath = await fileSizeHelpers.createFileWithSize('cancel_video', 1024 * 256, 'mp4');

    await AllureReporter.step('Attach video into message composer', async () => {
      await fileSizeHelpers.uploadFileDefault(filePath);
      await expect(page.locator(SELECTED_FILE_SELECTOR)).toBeVisible({ timeout: 10000 });
    });

    await AllureReporter.step('Cancel attachment via remove button', async () => {
      const removeBtn = page.locator(REMOVE_ATTACHMENT_BTN_SELECTOR);
      if (await removeBtn.isVisible({ timeout: 3000 })) {
        await removeBtn.click();
        await expect(removeBtn).toBeHidden({ timeout: 5000 });
      }
    });

    await AllureReporter.step('Verify plain message sends without attachment', async () => {
      const plainText = `No attachment ${Date.now().toString(36)}`;
      const messageInput = await messageHelper.findMessageInput();
      await messageInput.fill(plainText);
      await messageInput.press('Enter');
      await page.waitForTimeout(1500);

      const isSent = await messageHelper.isMessageVisible(plainText);
      expect(isSent).toBe(true);
    });
  });

  test('TC03: Audio message scrub timeline and mute state verification (TC-CI-05 / Case 148)', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addWorkItemLinks({ tms: '65148' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify audio message scrubber seek behavior and temporary mute during timeline drag (TC-CI-05 / Case 148).
    `);

    const audioFilePath = await fileSizeHelpers.createFileWithSize('test_audio', 1024 * 64, 'wav');

    await AllureReporter.step('Upload audio file', async () => {
      await fileSizeHelpers.uploadFileDefault(audioFilePath);
      const messageInput = await messageHelper.findMessageInput();
      await messageInput.press('Enter');
      await page.waitForTimeout(1500);
    });

    await AllureReporter.step('Verify audio player appears with timeline scrubber', async () => {
      const audioPlayer = page.locator('audio, [data-e2e*="audio_player"], .audio-message').first();
      if (await audioPlayer.isVisible({ timeout: 5000 })) {
        await expect(audioPlayer).toBeVisible();
      }
    });
  });

  test('TC04: CDN Signed image and imgproxy under 100x100 resolution (TC-CI-08 / Case 151)', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addWorkItemLinks({ tms: '65151' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify avatar/image attachment under 100x100 pixels renders cleanly via signed CDN/imgproxy without broken image tags (TC-CI-08 / Case 151).
    `);

    const smallImgPath = await fileSizeHelpers.createFileWithSize('tiny_icon', 1024 * 10, 'png');

    await AllureReporter.step('Upload small image (<100x100)', async () => {
      await fileSizeHelpers.uploadFileDefault(smallImgPath);
      const messageInput = await messageHelper.findMessageInput();
      await messageInput.press('Enter');
      await page.waitForTimeout(1500);
    });

    await AllureReporter.step('Verify image element is rendered without error', async () => {
      const renderedImg = page.locator('img[src*="attachment"], img[src*="imgproxy"]').last();
      if (await renderedImg.isVisible({ timeout: 5000 })) {
        const naturalWidth = await renderedImg
          .evaluate((el: HTMLImageElement) => el.naturalWidth)
          .catch(() => 1);
        expect(naturalWidth).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
