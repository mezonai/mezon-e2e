import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { MessagePage } from '@/pages/MessagePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { FileSizeTestHelpers } from '@/utils/uploadFileHelpers';
import { BrowserContext, expect, Page, test, TestInfo } from '@playwright/test';

test.describe('File Uploads - Group Avatars and Timeline Attachments', () => {
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
      1. Create a group chat and open its edit modal from the header
      2. Upload a 7MB image (should succeed)
      3. Upload a 10MB image (should show the 8MB limit error)

      **Expected Result:** The 7MB image is accepted into the avatar preview; the 10MB image is rejected with "Max file size is 8 MB".
    `);

    await AllureReporter.step('Create a group chat and open edit group modal', async () => {
      await messagePage.gotoDMPage();
      await messagePage.createGroup();
      await messagePage.clickEditButton();
    });
    const avatarInput = page.locator(
      generateE2eSelector('chat.direct_message.edit_group.upload.avatar_group_input')
    );

    const under8MbGroupAvt = await fileSizeHelpers.createFileWithSize(
      'direct_message_icon_under_8mb',
      7 * 1024 * 1024,
      'png'
    );
    await AllureReporter.step('Upload direct message icon under limit (7MB)', async () => {
      await avatarInput.setInputFiles(under8MbGroupAvt);
      const avatarPreview = page
        .locator(generateE2eSelector('chat.direct_message.edit_group'))
        .getByRole('img', { name: 'Group', exact: true });
      await expect(avatarPreview).toHaveAttribute('src', /^data:image\/png;base64,/);
      await expect(page.locator(generateE2eSelector('modal.validate_file'))).toHaveCount(0);
    });

    const over8MbDirectMessage = await fileSizeHelpers.createFileWithSize(
      'direct_message_icon_over_8mb',
      10 * 1024 * 1024,
      'png'
    );
    await AllureReporter.step('Upload group avatar over limit (10MB)', async () => {
      await avatarInput.setInputFiles(over8MbDirectMessage);
      await expect(page.locator(generateE2eSelector('modal.validate_file'))).toBeVisible();
      await expect(page.locator(generateE2eSelector('modal.validate_file.content'))).toHaveText(
        /max file size is 8 mb, please!/i
      );
      await page.reload({ waitUntil: 'domcontentloaded' });
    });
  });
});
