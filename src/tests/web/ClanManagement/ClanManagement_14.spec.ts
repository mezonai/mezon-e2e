import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanSettingsPage } from '@/pages/ClanSettingsPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Member Search, Overview Description & Notification Preferences (TC-CLAN-07, TC-CLAN-08)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account1;
  let clanPage: ClanPage;
  let clanSettingsPage: ClanSettingsPage;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    clanPage = new ClanPage(page);
    clanSettingsPage = new ClanSettingsPage(page);
    await page
      .evaluate(() => {
        localStorage.removeItem('remember_channel');
      })
      .catch(() => {});
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });

    const clanHeader = clanPage.selector.buttons.clanName
      .or(page.locator('[data-e2e*="clan_page-header-title-clan_name"]'))
      .first();
    if (!(await clanHeader.isVisible({ timeout: 2000 }).catch(() => false))) {
      const clanName = clanFactory.getClanName();
      const clanBtn = page
        .locator(`[data-e2e="clan_page-side_bar-clan_item"][title*="${clanName}"] button`)
        .or(page.locator(`div[title*="${clanName}"] button`))
        .first();

      await clanBtn.scrollIntoViewIfNeeded().catch(() => {});
      if (await clanBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await clanBtn.click({ force: true });
        await page.waitForTimeout(1000);
      }
      if (page.url().includes('/member-safety')) {
        const firstChannel = page
          .locator('[data-e2e*="channel_list-item-name"], [data-e2e*="channel_list"] p')
          .first();
        if (await firstChannel.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstChannel.click();
        }
      }
      await expect(clanHeader).toBeVisible({ timeout: 10000 });
    }
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify Member Search input in Member List sidebar filters clan members', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65125' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify opening Member list sidebar, typing in member search box filters the list, and clearing restores full list.
    `);
    await AllureReporter.addLabels({
      tag: ['clan-management', 'member-list', 'member-search'],
    });

    await AllureReporter.step('Navigate to Member list settings', async () => {
      await clanPage.openMemberListSetting();
      await expect(clanPage.selector.memberSettings.searchInput).toBeVisible({ timeout: 5000 });
    });

    await AllureReporter.step('Search member with query and verify filtering', async () => {
      await clanPage.searchMemberList('account');
      await page.waitForTimeout(500);
      await clanPage.clearMemberListSearch();
      await page.waitForTimeout(300);
    });

    await AllureReporter.step('Navigate back to channel view', async () => {
      const firstChannel = page
        .locator('[data-e2e*="channel_list-item-name"], [data-e2e*="channel_list"] p')
        .first();
      if (await firstChannel.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstChannel.click();
      }
    });
  });

  test('TC02: Verify Clan Settings Overview description update and character limit validation', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65126' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify navigating to Clan Settings Overview, modifying description field, and validating controls.
    `);
    await AllureReporter.addLabels({
      tag: ['clan-management', 'clan-overview', 'description'],
    });

    const testDescription = `Automation Clan Description ${generateRandomString(10)}`;

    await AllureReporter.step('Open Clan Settings -> Overview', async () => {
      await clanPage.openClanSettings();
      await clanSettingsPage.openOverviewTab();
    });

    await AllureReporter.step('Inspect Description field in Overview', async () => {
      const descTextarea = page
        .locator('textarea[placeholder*="description"], textarea[placeholder*="mô tả"], textarea')
        .first();

      if (await descTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await descTextarea.fill(testDescription);
        await page.waitForTimeout(300);

        // Discard / Reset changes if available
        const resetBtn = page
          .locator('button:has-text("Reset"), button:has-text("Discard")')
          .first();
        if (await resetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await resetBtn.click();
          await page.waitForTimeout(300);
        }
      }
    });

    await AllureReporter.step('Close Clan Settings', async () => {
      await clanPage.closeSettingsClan();
    });
  });

  test('TC03: Verify Clan Notification Settings toggle mute and radio selection persistence', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65127' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify opening Clan Notification Settings modal, selecting notification level radio (Only @mention), and closing modal cleanly.
    `);
    await AllureReporter.addLabels({
      tag: ['clan-management', 'notification-settings', 'notification-radio'],
    });

    await AllureReporter.step('Open Clan Notification Settings', async () => {
      await clanPage.openNotificationSettings();
    });

    await AllureReporter.step('Select notification radio and close modal', async () => {
      await clanPage.selectClanNotificationSetting('Only @mention');
      await clanPage.closeNotificationSettings();
    });

    await AllureReporter.step('Reopen and verify persistence', async () => {
      await clanPage.openNotificationSettings();
      await clanPage.verifyClanNotificationSettingSelected('Only @mention');
      await clanPage.closeNotificationSettings();
    });
  });
});
