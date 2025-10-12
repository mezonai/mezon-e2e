import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { MessagePage } from '@/pages/MessagePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { FileSizeTestHelpers, UploadType } from '@/utils/uploadFileHelpers';
import { BrowserContext, expect, Page, test, TestInfo } from '@playwright/test';
import { ClanSettingsPage } from '../../../pages/ClanSettingsPage';
import { ProfilePage } from '../../../pages/ProfilePage';

test.describe('File Size Limits Validation - Module 3', () => {
  let fileSizeHelpers: FileSizeTestHelpers;
  let clanSettingsPage: ClanSettingsPage;
  let channelSettingPage: ChannelSettingPage;
  let messagePage: MessagePage;
  let profilePage: ProfilePage;
  let clanPage: ClanPageV2;
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account9);
    await clanFactory.setupClan(ClanSetupHelper.configs.uploadFile3, page);

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
      channelSettingPage = new ChannelSettingPage(page);
      messagePage = new MessagePage(page);
      profilePage = new ProfilePage(page);
      clanPage = new ClanPageV2(page);
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
    await AuthHelper.logout(page);
    await context.close();
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
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
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        under1MbPath,
        UploadType.EVENT_IMAGE_COVER,
        true
      );
      expect(result.success).toBe(true);
    });
    await fileSizeHelpers.cleanupFiles([under1MbPath]);

    const over1MbPath = await fileSizeHelpers.createFileWithSize(
      'event_cover_over_1mb',
      1 * 1024 * 1024 + 200 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload event cover over limit (1.2MB) - should fail', async () => {
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        over1MbPath,
        UploadType.EVENT_IMAGE_COVER,
        false
      );
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
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        under10Mb,
        UploadType.ONBOARDING_RESOURCE,
        true
      );
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
        const result = await fileSizeHelpers.uploadByTypeAndVerify(
          over10Mb,
          UploadType.ONBOARDING_RESOURCE,
          false
        );
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
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        under10MbBanner,
        UploadType.COMMUNITY_BANNER,
        true
      );
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
        const result = await fileSizeHelpers.uploadByTypeAndVerify(
          over10MbBanner,
          UploadType.COMMUNITY_BANNER,
          false
        );
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
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        under8MbClan,
        UploadType.CHANNEL_WEBHOOK_AVATAR,
        true
      );
      expect(result.success).toBe(true);
    });
    await fileSizeHelpers.cleanupFiles([under8MbClan]);

    const over8MbClan = await fileSizeHelpers.createFileWithSize(
      'clan_webhook_avatar_over_8mb',
      8 * 1024 * 1024 + 200 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload clan webhook avatar under limit (7MB)', async () => {
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        over8MbClan,
        UploadType.CHANNEL_WEBHOOK_AVATAR,
        false
      );
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
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        under8MbClan,
        UploadType.CLAN_WEBHOOK_AVATAR,
        true
      );
      expect(result.success).toBe(true);
    });
    await fileSizeHelpers.cleanupFiles([under8MbClan]);

    const over8MbClan = await fileSizeHelpers.createFileWithSize(
      'clan_webhook_avatar_over_8mb',
      8 * 1024 * 1024 + 200 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload clan webhook avatar under limit (7MB)', async () => {
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        over8MbClan,
        UploadType.CLAN_WEBHOOK_AVATAR,
        false
      );
      expect(result.success).toBe(false);
      expect(result.errorMessage?.toLowerCase()).toMatch('max file size is 8 mb, please!');
    });
    await fileSizeHelpers.cleanupFiles([over8MbClan]);
  });

  test('Validate Group Avatar (8MB)', async () => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Group Avatar upload enforces 8MB limit

      **Test Steps:**
      1. Open User Settings -> Profiles
      2. Upload image under 8MB (should succeed)
      3. Upload image over 8MB (should show error modal)

      **Expected Result:** Under 8MB uploads successfully; over 8MB shows "Your files are too powerful" with "Max file size is 8 MB"
    `);

    await AllureReporter.step('Create a group chat and open edit group modal', async () => {
      await messagePage.gotoDMPage();
      await messagePage.createGroup();
      await messagePage.clickEditButton();
    });

    const under8MbGroupAvt = await fileSizeHelpers.createFileWithSize(
      'direct_message_icon_under_8mb',
      7 * 1024 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload direct message icon under limit (7MB)', async () => {
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        under8MbGroupAvt,
        UploadType.GROUP_AVATAR,
        true
      );
      expect(result.success).toBe(true);
    });
    await fileSizeHelpers.cleanupFiles([under8MbGroupAvt]);

    const over8MbDirectMessage = await fileSizeHelpers.createFileWithSize(
      'direct_message_icon_over_8mb',
      10 * 1024 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload direct message icon over limit (8MB)', async () => {
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        over8MbDirectMessage,
        UploadType.GROUP_AVATAR,
        false
      );
      expect(result.success).toBe(false);
      expect(result.errorMessage?.toLowerCase()).toMatch('max file size is 8 mb, please!');
    });
    await fileSizeHelpers.cleanupFiles([over8MbDirectMessage]);
  });

  test('Validate Direct Message Icon (1MB)', async () => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Direct Message Icon upload enforces 1MB limit

      **Test Steps:**
      1. Open User Settings -> Profiles
      2. Upload image under 1MB (should succeed)
      3. Upload image over 1MB (should show error modal)

      **Expected Result:** Under 1MB uploads successfully; over 1MB shows "Your files are too powerful" with "Max file size is 1 MB"
    `);

    await AllureReporter.step('Open Integrations → Clan Webhooks list', async () => {
      await profilePage.openUserSettingProfile();
      await profilePage.openProfileTab();
      await profilePage.openUserProfileTab();
    });

    const under1MbDirectMessage = await fileSizeHelpers.createFileWithSize(
      'direct_message_icon_under_1mb',
      700 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload direct message icon under limit (700KB)', async () => {
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        under1MbDirectMessage,
        UploadType.DIRECT_MESSAGE_ICON,
        true
      );
      expect(result.success).toBe(true);
    });
    await fileSizeHelpers.cleanupFiles([under1MbDirectMessage]);

    const over1MbDirectMessage = await fileSizeHelpers.createFileWithSize(
      'direct_message_icon_over_1mb',
      1 * 1024 * 1024 + 200 * 1024,
      'jpg'
    );
    await AllureReporter.step('Upload direct message icon over limit (1MB)', async () => {
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        over1MbDirectMessage,
        UploadType.DIRECT_MESSAGE_ICON,
        false
      );
      expect(result.success).toBe(false);
      expect(result.errorMessage?.toLowerCase()).toMatch('max file size is 1 mb, please!');
    });
    await fileSizeHelpers.cleanupFiles([over1MbDirectMessage]);
  });
});
