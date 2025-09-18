import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { expect, test, Browser, Page, BrowserContext, TestInfo } from '@playwright/test';
// import { WEBSITE_CONFIGS } from '../../config/environment';
import { ClanSettingsPage } from '../../pages/ClanSettingsPage';
import { ProfilePage } from '../../pages/ProfilePage';
import { FileSizeTestHelpers } from '@/utils/uploadFileHelpers';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';

test.describe('File Size Limits Validation', () => {
  let clanSetupHelper: ClanSetupHelper;
  let fileSizeHelpers: FileSizeTestHelpers;
  let clanSettingsPage: ClanSettingsPage;
  let channelSettingPage: ChannelSettingPage;
  let profilePage: ProfilePage;
  let clanPage: ClanPageV2;
  let clanName: string;
  let clanUrl: string;

  test.use({ storageState: 'playwright/.auth/account9.json' });

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(ClanSetupHelper.configs.uploadFile);
    clanName = setupResult.clanName;
    clanUrl = setupResult.clanUrl;
  });

  test.afterAll(async () => {
    if (clanSetupHelper)
      await clanSetupHelper.cleanupClan(
        clanName,
        clanUrl,
        ClanSetupHelper.configs.uploadFile.suiteName
      );
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

      fileSizeHelpers = new FileSizeTestHelpers(page);
      clanSettingsPage = new ClanSettingsPage(page);
      channelSettingPage = new ChannelSettingPage(page);
      profilePage = new ProfilePage(page);
      clanPage = new ClanPageV2(page);

      await AllureReporter.step('Navigate to test clan', async () => {
        await page.goto(clanUrl);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      });
    }
  );

  test('Validate image attachment file size limit (50MB)', async () => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that image attachments are limited to 50MB
      
      **Test Steps:**
      1. Create image file under 50MB (should succeed)
      2. Create image file over 50MB (should fail)
      3. Verify appropriate error messages
      
      **Expected Result:** Files under 50MB upload successfully, files over 50MB are rejected
    `);

    const smallImagePath = await fileSizeHelpers.createFileWithSize(
      'small_image',
      30 * 1024 * 1024,
      'jpg'
    );

    await AllureReporter.step(`Test upload small image (30MB)`, async () => {
      const result = await fileSizeHelpers.uploadFileAndVerify(smallImagePath, true);

      expect(result.success).toBe(true);
    });

    await fileSizeHelpers.cleanupFiles([smallImagePath]);

    const largeImagePath = await fileSizeHelpers.createFileWithSize(
      'large_image',
      60 * 1024 * 1024,
      'jpg'
    );

    await AllureReporter.step(`Test upload large image (60MB) - should fail`, async () => {
      const result = await fileSizeHelpers.uploadFileAndVerify(largeImagePath, false);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toMatch('Maximum allowed size is 50MB');
    });

    await fileSizeHelpers.cleanupFiles([largeImagePath]);
  });

  test('Validate video and other file types size limit (100MB)', async () => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that video and other file types are limited to 100MB
      
      **Test Steps:**
      1. Create video file under 100MB (should succeed)
      2. Create video file over 100MB (should fail)
      3. Test other file types with same limits
      
      **Expected Result:** Files under 100MB upload successfully, files over 100MB are rejected
    `);

    const smallVideoPath = await fileSizeHelpers.createFileWithSize(
      'small_video',
      80 * 1024 * 1024,
      'mp4'
    );

    await AllureReporter.step(`Test upload small video (80MB)`, async () => {
      const result = await fileSizeHelpers.uploadFileAndVerify(smallVideoPath, true);

      expect(result.success).toBe(true);
      expect(result.fileSize).toBe(80 * 1024 * 1024);
    });

    await fileSizeHelpers.cleanupFiles([smallVideoPath]);

    const largeVideoPath = await fileSizeHelpers.createFileWithSize(
      'large_video',
      120 * 1024 * 1024,
      'mp4'
    );

    await AllureReporter.step(`Test upload large video (120MB) - should fail`, async () => {
      const result = await fileSizeHelpers.uploadFileAndVerify(largeVideoPath, false);

      expect(result.success).toBe(false);
      expect(result.errorMessage?.toLowerCase()).toMatch('maximum allowed size is 100mb');
    });

    await fileSizeHelpers.cleanupFiles([largeVideoPath]);

    const largePdfPath = await fileSizeHelpers.createFileWithSize(
      'large_document',
      120 * 1024 * 1024,
      'pdf'
    );

    await AllureReporter.step(`Test upload large PDF (120MB) - should fail`, async () => {
      const result = await fileSizeHelpers.uploadFileAndVerify(largePdfPath, false);

      expect(result.success).toBe(false);
      expect(result.errorMessage?.toLowerCase()).toMatch('maximum allowed size is 100mb');
    });

    await fileSizeHelpers.cleanupFiles([largePdfPath]);
  });

  test('Validate User Profile avatar size limit (10MB)', async () => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify User Profile avatar is limited to 10MB
      
      **Test Steps:**
      1. Navigate to User Profile settings
      2. Attempt to upload avatar under 10MB (should succeed)
      3. Attempt to upload avatar over 10MB (should fail)
      
      **Expected Result:** Avatar under 10MB uploads successfully, over 10MB is rejected
    `);

    await AllureReporter.step('Navigate to Profile settings', async () => {
      await profilePage.buttons.userSettingProfile.waitFor({
        state: 'visible',
        timeout: 3000,
      });
      await profilePage.buttons.userSettingProfile.click();
      await profilePage.openProfileTab();
      await profilePage.openUserProfileTab();
    });

    const smallAvatarPath = await fileSizeHelpers.createFileWithSize(
      'small_avatar',
      5 * 1024 * 1024,
      'jpg'
    );

    await AllureReporter.step(`Test upload small avatar (5MB)`, async () => {
      const result = await fileSizeHelpers.uploadFileAndVerify(smallAvatarPath, true);

      expect(result.success).toBe(true);
    });

    await fileSizeHelpers.cleanupFiles([smallAvatarPath]);

    const largeAvatarPath = await fileSizeHelpers.createFileWithSize(
      'large_avatar',
      15 * 1024 * 1024,
      'jpg'
    );

    await AllureReporter.step(`Test upload large avatar (15MB) - should fail`, async () => {
      const result = await fileSizeHelpers.uploadFileAndVerify(largeAvatarPath, false);

      expect(result.success).toBe(false);
      expect(result.errorMessage?.toLowerCase()).toMatch('max file size is 10 mb, please!');
    });

    await fileSizeHelpers.cleanupFiles([largeAvatarPath]);
  });

  test('Validate Clan Profile avatar size limit (10MB)', async () => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Clan Profile avatar is limited to 10MB
      
      **Test Steps:**
      1. Navigate to Clan Profile settings
      2. Attempt to upload clan avatar under 10MB (should succeed)
      3. Attempt to upload clan avatar over 10MB (should fail)
      
      **Expected Result:** Clan avatar under 10MB uploads successfully, over 10MB is rejected
    `);

    await AllureReporter.step('Navigate to Clan Profile settings', async () => {
      await profilePage.buttons.userSettingProfile.waitFor({
        state: 'visible',
        timeout: 3000,
      });
      await profilePage.buttons.userSettingProfile.click();
      await profilePage.openProfileTab();
      await profilePage.openClanProfileTab();
    });

    const smallClanAvatarPath = await fileSizeHelpers.createFileWithSize(
      'small_clan_avatar',
      7 * 1024 * 1024,
      'jpg'
    );

    await AllureReporter.step(`Test upload small clan avatar (7MB)`, async () => {
      const result = await fileSizeHelpers.uploadFileAndVerify(smallClanAvatarPath, true);

      expect(result.success).toBe(true);
    });

    await fileSizeHelpers.cleanupFiles([smallClanAvatarPath]);

    const largeClanAvatarPath = await fileSizeHelpers.createFileWithSize(
      'large_clan_avatar',
      12 * 1024 * 1024,
      'jpg'
    );

    await AllureReporter.step(`Test upload large clan avatar (12MB) - should fail`, async () => {
      const result = await fileSizeHelpers.uploadFileAndVerify(largeClanAvatarPath, false);

      expect(result.success).toBe(false);
      expect(result.errorMessage?.toLowerCase()).toMatch('max file size is 10 mb, please!');
    });

    await fileSizeHelpers.cleanupFiles([largeClanAvatarPath]);
  });

  test('Validate Clan Avatar size limit (1MB)', async () => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Clan Profile avatar is limited to 1MB
      
      **Test Steps:**
      1. Navigate to Clan Profile settings
      2. Attempt to upload clan avatar under 1MB (should succeed)
      3. Attempt to upload clan avatar over 1MB (should fail)
      
      **Expected Result:** Clan avatar under 1MB uploads successfully, over 1MB is rejected
    `);

    await AllureReporter.step('Navigate to Clan Profile settings', async () => {
      await profilePage.buttons.userSettingProfile.waitFor({
        state: 'visible',
        timeout: 3000,
      });
      await clanPage.openClanSettings();
    });

    const underLimitPath = await fileSizeHelpers.createFileWithSize(
      'clan_avatar_under_1mb',
      900 * 1024,
      'jpg'
    );

    await AllureReporter.step(`Test upload clan avatar under limit (900KB)`, async () => {
      const result = await fileSizeHelpers.uploadClanLogoAndVerify(underLimitPath, true);

      expect(result.success).toBe(true);
    });

    await fileSizeHelpers.cleanupFiles([underLimitPath]);

    const overLimitPath = await fileSizeHelpers.createFileWithSize(
      'clan_avatar_over_1mb',
      1 * 1024 * 1024 + 200 * 1024,
      'jpg'
    );

    await AllureReporter.step(
      `Test upload clan avatar over limit (1.2MB) - should fail`,
      async () => {
        const result = await fileSizeHelpers.uploadClanLogoAndVerify(overLimitPath, false);

        expect(result.success).toBe(false);
        expect(result.errorMessage?.toLowerCase()).toMatch(
          /(your files are too powerful|upload size limit exceeded|max file size)/
        );
      }
    );

    await fileSizeHelpers.cleanupFiles([overLimitPath]);
  });

  test('Validate Clan Settings Banner Background size limit (10MB) @ClanBannerBackground', async () => {
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
      const result = await fileSizeHelpers.uploadClanBannerAndVerify(smallBannerPath, true);
      expect(result.success).toBe(true);
    });

    await fileSizeHelpers.cleanupFiles([smallBannerPath]);

    const largeBannerPath = await fileSizeHelpers.createFileWithSize(
      'clan_banner_large',
      12 * 1024 * 1024,
      'jpg'
    );

    await AllureReporter.step('Upload large banner background (12MB) - should fail', async () => {
      const result = await fileSizeHelpers.uploadClanBannerAndVerify(largeBannerPath, false);
      expect(result.success).toBe(false);
      expect(result.errorMessage?.toLowerCase()).toMatch(
        /(your files are too powerful|max file size.*10\s*mb|upload size limit exceeded)/
      );
    });

    await fileSizeHelpers.cleanupFiles([largeBannerPath]);
  });

  test('Validate Clan Settings Emoji upload size limit (256KB) @EmojiUpload', async () => {
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
      const result = await fileSizeHelpers.uploadStickerAndVerify(smallEmojiPath, true);
      expect(result.success).toBe(true);
    });

    await fileSizeHelpers.cleanupFiles([smallEmojiPath]);

    const largeEmojiPath = await fileSizeHelpers.createFileWithSize(
      'emoji_large',
      300 * 1024,
      'png'
    );

    await AllureReporter.step('Upload large emoji (300KB) - should fail', async () => {
      const result = await fileSizeHelpers.uploadStickerAndVerify(largeEmojiPath, false);
      expect(result.success).toBe(false);
      expect(result.errorMessage).toMatch(`Max file size is 256 KB, please!`);
    });

    await fileSizeHelpers.cleanupFiles([largeEmojiPath]);
  });

  test('Validate Canvas paste file size limit (50MB)', async () => {
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

    await fileSizeHelpers.cleanupFiles([smallCanvasFilePath]);

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
      }
    );

    await fileSizeHelpers.cleanupFiles([largeCanvasFilePath]);
  });

  test('Validate Clan Settings Voice Stickers upload size limit (1MB) @VoiceStickers', async () => {
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
      const result = await fileSizeHelpers.uploadVoiceStickerAndVerify(smallSoundPath, true);
      expect(result.success).toBe(true);
    });

    await fileSizeHelpers.cleanupFiles([smallSoundPath]);

    const largeSoundPath = await fileSizeHelpers.createFileWithSize(
      'voice_large',
      1 * 1024 * 1024 + 200 * 1024,
      'mp3'
    );

    await AllureReporter.step('Upload large sound (1.2MB) - should fail', async () => {
      const result = await fileSizeHelpers.uploadVoiceStickerAndVerify(largeSoundPath, false);
      expect(result.success).toBe(false);
      expect(result.errorMessage).toMatch('File too big, max 1MB');
    });

    await fileSizeHelpers.cleanupFiles([largeSoundPath]);
  });

  test('Validate multiple file size limits simultaneously', async () => {
    await AllureReporter.addDescription(`
      **Test Objective:** Test multiple file size limits in a single test to ensure consistency
      eventCover
      **Test Steps:**
      1. Test various file types with their respective limits
      2. Verify all error messages are appropriate
      3. Ensure small files still work correctly
    `);

    const testFiles = [
      {
        name: 'image_60mb',
        size: 60 * 1024 * 1024,
        expectedSuccess: false,
        ext: 'jpg',
        type: 'image',
      },
      {
        name: 'video_120mb',
        size: 120 * 1024 * 1024,
        expectedSuccess: false,
        ext: 'mp4',
        type: 'video',
      },
      {
        name: 'avatar_15mb',
        size: 15 * 1024 * 1024,
        expectedSuccess: false,
        ext: 'jpg',
        type: 'avatar',
      },
      {
        name: 'sticker_600kb',
        size: 600 * 1024,
        expectedSuccess: false,
        ext: 'png',
        type: 'sticker',
      },
      {
        name: 'small_image_5mb',
        size: 5 * 1024 * 1024,
        expectedSuccess: false,
        ext: 'jpg',
        type: 'image',
      },
    ];

    for (const testFile of testFiles) {
      const filePath = await fileSizeHelpers.createFileWithSize(
        testFile.name,
        testFile.size,
        testFile.ext
      );

      await AllureReporter.step(
        `Test ${testFile.type} file (${(testFile.size / (1024 * 1024)).toFixed(1)}MB)`,
        async () => {
          const result = await fileSizeHelpers.uploadFileAndVerify(
            filePath,
            testFile.expectedSuccess
          );

          expect(result.success).toBe(testFile.expectedSuccess);

          if (!testFile.expectedSuccess) {
            expect(result.errorMessage).toBeTruthy();
            expect(result.errorMessage!.toLowerCase()).toMatch('maximum allowed size is 50mb');
          }
        }
      );

      await fileSizeHelpers.cleanupFiles([filePath]);
    }
  });

  test('Validate Event cover image size limit (1MB) @EventCover', async () => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Event cover image upload enforces 1MB limit
      
      **Test Steps:**
      1. Open Events modal and start Create Event flow
      2. Navigate to Event Info tab
      3. Upload image under 1MB (should succeed)
      4. Upload image over 1MB (should show error modal)
      
      **Expected Result:** Under 1MB uploads successfully; over 1MB shows "Your files are too powerful" with "Max file size is 1 MB"
    `);

    await AllureReporter.step('Create Events', async () => {
      await clanPage.createEvent();
    });

    const under1MbPath = await fileSizeHelpers.createFileWithSize(
      'event_cover_under_1mb',
      900 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload event cover under limit (900KB)', async () => {
      const result = await fileSizeHelpers.uploadEventImageCoverAndVerify(under1MbPath, true);
      expect(result.success).toBe(true);
    });
    await fileSizeHelpers.cleanupFiles([under1MbPath]);

    const over1MbPath = await fileSizeHelpers.createFileWithSize(
      'event_cover_over_1mb',
      1 * 1024 * 1024 + 200 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload event cover over limit (1.2MB) - should fail', async () => {
      const result = await fileSizeHelpers.uploadEventImageCoverAndVerify(over1MbPath, false);
      expect(result.success).toBe(false);
      expect(result.errorMessage?.toLowerCase()).toMatch('max file size is 1 mb, please!');
    });
    await fileSizeHelpers.cleanupFiles([over1MbPath]);
  });

  test('Validate Onboarding → Clan Guide → Resources image size limit (10MB) @OnboardingResources', async () => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Onboarding Clan Guide Resources image upload enforces 10MB limit
      
      **Test Steps:**
      1. Open Clan Settings → Onboarding → Clan Guide → Add a resource
      2. Upload image under 10MB (should preview and not show error modal)
      3. Upload image over 10MB (should show error modal with Max file size is 10 MB)
      
      **Expected Result:** Under 10MB shows preview; over 10MB shows error modal (Your files are too powerful, Max file size is 10 MB)
    `);

    await AllureReporter.step('Open Onboarding → Clan Guide → Add a resource', async () => {
      await clanPage.openClanSettings();
      await clanSettingsPage.clickSettingClanSection('Onboarding');
      await clanSettingsPage.openEditOnboardingResource();
    });

    const under10Mb = await fileSizeHelpers.createFileWithSize(
      'onboarding_resource_under_10mb',
      9 * 1024 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload resource image under limit (9MB)', async () => {
      const result = await fileSizeHelpers.uploadOnboardingResourceAndVerify(under10Mb, true);
      expect(result.success).toBe(true);
    });
    await fileSizeHelpers.cleanupFiles([under10Mb]);

    const over10Mb = await fileSizeHelpers.createFileWithSize(
      'onboarding_resource_over_10mb',
      10 * 1024 * 1024 + 200 * 1024,
      'jpg'
    );
    await AllureReporter.step(
      'Upload resource image over limit (10.2MB) - should fail',
      async () => {
        const result = await fileSizeHelpers.uploadOnboardingResourceAndVerify(over10Mb, false);
        expect(result.success).toBe(false);
        expect(result.errorMessage?.toLowerCase()).toMatch('max file size is 10 mb, please!');
      }
    );
    await fileSizeHelpers.cleanupFiles([over10Mb]);
  });

  test('Validate Community Banner image size limit (10MB) @CommunityBanner', async () => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Community Banner upload enforces 10MB limit
      
      **Test Steps:**
      1. Open Clan Settings → Community
      2. Upload image under 10MB (should preview and not show error modal)
      3. Upload image over 10MB (should show error modal with Max file size is 10 MB)
      
      **Expected Result:** Under 10MB shows preview; over 10MB shows error modal (Your files are too powerful, Max file size is 10 MB)
    `);

    await AllureReporter.step('Open Clan Settings → Community', async () => {
      await clanPage.openClanSettings();
      await clanSettingsPage.clickSettingClanSection('Enable Community');
      await clanSettingsPage.openCommunityModal();
    });

    const under10MbBanner = await fileSizeHelpers.createFileWithSize(
      'community_banner_under_10mb',
      9 * 1024 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload community banner under limit (9MB)', async () => {
      const result = await fileSizeHelpers.uploadCommunityBannerAndVerify(under10MbBanner, true);
      expect(result.success).toBe(true);
    });
    await fileSizeHelpers.cleanupFiles([under10MbBanner]);

    const over10MbBanner = await fileSizeHelpers.createFileWithSize(
      'community_banner_over_10mb',
      10 * 1024 * 1024 + 200 * 1024,
      'jpg'
    );
    await AllureReporter.step(
      'Upload community banner over limit (10.2MB) - should fail',
      async () => {
        const result = await fileSizeHelpers.uploadCommunityBannerAndVerify(over10MbBanner, false);
        expect(result.success).toBe(false);
        expect(result.errorMessage?.toLowerCase()).toMatch('max file size is 10 mb, please!');
      }
    );
    await fileSizeHelpers.cleanupFiles([over10MbBanner]);
  });

  test('Validate Channel Webhook avatar size limit (8MB) @WebhookAvatarChannel', async () => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Channel Webhook avatar upload enforces 8MB limit
      
      **Test Steps:**
      1. Open Clan Settings → Integrations → Webhooks
      2. Upload image under 8MB (should succeed)
      3. Upload image over 8MB (should show error modal)
      
      **Expected Result:** Under 8MB uploads successfully; over 8MB shows "Your files are too powerful" with "Max file size is 8 MB"
    `);

    await AllureReporter.step('Open Integrations → Channel Webhooks list', async () => {
      await clanPage.openChannelSettings('general');
      await channelSettingPage.createChannelWebhook();
    });

    const under8MbClan = await fileSizeHelpers.createFileWithSize(
      'clan_webhook_avatar_under_8mb',
      7 * 1024 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload clan webhook avatar under limit (7MB)', async () => {
      const result = await fileSizeHelpers.uploadChannelWebhookAvatarAndVerify(under8MbClan, true);
      expect(result.success).toBe(true);
    });
    await fileSizeHelpers.cleanupFiles([under8MbClan]);

    const over8MbClan = await fileSizeHelpers.createFileWithSize(
      'clan_webhook_avatar_over_8mb',
      8 * 1024 * 1024 + 200 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload clan webhook avatar under limit (7MB)', async () => {
      const result = await fileSizeHelpers.uploadChannelWebhookAvatarAndVerify(over8MbClan, true);
      expect(result.success).toBe(false);
      expect(result.errorMessage?.toLowerCase()).toMatch('max file size is 8 mb, please!');
    });
    await fileSizeHelpers.cleanupFiles([over8MbClan]);
  });

  test('Validate Clan Webhook avatar size limit (8MB) @ClanWebhookAvatar', async () => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Clan Webhook avatar upload enforces 8MB limit
      
      **Test Steps:**
      1. Open Clan Settings → Integrations → Clan Webhooks
      2. Upload image under 8MB (should succeed)
      3. Upload image over 8MB (should show error modal)
      
      **Expected Result:** Under 8MB uploads successfully; over 8MB shows "Your files are too powerful" with "Max file size is 8 MB"
    `);

    await AllureReporter.step('Open Integrations → Clan Webhooks list', async () => {
      await clanPage.openClanSettings();
      await clanSettingsPage.clickSettingClanSection('Integrations');
      await clanSettingsPage.createClanWebhookButton();
    });

    const under8MbClan = await fileSizeHelpers.createFileWithSize(
      'clan_webhook_avatar_under_8mb',
      7 * 1024 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload clan webhook avatar under limit (7MB)', async () => {
      const result = await fileSizeHelpers.uploadClanWebhookAvatarAndVerify(under8MbClan, true);
      expect(result.success).toBe(true);
    });
    await fileSizeHelpers.cleanupFiles([under8MbClan]);

    const over8MbClan = await fileSizeHelpers.createFileWithSize(
      'clan_webhook_avatar_over_8mb',
      8 * 1024 * 1024 + 200 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload clan webhook avatar under limit (7MB)', async () => {
      const result = await fileSizeHelpers.uploadClanWebhookAvatarAndVerify(over8MbClan, true);
      expect(result.success).toBe(false);
      expect(result.errorMessage?.toLowerCase()).toMatch('max file size is 8 mb, please!');
    });
    await fileSizeHelpers.cleanupFiles([over8MbClan]);
  });
});
