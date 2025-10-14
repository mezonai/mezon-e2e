import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import joinUrlPaths from '@/utils/joinUrlPaths';
import pressEsc from '@/utils/pressEsc';
import { FileSizeTestHelpers, UploadType } from '@/utils/uploadFileHelpers';
import { BrowserContext, expect, Page, test } from '@playwright/test';
import { ProfilePage } from '../../../pages/ProfilePage';

test.describe('File Size Limits Validation', () => {
  let fileSizeHelpers: FileSizeTestHelpers;
  let profilePage: ProfilePage;
  let clanPage: ClanPageV2;
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account9);
    await clanFactory.setupClan(ClanSetupHelper.configs.uploadFile, page);

    clanFactory.setClanUrl(
      joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, splitDomainAndPath(clanFactory.getClanUrl()).path)
    );
    await context.close();
  });

  test.beforeEach(async ({ page, context }: { page: Page; context: BrowserContext }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account9
    );
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);

    fileSizeHelpers = new FileSizeTestHelpers(page);
    profilePage = new ProfilePage(page);
    clanPage = new ClanPageV2(page);
  });

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

  test('Validate image attachment file size limit (50MB)', async ({ page }) => {
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
      await pressEsc(page);
    });

    const largeImagePath = await fileSizeHelpers.createFileWithSize(
      'large_image',
      60 * 1024 * 1024,
      'jpg'
    );

    await AllureReporter.step(`Test upload large image (60MB) - should fail`, async () => {
      const result = await fileSizeHelpers.uploadFileAndVerify(largeImagePath, false);
      expect(result.success).toBe(false);
      expect(result.errorMessage).toMatch('Maximum allowed size is 50MB');
      await pressEsc(page);
    });
  });

  // test('Validate video and other file types size limit (100MB)', async ({ page }) => {
  //   await AllureReporter.addDescription(`
  //     **Test Objective:** Verify that video and other file types are limited to 100MB

  //     **Test Steps:**
  //     1. Create video file under 100MB (should succeed)
  //     2. Create video file over 100MB (should fail)
  //     3. Test other file types with same limits

  //     **Expected Result:** Files under 100MB upload successfully, files over 100MB are rejected
  //   `);

  //   const smallVideoPath = await fileSizeHelpers.createFileWithSize(
  //     'small_video',
  //     80 * 1024 * 1024,
  //     'mp4'
  //   );

  //   await AllureReporter.step(`Test upload small video (80MB)`, async () => {
  //     const result = await fileSizeHelpers.uploadFileAndVerify(smallVideoPath, true);

  //     expect(result.success).toBe(true);
  //     expect(result.fileSize).toBe(80 * 1024 * 1024);
  //   });

  //   const largeVideoPath = await fileSizeHelpers.createFileWithSize(
  //     'large_video',
  //     120 * 1024 * 1024,
  //     'mp4'
  //   );

  //   await AllureReporter.step(`Test upload large video (120MB) - should fail`, async () => {
  //     const result = await fileSizeHelpers.uploadFileAndVerify(largeVideoPath, false);

  //     expect(result.success).toBe(false);
  //     expect(result.errorMessage?.toLowerCase()).toMatch('maximum allowed size is 100mb');
  //   });

  //   const largePdfPath = await fileSizeHelpers.createFileWithSize(
  //     'large_document',
  //     120 * 1024 * 1024,
  //     'pdf'
  //   );

  //   await AllureReporter.step(`Test upload large PDF (120MB) - should fail`, async () => {
  //     const result = await fileSizeHelpers.uploadFileAndVerify(largePdfPath, false);

  //     expect(result.success).toBe(false);
  //     expect(result.errorMessage?.toLowerCase()).toMatch('maximum allowed size is 100mb');
  //     await pressEsc(page);
  //   });
  // });

  test('Validate User Profile avatar size limit (10MB)', async ({ page }) => {
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

    const largeAvatarPath = await fileSizeHelpers.createFileWithSize(
      'large_avatar',
      15 * 1024 * 1024,
      'jpg'
    );

    await AllureReporter.step(`Test upload large avatar (15MB) - should fail`, async () => {
      const result = await fileSizeHelpers.uploadFileAndVerify(largeAvatarPath, false);
      expect(result.success).toBe(false);
      expect(result.errorMessage?.toLowerCase()).toMatch('max file size is 10 mb, please!');
      await pressEsc(page);
    });
  });

  test('Validate Clan Profile avatar size limit (10MB)', async ({ page }) => {
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

    const largeClanAvatarPath = await fileSizeHelpers.createFileWithSize(
      'large_clan_avatar',
      12 * 1024 * 1024,
      'jpg'
    );

    await AllureReporter.step(`Test upload large clan avatar (12MB) - should fail`, async () => {
      const result = await fileSizeHelpers.uploadFileAndVerify(largeClanAvatarPath, false);

      expect(result.success).toBe(false);
      expect(result.errorMessage?.toLowerCase()).toMatch('max file size is 10 mb, please!');
      await pressEsc(page);
    });
  });

  test('Validate Clan Avatar size limit (1MB)', async ({ page }) => {
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
      const result = await fileSizeHelpers.uploadByTypeAndVerify(
        underLimitPath,
        UploadType.CLAN_LOGO,
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
          UploadType.CLAN_LOGO,
          false
        );

        expect(result.success).toBe(false);
        expect(result.errorMessage?.toLowerCase()).toMatch(
          /(your files are too powerful|upload size limit exceeded|max file size)/
        );
        await pressEsc(page);
      }
    );
  });
});
