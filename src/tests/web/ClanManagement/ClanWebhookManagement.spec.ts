import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanSettingsPage } from '@/pages/ClanSettingsPage';
import { MezonCredentials } from '@/types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Webhook Lifecycle', () => {
  const clanFactory = new ClanFactory();
  const credentials: MezonCredentials = AccountCredentials.account3;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.clanManagement2,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
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

  test('Verify webhook lifecycle: create, edit, cancel delete, and confirm delete', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify complete webhook lifecycle including creation, editing name with save changes, cancelling deletion, and confirming deletion.

      **Test Steps:**
        1. Open Clan settings and navigate to Integrations tab
        2. Create a new clan webhook and verify it appears in the list
        3. Expand webhook details and edit the webhook name
        4. Save changes and verify the updated name is displayed
        5. Click Delete Webhook and cancel deletion; verify the webhook is retained
        6. Click Delete Webhook and confirm deletion; verify the webhook is removed
        7. Close clan settings

      **Expected Result:** Webhook updates persist, cancellation preserves webhook, and confirmation deletes it cleanly.
    `);
    await AllureReporter.addLabels({
      tag: ['webhook_lifecycle', 'webhook_edit', 'webhook_delete'],
    });

    const clanSettingsPage = new ClanSettingsPage(page);
    const clanPage = new ClanPage(page);
    const updatedWebhookName = `Hook-${Date.now().toString(36)}`;
    let initialWebhookName = '';

    await AllureReporter.step('Go to Channels page and open Integrations tab', async () => {
      await clanPage.gotoChannelManagementPage();
      await clanSettingsPage.openIntegrationsTab();
      await clanSettingsPage.openClanWebhooks();
    });

    await AllureReporter.step('Create a new clan webhook', async () => {
      await clanSettingsPage.createClanWebhook();
      initialWebhookName = await clanSettingsPage.getLatestWebhookName();
      expect(initialWebhookName.length).toBeGreaterThan(0);
    });

    await AllureReporter.step('Expand webhook details and edit name', async () => {
      await clanSettingsPage.expandWebhook(initialWebhookName);
      await clanSettingsPage.editWebhookName(initialWebhookName, updatedWebhookName);
      await clanSettingsPage.verifyWebhookExists(updatedWebhookName, true);
    });

    await AllureReporter.step('Cancel webhook deletion and verify it is retained', async () => {
      await clanSettingsPage.cancelDeleteWebhook(updatedWebhookName);
      await clanSettingsPage.verifyWebhookExists(updatedWebhookName, true);
    });

    await AllureReporter.step('Confirm webhook deletion and verify it is removed', async () => {
      await clanSettingsPage.confirmDeleteWebhook(updatedWebhookName);
      await clanSettingsPage.verifyWebhookExists(updatedWebhookName, false);
    });

    await AllureReporter.step('Close clan settings', async () => {
      await clanSettingsPage.closeClanSettings();
    });
  });
});
