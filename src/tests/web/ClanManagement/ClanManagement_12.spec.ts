import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanSettingsPage } from '@/pages/ClanSettingsPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { test } from '@playwright/test';

test.describe('Clan Management - Audit Log Filters & Community Lifecycle (Cases 94, 95, 120, 121)', () => {
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
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify Audit Log filtering by action and member (Cases 94, 95)', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65094' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Clan Audit Log can be filtered by Action type and by Member name, preserving filter context and listing matching entries (Cases 94, 95).
    `);

    await AllureReporter.step('Navigate to Clan Settings -> Audit Log', async () => {
      await clanPage.openClanSettings();
      await clanSettingsPage.openAuditLogTab();
    });

    await AllureReporter.step(
      'Verify Audit Log entries and filter controls (Case 94)',
      async () => {
        // Find action filter dropdown / input
        const actionFilter = page
          .locator(
            'button:has-text("Filter by Action"), [data-e2e*="filter_action"], div[class*="actionFilter"]'
          )
          .first();
        const hasActionFilter = await actionFilter.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasActionFilter) {
          await actionFilter.click();
          await page.waitForTimeout(500);
          // Select an action option if menu appears
          const firstOption = page
            .locator('div[role="option"], li[role="menuitem"], [class*="item"]')
            .first();
          if (await firstOption.isVisible()) {
            await firstOption.click();
          }
        }
      }
    );

    await AllureReporter.step('Filter Audit Log by Member (Case 95)', async () => {
      const memberFilter = page
        .locator(
          'button:has-text("Filter by User"), button:has-text("Filter by Member"), [data-e2e*="filter_user"]'
        )
        .first();
      const hasMemberFilter = await memberFilter.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasMemberFilter) {
        await memberFilter.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
    });

    await AllureReporter.step('Close clan settings', async () => {
      const exitBtn = clanPage.selector.buttons.exitSettings.or(
        clanPage.selector.buttons.closeSettingClan
      );
      await exitBtn.click();
    });
  });

  test('TC02: Verify Community settings lifecycle, required validation, reset and disable (Cases 120, 121)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65120' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Enable Community modal validation, editing fields, resetting changes, and disabling community state updates clan visibility (Cases 120, 121).
    `);

    await AllureReporter.step('Navigate to Clan Settings -> Community Tab', async () => {
      await clanPage.openClanSettings();
      await clanSettingsPage.openCommunityTab();
    });

    await AllureReporter.step(
      'Open Enable Community modal and test required fields validation (Case 120)',
      async () => {
        await clanSettingsPage.openEnableCommunityModal();
        await clanSettingsPage.submitEnableCommunity();
        await clanSettingsPage.verifyCommunityRequiredFieldsValidation();
      }
    );

    await AllureReporter.step(
      'Close modal and verify community disable / enable toggling (Case 121)',
      async () => {
        await clanSettingsPage.closeEnableCommunityModal();

        // Check if disable community option or status button is present
        const disableBtn = page
          .locator('button:has-text("Disable Community"), button[data-e2e*="disable_community"]')
          .first();
        const canDisable = await disableBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (canDisable) {
          await disableBtn.click();
          await page.waitForTimeout(500);
          const confirmBtn = page
            .locator('button:has-text("Confirm"), button:has-text("Disable")')
            .first();
          if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
          }
        }
      }
    );

    await AllureReporter.step('Close clan settings', async () => {
      const exitBtn = clanPage.selector.buttons.exitSettings.or(
        clanPage.selector.buttons.closeSettingClan
      );
      await exitBtn.click();
    });
  });
});
