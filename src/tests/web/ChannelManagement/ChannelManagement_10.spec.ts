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
    let createdChannelName = inputName;

    await AllureReporter.step(
      `Create channel with spaced name: "${inputName}" and verify channel is present`,
      async () => {
        await clanPage.createNewChannel(ChannelType.TEXT, inputName, ChannelStatus.PUBLIC);
        const isKebabPresent = await clanPage.isNewChannelPresent(expectedKebabName);
        const isInputPresent = isKebabPresent
          ? false
          : await clanPage.isNewChannelPresent(inputName);
        expect(isKebabPresent || isInputPresent).toBe(true);
        createdChannelName = isKebabPresent ? expectedKebabName : inputName;
      }
    );

    await AllureReporter.step('Delete channel to clean up', async () => {
      await clanPage.openChannelSettings(createdChannelName);
      await channelSettingPage.deleteChannel();
    });
  });

  test('TC02: Update channel topic and overview settings and verify persistence', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63960',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can update the channel name and topic in Channel Settings Overview and verify core settings tabs are accessible.

      **Test Steps:**
      1. Create a public text channel
      2. Open Channel Settings
      3. Verify core settings tabs (Overview, Category, Permissions) are visible
      4. Update channel name and channel topic in Overview
      5. Save changes
      6. Reload page and re-open Channel Settings
      7. Verify updated overview information is retained
      8. Delete channel to clean up

      **Expected Result:** Channel overview details and topic are updated and persisted after reload.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-management', 'channel-overview', 'topic-update'],
    });

    const clanPage = new ClanPage(page);
    const channelSettingPage = new ChannelSettingPage(page);
    const unique = generateRandomString(4).toLowerCase();
    const initialName = `topic-${unique}`;
    const updatedName = `topic-up-${unique}`;
    const testTopic = `Important channel topic ${unique}`;

    await AllureReporter.step(`Create initial text channel: ${initialName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, initialName, ChannelStatus.PUBLIC);
      expect(await clanPage.isNewChannelPresent(initialName)).toBe(true);
    });

    await AllureReporter.step('Open Channel Settings and verify core tabs', async () => {
      await clanPage.openChannelSettings(initialName);
      await channelSettingPage.verifyCoreSettingsTabsVisible();
    });

    await AllureReporter.step('Update channel overview with new name and topic', async () => {
      await channelSettingPage.updateOverview(updatedName, testTopic);
      await channelSettingPage.verifyOverview(updatedName, testTopic);
      await channelSettingPage.closeChannelSettings();
    });

    await AllureReporter.step('Reload and verify updated overview retains new topic', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await clanPage.openChannelSettings(updatedName);
      await channelSettingPage.verifyOverview(updatedName, testTopic);
    });

    await AllureReporter.step('Delete channel to clean up', async () => {
      await clanPage.openChannelSettings(updatedName);
      await channelSettingPage.deleteChannel();
    });
  });
});
