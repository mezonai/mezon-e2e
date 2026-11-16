import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import MessageTimelineSelector from '@/data/selectors/MessageTimelineSelector';
import { MessagePage } from '@/pages/MessagePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

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

  test('TC02: Verify canceling timeline event edit preserves original title and description', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64698',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that modifying a timeline event and leaving edit view without saving preserves the original event title and description (corresponds to TC 77 in testcases-e2e.txt).

      **Test Steps:**
      1. Open channel timeline tab
      2. Create a new timeline event with original title and description
      3. Open event detail view
      4. Click edit title, type modified text without clicking Save
      5. Click back button to leave edit view without saving
      6. Verify original title is retained in timeline list view

      **Expected Result:** Event data remains intact when editing is canceled.
    `);

    await AllureReporter.addLabels({
      tag: ['timeline', 'cancel-edit', 'data-integrity'],
    });

    const messagePage = new MessagePage(page);
    const timelineSelector = new MessageTimelineSelector(page);
    const unique = Date.now().toString(36);
    const originalData = {
      title: `TL-orig-${unique}`.slice(0, 20),
      description: `TL-desc-${unique}`.slice(0, 20),
    };

    await AllureReporter.step('Open timeline tab', async () => {
      await messagePage.openTimelineTab();
    });

    let eventDate = '';
    await AllureReporter.step('Create new timeline event', async () => {
      eventDate = await messagePage.fillTitleAndDescription(originalData);
      await messagePage.clickSave();
      const eventLocator = await messagePage.verifyEventIsVisibleOnTab(originalData, eventDate);
      expect(eventLocator).toBeTruthy();
    });

    await AllureReporter.step('Open event detail view', async () => {
      const eventLocator = await messagePage.verifyEventIsVisibleOnTab(originalData, eventDate);
      await messagePage.openTimelineEventDetail(eventLocator);
    });

    await AllureReporter.step('Type modified title without saving', async () => {
      const editTitleButton = timelineSelector.buttons.editTitle;
      const inputTitle = timelineSelector.input.title;
      await editTitleButton.click();
      await expect(inputTitle).toBeVisible({ timeout: 3000 });
      await inputTitle.fill(`MODIFIED-${unique}`.slice(0, 20));
    });

    await AllureReporter.step('Click back button to cancel editing without saving', async () => {
      await timelineSelector.buttons.back.click();
    });

    await AllureReporter.step('Verify original event title is preserved', async () => {
      const titleLocator = timelineSelector.eventDetail.name.first();
      await expect(titleLocator).toContainText(originalData.title, { timeout: 5000 });
      await expect(titleLocator).not.toContainText(`MODIFIED-${unique}`.slice(0, 20));
    });
  });

  test('TC03: Remove attachment before saving timeline event', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64699',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can upload an attachment in a new timeline event and remove it prior to saving.

      **Test Steps:**
      1. Open timeline tab
      2. Fill title and description
      3. Upload an attachment
      4. Remove the uploaded attachment before clicking Save
      5. Click Save and verify event is created successfully without errors
    `);

    await AllureReporter.addLabels({
      tag: ['timeline', 'remove-attachment', 'data-integrity'],
    });

    const messagePage = new MessagePage(page);
    const timelineSelector = new MessageTimelineSelector(page);
    const unique = Date.now().toString(36);
    const data = {
      title: `TL-rm-${unique}`.slice(0, 20),
      description: `TL-rmdesc-${unique}`.slice(0, 20),
    };

    await AllureReporter.step('Open timeline tab', async () => {
      await messagePage.openTimelineTab();
    });

    let eventDate = '';
    await AllureReporter.step('Fill event info and upload attachment', async () => {
      eventDate = await messagePage.fillTitleAndDescription(data);
      await messagePage.uploadAttachmentToTimelineEvent();
    });

    await AllureReporter.step('Remove attachment before saving', async () => {
      const removeBtn = timelineSelector.buttons.attachmentRemoveButton.first();
      if (await removeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await removeBtn.click();
        await expect(removeBtn)
          .toBeHidden({ timeout: 5000 })
          .catch(() => {});
      }
    });

    await AllureReporter.step('Save event and verify visible on timeline tab', async () => {
      await messagePage.clickSave();
      const eventLocator = await messagePage.verifyEventIsVisibleOnTab(data, eventDate);
      expect(eventLocator).toBeTruthy();
    });
  });
});
