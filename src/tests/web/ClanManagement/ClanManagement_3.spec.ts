import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanSettingsPage } from '@/pages/ClanSettingsPage';
import { MezonCredentials } from '@/types';
import { ChannelStatus, ChannelType, ClanStatus, EventType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Module 3', () => {
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
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63510',
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

  test('Verify that I can create a webhook when standing at Channels or Members page', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64201',
      github_issue: '9769',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully create a new webhook when standing at Channels or Members page.
        **Test Steps:**
          1. Go to Channels or Members page
          2. Open Clan settings page
          3. Open Integrations tab
          4. Click on Create webhook button
          5. Click on New webhook button
          6. Verify webhook is created
        **Expected Result:** Webhook is created.
  `);
    await AllureReporter.addLabels({
      tag: ['webhook_creation', 'channels_members_page'],
    });

    const clanPage = new ClanPage(page);
    const clanMenuPanel = new ClanMenuPanel(page);
    const clanSettingsPage = new ClanSettingsPage(page);

    await clanPage.buttons.channelManagementButton.click();

    await clanMenuPanel.text.clanName.click();
    await clanMenuPanel.buttons.clanSettings.click();
    await clanSettingsPage.buttons.sidebarItem.filter({ hasText: 'Integrations' }).click();

    await clanSettingsPage.createWebhook();

    const isWebhookCreated = await clanSettingsPage.verifyWebhookCreated();
    expect(isWebhookCreated).toBe(true);
  });
});
