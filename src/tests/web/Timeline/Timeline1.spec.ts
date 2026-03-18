import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import MessageSelector from '@/data/selectors/MessageSelector';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { MezonCredentials } from '@/types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { test } from '@playwright/test';

test.describe('Timeline 1', () => {
  const clanFactory = new ClanFactory();
  const credentials: MezonCredentials = AccountCredentials.accountKien9;
  const [userNameA] = getUsernamesFromEmails([credentials.email]);

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.directMessage1,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63370',
    });

    await TestSuiteHelper.setupBeforeEach({
      page,
      clanFactory,
      credentials,
    });
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({
      browser,
      clanFactory,
      credentials,
    });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test('Verify that user can create a timeline', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can create a timeline

      **Test Steps:**
      1. Open timeline tab
      2. Click create
      3. Fill data
      4. Save
      5. Verify data is visible

      **Expected Result:** User can create a timeline
    `);

    await AllureReporter.addLabels({
      tag: ['timeline', 'create'],
    });

    const messageSelector = new MessageSelector(page);
    const clanPage = new ClanPage(page);
    const messagePage = new MessagePage(page);
    const messageHelper = new MessageTestHelpers(page);

    await AllureReporter.step(`Open timeline tab`, async () => {
      await page.waitForTimeout(1500);
    });

    await AllureReporter.step('Create First event', async () => {});

    await AllureReporter.step('Verify event is visble on tab', async () => {});

    await AllureReporter.step(
      'Verify invoice status is visible on friend list or DM header',
      async () => {}
    );

    await AllureReporter.attachScreenshot(page, `Timeline is created`);
  });
});
