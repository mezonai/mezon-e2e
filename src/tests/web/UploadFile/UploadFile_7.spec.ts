import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanSettingsPage } from '@/pages/ClanSettingsPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { FileSizeTestHelpers, UploadType } from '@/utils/uploadFileHelpers';
import { expect, test } from '@playwright/test';

test.describe('File Uploads - Edit and Delete Emoji and Image Stickers', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account9;
  let fileSizeHelpers: FileSizeTestHelpers;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await clanFactory.setupClan(ClanSetupHelper.configs.uploadFile2, page);
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

  const addTestMetadata = async (assetType: 'emoji' | 'image-sticker', action: string) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addLabels({ tag: ['upload-file', assetType, action, 'local'] });
  };

  const uploadEmoji = async (
    clanPage: ClanPage,
    clanSettingsPage: ClanSettingsPage,
    emojiName: string
  ) => {
    const filePath = await fileSizeHelpers.createFileWithSize(
      `emoji-${Date.now().toString(36)}`,
      100 * 1024,
      'png'
    );
    await clanPage.openClanSettings();
    await clanSettingsPage.clickSettingClanSection('Emoji');
    await clanSettingsPage.clickUploadEmoji();
    const result = await fileSizeHelpers.uploadByTypeAndVerify(filePath, UploadType.STICKER, true);
    expect(result.success).toBe(true);
    await clanSettingsPage.nameAndSaveEmoji(emojiName);
  };

  const uploadImageSticker = async (
    clanPage: ClanPage,
    clanSettingsPage: ClanSettingsPage,
    stickerName: string
  ) => {
    const filePath = await fileSizeHelpers.createFileWithSize(
      `sticker-${Date.now().toString(36)}`,
      100 * 1024,
      'png'
    );
    await clanPage.openClanSettings();
    await clanSettingsPage.clickSettingClanSection('Image Stickers');
    await clanSettingsPage.clickUploadImageSticker();
    const result = await fileSizeHelpers.uploadByTypeAndVerify(filePath, UploadType.STICKER, true);
    expect(result.success).toBe(true);
    await clanSettingsPage.nameAndSaveImageSticker(stickerName);
  };

  test('Edit a custom emoji', async ({ page }) => {
    await addTestMetadata('emoji', 'edit');
    const clanPage = new ClanPage(page);
    const clanSettingsPage = new ClanSettingsPage(page);
    const suffix = Date.now().toString(36).slice(-5);
    const originalName = `EmojiOriginal${suffix}`;
    const editedName = `EmojiEdited${suffix}`;

    await uploadEmoji(clanPage, clanSettingsPage, originalName);
    await clanSettingsPage.editEmojiName(originalName, editedName);
    await clanPage.closeSettingsClanIfOpen();
  });

  test('Delete a custom emoji', async ({ page }) => {
    await addTestMetadata('emoji', 'delete');
    const clanPage = new ClanPage(page);
    const clanSettingsPage = new ClanSettingsPage(page);
    const emojiName = `EmojiDelete${Date.now().toString(36).slice(-5)}`;

    await uploadEmoji(clanPage, clanSettingsPage, emojiName);
    await clanSettingsPage.deleteEmoji(emojiName);
    await clanPage.closeSettingsClanIfOpen();
  });

  test('Edit a custom image sticker', async ({ page }) => {
    await addTestMetadata('image-sticker', 'edit');
    const clanPage = new ClanPage(page);
    const clanSettingsPage = new ClanSettingsPage(page);
    const suffix = Date.now().toString(36).slice(-5);
    const originalName = `StickerOriginal${suffix}`;
    const editedName = `StickerEdited${suffix}`;

    await uploadImageSticker(clanPage, clanSettingsPage, originalName);
    await clanSettingsPage.editImageStickerName(originalName, editedName);
    await clanPage.closeSettingsClanIfOpen();
  });

  test('Delete a custom image sticker', async ({ page }) => {
    await addTestMetadata('image-sticker', 'delete');
    const clanPage = new ClanPage(page);
    const clanSettingsPage = new ClanSettingsPage(page);
    const stickerName = `StickerDelete${Date.now().toString(36).slice(-5)}`;

    await uploadImageSticker(clanPage, clanSettingsPage, stickerName);
    await clanSettingsPage.deleteImageSticker(stickerName);
    await clanPage.closeSettingsClanIfOpen();
  });
});
