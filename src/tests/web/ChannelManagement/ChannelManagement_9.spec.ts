import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Management - Channel Webhook Integration', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account1;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('Verify that user can create and view webhook in channel settings', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64201',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can create a webhook in channel settings and view the created webhook.

      **Test Steps:**
      1. Create a public text channel
      2. Open Channel Settings
      3. Navigate to Integrations / Webhook tab
      4. Create a new webhook
      5. Verify the webhook is created and view webhook button is available
      6. Clean up by deleting the channel

      **Expected Result:** Channel webhook is successfully created and accessible in channel settings.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-management', 'webhook', 'integrations'],
    });

    const clanPage = new ClanPage(page);
    const channelSettingPage = new ChannelSettingPage(page);
    const channelName = `wh-${generateRandomString(6)}`.toLowerCase();

    await AllureReporter.step(`Create text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC);
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(true);
    });

    await AllureReporter.step('Open channel settings and create webhook', async () => {
      await clanPage.openChannelSettings(channelName);
      await channelSettingPage.createChannelWebhook();
    });

    await AllureReporter.step('Delete test channel to clean up', async () => {
      await channelSettingPage.deleteChannel();
    });
  });
});
