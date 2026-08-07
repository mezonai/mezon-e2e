import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ProfilePage } from '@/pages/ProfilePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { FileSizeTestHelpers, UploadType } from '@/utils/uploadFileHelpers';
import { BrowserContext, expect, Page, test, TestInfo } from '@playwright/test';

test.describe('File Upload Limits - Events, Onboarding, Banners, Webhooks, and DMs', () => {
  let fileSizeHelpers: FileSizeTestHelpers;
  let profilePage: ProfilePage;
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
      profilePage = new ProfilePage(page);
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
  test('Validate Direct Message Icon (1MB)', async ({ page }) => {
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
      await page.reload({ waitUntil: 'domcontentloaded' });
    });
  });
});
