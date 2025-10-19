import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import joinUrlPaths from '@/utils/joinUrlPaths';
import pressEsc from '@/utils/pressEsc';
import { FileSizeTestHelpers, UploadType } from '@/utils/uploadFileHelpers';
import { BrowserContext, expect, Page, test, TestInfo } from '@playwright/test';
import { ClanSettingsPage } from '../../../pages/ClanSettingsPage';
import { ProfilePage } from '../../../pages/ProfilePage';

test.describe('File Size Limits Validation - Module 2', () => {
  let fileSizeHelpers: FileSizeTestHelpers;
  let clanSettingsPage: ClanSettingsPage;
  let profilePage: ProfilePage;
  let clanPage: ClanPage;
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account9);
    await clanFactory.setupClan(ClanSetupHelper.configs.uploadFile2, page);

    clanFactory.setClanUrl(
      joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, splitDomainAndPath(clanFactory.getClanUrl()).path)
    );
    await context.close();
  });

  test.beforeEach(
    async ({ page, context }: { page: Page; context: BrowserContext }, testInfo: TestInfo) => {
      await AllureReporter.initializeTest(page, testInfo, {
        story: AllureConfig.Stories.FILE_UPLOAD,
        severity: AllureConfig.Severity.CRITICAL,
        testType: AllureConfig.TestTypes.E2E,
      });

      await AllureReporter.addTestParameters({
        testType: AllureConfig.TestTypes.E2E,
        userType: AllureConfig.UserTypes.AUTHENTICATED,
        severity: AllureConfig.Severity.CRITICAL,
      });

      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      const credentials = await AuthHelper.setupAuthWithEmailPassword(
        page,
        AccountCredentials.account9
      );
      await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);

      fileSizeHelpers = new FileSizeTestHelpers(page);
      clanSettingsPage = new ClanSettingsPage(page);
      profilePage = new ProfilePage(page);
      clanPage = new ClanPage(page);
    }
  );

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account9
    );
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await clanFactory.cleanupClan(page);
    await fileSizeHelpers.cleanupFiles();
    await AuthHelper.logout(page);
    await context.close();
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test('Validate Clan Avatar size limit (1MB) when creating a new clan', async ({ page }) => {
    await AllureReporter.addDescription(`
        **Test Objective:** Verify Clan Profile avatar is limited to 1MB

        **Test Steps:**
        1. Click Create Clan from sidebar to open modal create clan
        2. Attempt to upload clan avatar under 1MB (should succeed)
        3. Attempt to upload clan avatar over 1MB (should fail)

        **Expected Result:** Clan avatar under 1MB uploads successfully, over 1MB is rejected
      `);

    await AllureReporter.step('Navigate to Clan Profile settings', async () => {
      await profilePage.buttons.userSettingProfile.waitFor({
        state: 'visible',
        timeout: 3000,
      });
      await clanPage.buttons.createClan.click();
    });

    const underLimitPath = await fileSizeHelpers.createFileWithSize(
      'clan_avatar_under_1mb',
      900 * 1024,
      'jpg'
    );

    await AllureReporter.step(`Test upload clan avatar under limit (900KB)`, async () => {
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        underLimitPath,
        UploadType.CLAN_LOGO_NEW_MODAL,
        true
      );
      expect(result.success).toBe(true);
    });

    const overLimitPath = await fileSizeHelpers.createFileWithSize(
      'clan_avatar_over_1mb',
      1 * 1024 * 1024 + 200 * 1024,
      'jpg'
    );

    await AllureReporter.step(
      `Test upload clan avatar over limit (1.2MB) - should fail`,
      async () => {
        const result = await fileSizeHelpers.uploadByTypeAndVerify(
          overLimitPath,
          UploadType.CLAN_LOGO_NEW_MODAL,
          false
        );

        expect(result.success).toBe(false);
        expect(result.errorMessage?.toLowerCase()).toMatch('max file size is 1 mb, please!');
        await page.reload({
          waitUntil: 'domcontentloaded',
        });
      }
    );
  });

  test('Validate Clan Settings Banner Background size limit (10MB) @ClanBannerBackground', async ({
    page,
  }) => {
    await AllureReporter.addDescription(`
        **Test Objective:** Verify Clan Settings Banner Background is limited to 10MB
        
        **Test Steps:**
        1. Navigate to Clan Settings (Overview)
        2. Attempt to upload banner background under 10MB (should succeed)
        3. Attempt to upload banner background over 10MB (should fail)
        
        **Expected Result:** Under 10MB uploads successfully, over 10MB is rejected with proper error
      `);

    await AllureReporter.step('Open Clan Settings (Overview)', async () => {
      await clanPage.openClanSettings();
    });

    const smallBannerPath = await fileSizeHelpers.createFileWithSize(
      'clan_banner_small',
      5 * 1024 * 1024,
      'jpg'
    );

    await AllureReporter.step('Upload small banner background (5MB)', async () => {
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        smallBannerPath,
        UploadType.CLAN_BANNER,
        true
      );
      expect(result.success).toBe(true);
    });

    const largeBannerPath = await fileSizeHelpers.createFileWithSize(
      'clan_banner_large',
      12 * 1024 * 1024,
      'jpg'
    );

    await AllureReporter.step('Upload large banner background (12MB) - should fail', async () => {
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        largeBannerPath,
        UploadType.CLAN_BANNER,
        false
      );
      expect(result.success).toBe(false);
      expect(result.errorMessage?.toLowerCase()).toMatch(
        /(your files are too powerful|max file size.*10\s*mb|upload size limit exceeded)/
      );
      await pressEsc(page);
    });
  });

  test('Validate Clan Settings Emoji upload size limit (256KB) @EmojiUpload', async ({ page }) => {
    await AllureReporter.addDescription(`
        **Test Objective:** Verify that Emoji uploads are limited to 256KB (UI guideline) and enforced by app (≈250KB)
        
        **Test Steps:**
        1. Navigate to Clan Settings → Emoji and open Upload dialog
        2. Upload an emoji under ~250KB (should succeed)
        3. Upload an emoji over ~250KB (should fail with proper error)
        
        **Expected Result:** Under ~250KB uploads show preview, over ~250KB is rejected with error modal
      `);

    await AllureReporter.step('Open Clan Settings (Emoji) and open upload modal', async () => {
      await clanPage.openClanSettings();
      await clanSettingsPage.clickSettingClanSection('Emoji');
      await clanSettingsPage.clickUploadEmoji();
    });

    const smallEmojiPath = await fileSizeHelpers.createFileWithSize(
      'emoji_small',
      200 * 1024,
      'png'
    );

    await AllureReporter.step('Upload small emoji (90KB)', async () => {
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        smallEmojiPath,
        UploadType.STICKER,
        true
      );
      expect(result.success).toBe(true);
    });

    const largeEmojiPath = await fileSizeHelpers.createFileWithSize(
      'emoji_large',
      300 * 1024,
      'png'
    );

    await AllureReporter.step('Upload large emoji (300KB) - should fail', async () => {
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        largeEmojiPath,
        UploadType.STICKER,
        false
      );
      expect(result.success).toBe(false);
      expect(result.errorMessage).toMatch(`Max file size is 256 KB, please!`);
      await page.reload({ waitUntil: 'domcontentloaded' });
    });
  });

  test('Validate Canvas paste file size limit (50MB)', async ({ page }) => {
    await AllureReporter.addDescription(`
        **Test Objective:** Verify Copy/Paste into Canvas is limited to 50MB (same as image limit)
        
        **Test Steps:**
        1. Copy large image file (under 50MB)
        2. Paste into canvas area
        3. Copy very large image file (over 50MB)
        4. Attempt to paste into canvas area
        
        **Expected Result:** Files under 50MB paste successfully, files over 50MB are rejected
      `);

    const smallCanvasFilePath = await fileSizeHelpers.createFileWithSize(
      'canvas_small',
      30 * 1024 * 1024,
      'jpg'
    );

    await AllureReporter.step(`Test paste small file into canvas (30MB)`, async () => {
      const result = await fileSizeHelpers.uploadFileAndVerify(smallCanvasFilePath, true);
      expect(result.success).toBe(true);
    });

    const largeCanvasFilePath = await fileSizeHelpers.createFileWithSize(
      'canvas_large',
      60 * 1024 * 1024,
      'jpg'
    );

    await AllureReporter.step(
      `Test paste large file into canvas (60MB) - should fail`,
      async () => {
        const result = await fileSizeHelpers.uploadFileAndVerify(largeCanvasFilePath, false);
        expect(result.success).toBe(false);
        expect(result.errorMessage?.toLowerCase()).toMatch('maximum allowed size is 50mb');
        await page.reload({ waitUntil: 'domcontentloaded' });
      }
    );
  });

  test('Validate Clan Settings Voice Stickers upload size limit (1MB) @VoiceStickers', async ({
    page,
  }) => {
    await AllureReporter.addDescription(`
        **Test Objective:** Verify Voice Stickers upload size limit is 1MB
        
        **Test Steps:**
        1. Navigate to Clan Settings → Voice Stickers → Upload sound
        2. Upload a sound file under 1MB (should succeed)
        3. Upload a sound file over 1MB (should fail with proper error)
        
        **Expected Result:** File under 1MB uploads successfully, file over 1MB is rejected with proper error
      `);

    await AllureReporter.step(
      'Open Clan Settings (Voice Stickers) and open upload modal',
      async () => {
        await clanPage.openClanSettings();
        await clanSettingsPage.clickSettingClanSection('Voice Stickers');
        await clanSettingsPage.clickUploadVoiceStickers();
      }
    );

    const smallSoundPath = await fileSizeHelpers.createFileWithSize(
      'voice_small',
      800 * 1024,
      'mp3'
    );

    await AllureReporter.step('Upload small sound (800KB)', async () => {
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        smallSoundPath,
        UploadType.VOICE_STICKER,
        true
      );
      expect(result.success).toBe(true);
    });

    const largeSoundPath = await fileSizeHelpers.createFileWithSize(
      'voice_large',
      1 * 1024 * 1024 + 200 * 1024,
      'mp3'
    );

    await AllureReporter.step('Upload large sound (1.2MB) - should fail', async () => {
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        largeSoundPath,
        UploadType.VOICE_STICKER,
        false
      );
      expect(result.success).toBe(false);
      expect(result.errorMessage).toMatch('File too big, max 1MB');
      await page.reload({ waitUntil: 'domcontentloaded' });
    });
  });
});
