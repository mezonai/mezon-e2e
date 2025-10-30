import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { MessagePage } from '@/pages/MessagePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { FileSizeTestHelpers, UploadType } from '@/utils/uploadFileHelpers';
import { BrowserContext, expect, Page, test, TestInfo } from '@playwright/test';

test.describe('File Size Limits Validation - Module 4', () => {
  let fileSizeHelpers: FileSizeTestHelpers;
  let messagePage: MessagePage;
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    //This test need account have friends to create group chat
    await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account4);
    await clanFactory.setupClan(ClanSetupHelper.configs.uploadFile4, page);

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
        AccountCredentials.account4
      );
      await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);

      fileSizeHelpers = new FileSizeTestHelpers(page);
      messagePage = new MessagePage(page);
    }
  );

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account4
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

  test('Validate Group Avatar (8MB)', async ({ page }) => {
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
      await page.reload({ waitUntil: 'domcontentloaded' });
    });
  });
});
