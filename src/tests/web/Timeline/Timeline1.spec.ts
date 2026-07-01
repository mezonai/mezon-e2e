import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, MEZON_DEV } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { MessagePage } from '@/pages/MessagePage';
import { MezonCredentials } from '@/types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { Locator, test } from '@playwright/test';

test.describe('Timeline 1', () => {
  const clanFactory = new ClanFactory();
  const credentials: MezonCredentials = AccountCredentials.account5;
  const [userNameA] = getUsernamesFromEmails([credentials.email]);

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.timeline,
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

    const messagePage = new MessagePage(page);
    const unique = Date.now().toString(36);
    const data = {
      title: `Timeline-title-${unique}`.slice(0, 20),
      description: `Timeline-description-${unique}`.slice(0, 20),
    };
    let date: string;

    await AllureReporter.step(`Open timeline tab`, async () => {
      await messagePage.openTimelineTab();
      await page.waitForTimeout(1500);
    });

    await AllureReporter.step('Create First event', async () => {
      const dateData = await messagePage.fillTitleAndDescription(data);
      await messagePage.clickSave();
      date = dateData;
    });

    await AllureReporter.step('Verify event is visble on tab', async () => {
      await messagePage.verifyEventIsVisibleOnTab(data, date);
    });

    await AllureReporter.attachScreenshot(page, `Timeline is created`);
  });

  test('Verify that user can update timeline', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can update a timeline

      **Test Steps:**
      1. Open timeline tab
      2. Click create
      3. Fill data
      4. Save
      5. Verify data is visible
      6. Update timeline

      **Expected Result:** User can update a timeline
    `);

    await AllureReporter.addLabels({
      tag: ['timeline', 'update'],
    });

    const messagePage = new MessagePage(page);
    const unique = Date.now().toString(36);
    const data = {
      title: `Timeline-title-${unique}`.slice(0, 20),
      description: `Timeline-description-${unique}`.slice(0, 20),
    };
    let date: string;

    await AllureReporter.step(`Open timeline tab`, async () => {
      await messagePage.openTimelineTab();
      await page.waitForTimeout(1500);
    });

    await AllureReporter.step('Create First event', async () => {
      const dateData = await messagePage.fillTitleAndDescription(data);
      await messagePage.clickSave();
      date = dateData;
    });
    let detailLocator: Locator;
    await AllureReporter.step('Verify event is visble on tab', async () => {
      const locator = await messagePage.verifyEventIsVisibleOnTab(data, date);
      detailLocator = locator;
    });

    await AllureReporter.step('Open timeline detail', async () => {
      await messagePage.openTimelineEventDetail(detailLocator);
    });
    let updatedData: {
      title: string;
      description: string;
    };
    await AllureReporter.step('Update title and description', async () => {
      const data = await messagePage.updatetimeline();
      updatedData = data;
    });

    await AllureReporter.step('Verify event is visble on tab with updated data', async () => {
      await messagePage.verifyEventIsVisibleOnTab(updatedData, date);
    });
  });

  test('Verify that user can upload attachments to a timeline', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can upload attachments to a timeline

      **Test Steps:** 
      1. Open timeline tab
      2. Click create
      3. Fill data
      4. Save
      5. Verify data is visible
      6. Upload attachment
      7. Verify attachment is uploaded
      **Expected Result:** User can upload attachments to a timeline
    `);

    await AllureReporter.addLabels({
      tag: ['timeline', 'attachment'],
    });

    const messagePage = new MessagePage(page);
    const unique = Date.now().toString(36);
    const data = {
      title: `Timeline-title-${unique}`.slice(0, 20),
      description: `Timeline-description-${unique}`.slice(0, 20),
    };
    let date: string;

    await AllureReporter.step(`Open timeline tab`, async () => {
      await page.goto(joinUrlPaths(MEZON_DEV || '', clanFactory.getClanExcludeDomain()));
      await page.waitForTimeout(1500);
      await messagePage.openTimelineTab();
      await page.waitForTimeout(1500);
    });

    await AllureReporter.step('Create First event', async () => {
      const dateData = await messagePage.fillTitleAndDescription(data);
      await messagePage.uploadAttachmentToTimelineEvent();
      await messagePage.clickSave();
      date = dateData;
    });
    let detailLocator: Locator;
    await AllureReporter.step('Verify event is visble on tab', async () => {
      const locator = await messagePage.verifyEventIsVisibleOnTab(data, date);
      detailLocator = locator;
    });
    await AllureReporter.step('Open timeline detail', async () => {
      await messagePage.openTimelineEventDetail(detailLocator);
    });
  });

  test('Verify that user can view timeline event on calendar', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    const messagePage = new MessagePage(page);

    const unique = Date.now().toString(36);
    const data = {
      title: `Timeline-title-${unique}`.slice(0, 20),
      description: `Timeline-description-${unique}`.slice(0, 20),
    };

    let date: string;
    let year: string;

    await AllureReporter.step(`Open timeline tab`, async () => {
      await messagePage.openTimelineTab();
      await page.waitForTimeout(1500);
    });

    await AllureReporter.step(`Create timeline event`, async () => {
      const dateData = await messagePage.fillTitleAndDescription(data);
      await messagePage.clickSave();
      date = dateData;
    });

    await AllureReporter.step(`Open calendar`, async () => {
      await messagePage.openCalendar();
    });

    await AllureReporter.step(`Get selected year`, async () => {
      year = await messagePage.getSelectedYear();
    });

    await AllureReporter.step(`Verify event is visible in calendar`, async () => {
      await messagePage.verifyEventInCalendar(data, date, year);
    });
  });
});
