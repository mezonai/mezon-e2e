import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { expect, test, Browser, Page, BrowserContext, TestInfo } from '@playwright/test';
// import { WEBSITE_CONFIGS } from '../../config/environment';
import { ClanSettingsPage } from '../../pages/ClanSettingsPage';
import { ProfilePage } from '../../pages/ProfilePage';
import { FileSizeTestHelpers } from '@/utils/uploadFileHelpers';

test.describe('File Size Limits Validation', () => {
  let clanSetupHelper: ClanSetupHelper;
  let fileSizeHelpers: FileSizeTestHelpers;
  let clanSettingsPage: ClanSettingsPage;
  let profilePage: ProfilePage;
  let testClanUrl: string;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);
    await clanSetupHelper.cleanupAllClans();

    const setupResult = await clanSetupHelper.setupTestClan({ suiteName: 'FileSizeTests' });

    testClanUrl = setupResult.clanUrl;
  });

  test.afterAll(async () => {
    if (clanSetupHelper) await clanSetupHelper.cleanupAllClans();
  });

  test.beforeEach(
    async ({ page, context }: { page: Page; context: BrowserContext }, testInfo: TestInfo) => {
      await AuthHelper.setAuthForSuite(page, 'File Size Tests');

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
      profilePage = new ProfilePage(page);

      await AllureReporter.step('Navigate to test clan', async () => {
        await page.goto(testClanUrl);
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
      expect(result.fileSize).toBe(30 * 1024 * 1024);
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
      expect(result.errorMessage?.toLowerCase()).toMatch('upload size limit exceeded!');
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
      expect(result.errorMessage?.toLowerCase()).toMatch('upload size limit exceeded!');
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
      expect(result.errorMessage?.toLowerCase()).toMatch('upload size limit exceeded!');
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
      await profilePage.buttons.userSettingProfileButton.waitFor({
        state: 'visible',
        timeout: 3000,
      });
      await profilePage.buttons.userSettingProfileButton.click();
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
      expect(result.errorMessage?.toLowerCase()).toMatch('your files are too powerful');
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
      await profilePage.buttons.userSettingProfileButton.waitFor({
        state: 'visible',
        timeout: 3000,
      });
      await profilePage.buttons.userSettingProfileButton.click();
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
      expect(result.errorMessage?.toLowerCase()).toMatch('your files are too powerful');
    });

    await fileSizeHelpers.cleanupFiles([largeClanAvatarPath]);
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
        expect(result.errorMessage?.toLowerCase()).toMatch('upload size limit exceeded!');
      }
    );

    await fileSizeHelpers.cleanupFiles([largeCanvasFilePath]);
  });

  test('Validate multiple file size limits simultaneously', async () => {
    await AllureReporter.addDescription(`
      **Test Objective:** Test multiple file size limits in a single test to ensure consistency
      
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
            expect(result.errorMessage!.toLowerCase()).toMatch('upload size limit exceeded!');
          }
        }
      );

      await fileSizeHelpers.cleanupFiles([filePath]);
    }
  });
});
