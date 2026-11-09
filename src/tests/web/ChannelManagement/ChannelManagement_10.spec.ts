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

test.describe('Channel Management - Channel Name Auto Formatting', () => {
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

  test('Verify that channel name automatically formats spaces and uppercase to kebab-case', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63959',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that entering a channel name with spaces and uppercase letters automatically transforms to kebab-case (lowercase with hyphens).

      **Test Steps:**
      1. Enter a channel name with spaces and uppercase (e.g. "Dev Team Discussion")
      2. Submit channel creation
      3. Verify channel name in the channel list is formatted in kebab-case ("dev-team-discussion")
      4. Clean up channel

      **Expected Result:** Channel name is sanitized to lowercase with hyphens.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-management', 'kebab-case', 'name-sanitization'],
    });

    const clanPage = new ClanPage(page);
    const channelSettingPage = new ChannelSettingPage(page);
    const unique = generateRandomString(4).toLowerCase();
    const inputName = `Auto Format ${unique}`;
    const expectedKebabName = `auto-format-${unique}`.toLowerCase();

    await AllureReporter.step(
      `Create channel with spaced name: "${inputName}" and verify kebab-case: "${expectedKebabName}"`,
      async () => {
        await clanPage.createNewChannel(ChannelType.TEXT, inputName, ChannelStatus.PUBLIC);
        const isPresent = await clanPage.isNewChannelPresent(expectedKebabName);
        expect(isPresent).toBe(true);
      }
    );

    await AllureReporter.step('Delete channel to clean up', async () => {
      await clanPage.openChannelSettings(expectedKebabName);
      await channelSettingPage.deleteChannel();
    });
  });
});
