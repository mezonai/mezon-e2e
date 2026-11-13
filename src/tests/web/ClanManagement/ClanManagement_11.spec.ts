import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Sidebar Navigation and Settings Exit', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account4;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.clanManagement2,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63510' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('Verify member list toggle, event modal opening, and clan settings exit', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64691',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can toggle the clan member list, open the events panel, and cleanly exit clan settings.

      **Test Steps:**
      1. Toggle the member list sidebar from the sidebar button
      2. Verify member list search or container is displayed
      3. Open the event modal from the sidebar event button
      4. Verify event modal is visible and close it
      5. Open Clan Settings
      6. Exit Clan Settings using exit button
      7. Verify Clan Settings is closed and main interface is restored

      **Expected Result:** Sidebar panels open correctly and settings exit button dismisses the settings view.
    `);

    await AllureReporter.addLabels({
      tag: ['clan-management', 'member-list-toggle', 'event-panel', 'settings-exit'],
    });

    const clanPage = new ClanPage(page);

    await AllureReporter.step('Toggle clan member list from sidebar', async () => {
      await clanPage.openMemberListSetting();
      await expect(clanPage.selector.memberSettings.searchInput).toBeVisible({ timeout: 5000 });
    });

    await AllureReporter.step('Open events modal from sidebar and close it', async () => {
      await clanPage.selector.buttons.eventButton.click();
      const eventModal = clanPage.selector.createEventModal.modalStart;
      await expect(eventModal).toBeVisible({ timeout: 5000 });

      const closeEventBtn = clanPage.selector.createEventModal.button.closeContainerModal;
      if (await closeEventBtn.isVisible({ timeout: 2000 })) {
        await closeEventBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await expect(eventModal).toBeHidden({ timeout: 5000 });
    });

    await AllureReporter.step('Open Clan Settings and exit cleanly', async () => {
      await clanPage.openClanSettings();
      await expect(clanPage.selector.clanSettings.settings_page).toBeVisible({ timeout: 10000 });

      const exitBtn = clanPage.selector.buttons.exitSettings.or(
        clanPage.selector.buttons.closeSettingClan
      );
      await exitBtn.click();
      await expect(clanPage.selector.clanSettings.settings_page).toBeHidden({ timeout: 5000 });
    });
  });

  test('TC02: Open Channels management overview from sidebar and return to channel list', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64692',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can open Channels overview from the clan sidebar and return to channel chat view.

      **Test Steps:**
      1. Click Channels button on the clan sidebar
      2. Verify Channel Management overview and total channels header are displayed
      3. Click general channel in sidebar to return
      4. Verify message composer is visible and channel chat is restored

      **Expected Result:** Navigation to Channel Management and back operates smoothly.
    `);

    await AllureReporter.addLabels({
      tag: ['clan-management', 'channels-overview', 'sidebar-navigation'],
    });

    const clanPage = new ClanPage(page);

    await AllureReporter.step('Open Channels management overview from sidebar', async () => {
      await clanPage.openChannelsListSetting();
      await expect(clanPage.selector.channelManagement.totalChannels).toBeVisible({
        timeout: 5000,
      });
    });

    await AllureReporter.step(
      'Return to channel by clicking general channel in sidebar',
      async () => {
        await clanPage.openChannelByName('general');
        await expect(page.locator('[data-e2e="mention-input"]')).toBeVisible({ timeout: 10000 });
      }
    );
  });
});
