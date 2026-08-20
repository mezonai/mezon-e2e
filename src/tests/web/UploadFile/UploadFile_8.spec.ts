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

test.describe('File Uploads - Voice Stickers', () => {
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

  const addTestMetadata = async (action: string) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addLabels({ tag: ['upload-file', 'voice-sticker', action, 'local'] });
  };

  const uploadVoiceSticker = async (
    clanPage: ClanPage,
    clanSettingsPage: ClanSettingsPage,
    voiceStickerName: string
  ) => {
    const audioPath = await fileSizeHelpers.createFileWithSize(
      `voice-sticker-${Date.now().toString(36)}`,
      100 * 1024,
      'wav'
    );
    await clanPage.openClanSettings();
    await clanSettingsPage.clickSettingClanSection('Sound Effect');
    await clanSettingsPage.clickUploadVoiceStickers();
    const result = await fileSizeHelpers.uploadByTypeAndVerify(
      audioPath,
      UploadType.VOICE_STICKER,
      true
    );
    expect(result.success).toBe(true);
    await clanSettingsPage.nameAndSaveVoiceSticker(voiceStickerName);
  };

  test('Upload a custom voice sticker', async ({ page }) => {
    await addTestMetadata('upload');
    const clanPage = new ClanPage(page);
    const clanSettingsPage = new ClanSettingsPage(page);
    const voiceStickerName = `VoiceUpload${Date.now().toString(36).slice(-5)}`;

    await uploadVoiceSticker(clanPage, clanSettingsPage, voiceStickerName);
    await clanPage.closeSettingsClanIfOpen();
  });

  test('Edit a custom voice sticker', async ({ page }) => {
    await addTestMetadata('edit');
    const clanPage = new ClanPage(page);
    const clanSettingsPage = new ClanSettingsPage(page);
    const suffix = Date.now().toString(36).slice(-5);
    const originalName = `VoiceOriginal${suffix}`;
    const editedName = `VoiceEdited${suffix}`;

    await uploadVoiceSticker(clanPage, clanSettingsPage, originalName);
    await clanSettingsPage.editVoiceStickerName(originalName, editedName);
    await clanPage.closeSettingsClanIfOpen();
  });

  test('Delete a custom voice sticker', async ({ page }) => {
    await addTestMetadata('delete');
    const clanPage = new ClanPage(page);
    const clanSettingsPage = new ClanSettingsPage(page);
    const voiceStickerName = `VoiceDelete${Date.now().toString(36).slice(-5)}`;

    await uploadVoiceSticker(clanPage, clanSettingsPage, voiceStickerName);
    await clanSettingsPage.deleteVoiceSticker(voiceStickerName);
    await clanPage.closeSettingsClanIfOpen();
  });
});
