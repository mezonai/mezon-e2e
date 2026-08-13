import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanSettingsPage } from '@/pages/ClanSettingsPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { test } from '@playwright/test';

test.describe('Clan Management - Audit Log', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account3;
  const [username] = getUsernamesFromEmails([credentials.email]);

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

  test.afterEach(async ({ page }) => AuthHelper.logout(page));
  test.afterAll(async ({ browser }) =>
    TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials })
  );

  test('Verify that updating a role name is recorded in Clan Audit Log', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that changing a role name creates an Update Role entry in Audit Log.

      **Test Steps:**
      1. Open Clan Settings and create a role
      2. Update the role name
      3. Open the Audit Log tab
      4. Verify the actor, Update Role action, updated role name, role ID, and event time

      **Expected Result:** Audit Log displays the correct Update Role entry and timestamp.
    `);
    await AllureReporter.addLabels({ tag: ['clan-management', 'audit-log', 'update-role'] });

    const clanPage = new ClanPage(page);
    const clanSettingsPage = new ClanSettingsPage(page);
    const originalRoleName = `audit-${Date.now().toString(36)}`.slice(0, 20);
    const updatedRoleName = `updated-${Date.now().toString(36)}`.slice(0, 20);

    await AllureReporter.step(`Create role: ${originalRoleName}`, async () => {
      await clanPage.openRoleSettingsPage();
      await clanPage.addNewRoleOnClan(originalRoleName);
    });

    await AllureReporter.step(`Update role name to: ${updatedRoleName}`, async () => {
      await clanPage.updateRoleName(originalRoleName, updatedRoleName);
    });

    await AllureReporter.step('Open Clan Audit Log', async () => {
      await clanSettingsPage.openAuditLogTab();
    });

    await AllureReporter.step('Verify the Update Role audit-log content and time', async () => {
      await clanSettingsPage.verifyUpdateRoleAuditLog(updatedRoleName, username);
      await clanPage.closeSettingsClan();
    });
  });
});
