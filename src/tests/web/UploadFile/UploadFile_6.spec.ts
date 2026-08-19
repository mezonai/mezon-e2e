import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, MEZON_DEV } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanSettingsPage } from '@/pages/ClanSettingsPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { FileSizeTestHelpers, UploadType } from '@/utils/uploadFileHelpers';
import { expect, test } from '@playwright/test';

test.describe('File Uploads - Custom Emoji', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account9;
  let fileSizeHelpers: FileSizeTestHelpers;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await clanFactory.setupClan(ClanSetupHelper.configs.uploadFile2, page);
    clanFactory.setClanUrl(
      joinUrlPaths(MEZON_DEV, splitDomainAndPath(clanFactory.getClanUrl()).path)
    );
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    const auth = await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), auth);
    fileSizeHelpers = new FileSizeTestHelpers(page);
  });

  test.afterEach(async ({ page }) => AuthHelper.logout(page));

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const auth = await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), auth);
    await clanFactory.cleanupClan(page);
    await fileSizeHelpers.cleanupFiles();
    await AuthHelper.logout(page);
    await context.close();
  });

  test('Upload a custom emoji and send it in a channel message', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify an uploaded custom emoji can be sent in a clan channel.

      **Test Steps:**
      1. Open the clan through the configured dev URL
      2. Open Clan Settings > Emoji and upload a valid PNG
      3. Enter Upload Emoji in the emoji_name field and save
      4. Open general, select the uploaded emoji, and send it
      5. Verify the sent message contains Upload Emoji

      **Expected Result:** The custom emoji is uploaded and displayed in the sent message.
    `);
    await AllureReporter.addLabels({
      tag: ['upload-file', 'custom-emoji', 'channel-message'],
    });

    expect(new URL(page.url()).origin).toBe(new URL(MEZON_DEV).origin);

    const clanPage = new ClanPage(page);
    const clanSettingsPage = new ClanSettingsPage(page);
    const emojiName = 'Upload Emoji';
    const emojiPath = await fileSizeHelpers.createFileWithSize(
      `upload-emoji-${Date.now().toString(36)}`,
      100 * 1024,
      'png'
    );

    await AllureReporter.step('Upload and save the custom emoji', async () => {
      await clanPage.openClanSettings();
      await clanSettingsPage.clickSettingClanSection('Emoji');
      await clanSettingsPage.clickUploadEmoji();
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        emojiPath,
        UploadType.STICKER,
        true
      );
      expect(result.success).toBe(true);
      expect(new URL(page.url()).origin).toBe(new URL(MEZON_DEV).origin);
      await clanSettingsPage.nameAndSaveEmoji(emojiName);
      await clanPage.closeSettingsClanIfOpen();
    });

    await AllureReporter.step('Send the uploaded emoji in general', async () => {
      await clanPage.sendCustomEmojiMessage(emojiName);
    });

    await AllureReporter.attachScreenshot(page, 'Uploaded custom emoji sent in general');
  });

  test('Upload a custom image sticker and send it in a channel message', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify an uploaded custom image sticker can be sent in a clan channel.

      **Test Steps:**
      1. Open the clan through the configured dev URL
      2. Open Clan Settings > Image Stickers and upload a valid PNG
      3. Enter Upload Sticker in the sticker name field and save
      4. Open general, select the uploaded sticker, and send it
      5. Verify the sent message contains the uploaded image sticker

      **Expected Result:** The custom image sticker is uploaded and displayed in the sent message.
    `);
    await AllureReporter.addLabels({
      tag: ['upload-file', 'custom-image-sticker', 'channel-message'],
    });

    expect(new URL(page.url()).origin).toBe(new URL(MEZON_DEV).origin);

    const clanPage = new ClanPage(page);
    const clanSettingsPage = new ClanSettingsPage(page);
    const stickerName = 'Upload Sticker';
    const stickerPath = await fileSizeHelpers.createFileWithSize(
      `upload-sticker-${Date.now().toString(36)}`,
      100 * 1024,
      'png'
    );

    await AllureReporter.step('Upload and save the custom image sticker', async () => {
      await clanPage.openClanSettings();
      await clanSettingsPage.clickSettingClanSection('Image Stickers');
      await clanSettingsPage.clickUploadImageSticker();
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        stickerPath,
        UploadType.STICKER,
        true
      );
      expect(result.success).toBe(true);
      expect(new URL(page.url()).origin).toBe(new URL(MEZON_DEV).origin);
      await clanSettingsPage.nameAndSaveImageSticker(stickerName);
      await clanPage.closeSettingsClanIfOpen();
    });

    await AllureReporter.step('Send the uploaded image sticker in general', async () => {
      await clanPage.sendCustomImageStickerMessage(stickerName);
    });

    await AllureReporter.attachScreenshot(page, 'Uploaded custom image sticker sent in general');
  });
});
