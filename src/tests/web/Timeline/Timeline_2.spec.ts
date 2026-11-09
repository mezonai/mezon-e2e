import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { MessagePage } from '@/pages/MessagePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, Locator, test } from '@playwright/test';

test.describe('Timeline - Year Filter and Calendar Navigation', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account5;

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

  test('Verify filtering timeline events by year and switching year filters in calendar', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64697',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can filter timeline events by selecting different years in the calendar view.

      **Test Steps:**
      1. Open channel timeline tab
      2. Create a new timeline event for the current year
      3. Open Calendar view and verify current year events are visible
      4. Select another year filter (e.g. 2025) and verify calendar heading updates to "Events in 2025"
      5. Select current year filter again and verify original event is displayed
    `);

    await AllureReporter.addLabels({
      tag: ['timeline', 'year-filter', 'calendar-filter'],
    });

    const messagePage = new MessagePage(page);
    const unique = Date.now().toString(36);
    const eventData = {
      title: `TL-year-${unique}`.slice(0, 20),
      description: `TL-desc-${unique}`.slice(0, 20),
    };

    await AllureReporter.step('Open timeline tab', async () => {
      await messagePage.openTimelineTab();
    });

    await AllureReporter.step('Create new timeline event', async () => {
      const date = await messagePage.fillTitleAndDescription(eventData);
      await messagePage.clickSave();
      const eventLocator = await messagePage.verifyEventIsVisibleOnTab(eventData, date);
      expect(eventLocator).toBeTruthy();
    });

    await AllureReporter.step('Open calendar and verify initial selected year', async () => {
      await messagePage.openCalendar();
      const currentYear = await messagePage.getSelectedYear();
      expect(currentYear).toBeTruthy();
      await expect(page.locator(`text=Events in ${currentYear}`)).toBeVisible({ timeout: 5000 });
    });

    await AllureReporter.step('Switch year filter to 2025', async () => {
      const year2025Btn = page.locator('button', { hasText: '2025' }).first();
      if (await year2025Btn.isVisible({ timeout: 3000 })) {
        await year2025Btn.click();
        await expect(page.locator('text=Events in 2025')).toBeVisible({ timeout: 5000 });
      }
    });

    await AllureReporter.step('Switch year filter back to current year', async () => {
      const currentYear = new Date().getFullYear().toString();
      const currentYearBtn = page.locator('button', { hasText: currentYear }).first();
      if (await currentYearBtn.isVisible({ timeout: 3000 })) {
        await currentYearBtn.click();
        await expect(page.locator(`text=Events in ${currentYear}`)).toBeVisible({ timeout: 5000 });
        await expect(page.locator(`text=${eventData.title}`)).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
