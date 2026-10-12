import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { expect } from '@playwright/test';

const PRIVATE_VOICE_TAGS = ['voice-channel', 'private-channel', 'permissions'];

async function describeCase(description: string, tags: string[] = []): Promise<void> {
  await AllureReporter.addTestParameters({
    testType: AllureConfig.TestTypes.E2E,
    userType: AllureConfig.UserTypes.AUTHENTICATED,
    severity: AllureConfig.Severity.CRITICAL,
  });
  await AllureReporter.addDescription(description);
  await AllureReporter.addLabels({ tag: [...PRIVATE_VOICE_TAGS, ...tags] });
}

test.describe('Private Voice Channel - Settings and Lifecycle', () => {
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

  test('Clan owner can create and manage a private voice channel', async ({ page }) => {
    await describeCase(`
      **Test Objective:** Verify that a clan owner can create a private voice channel and open all supported settings.

      **Test Steps:**
      1. Create a private voice channel.
      2. Verify the channel and locked speaker icon in the channel list.
      3. Open channel settings and verify Overview, Category, and Permissions tabs.

      **Expected Result:** The owner sees the private voice channel and all supported settings.
    `);

    const channelName = `pvc-${Date.now().toString(36)}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    const settings = new ChannelSettingPage(page);

    await AllureReporter.step(`Create private voice channel: ${channelName}`, async () => {
      expect(
        await clanPage.createNewChannel(ChannelType.VOICE, channelName, ChannelStatus.PRIVATE)
      ).toBe(true);
    });
    await AllureReporter.step('Verify owner visibility and private voice icon', async () => {
      await clanPage.verifyChannelVisibility(channelName, true);
      await clanPage.verifyVoiceChannelPrivacyIcon(channelName, true);
    });
    await AllureReporter.step('Verify private voice settings tabs', async () => {
      await clanPage.openChannelSettings(channelName);
      await settings.verifyCoreSettingsTabsVisible();
      await settings.closeChannelSettings();
    });
  });

  test('Update private voice channel name and topic', async ({ page }) => {
    await describeCase(
      `
      **Test Objective:** Verify that private voice channel name and topic can be updated and persisted.

      **Test Steps:**
      1. Create a private voice channel and open Overview.
      2. Update its name and topic, then save.
      3. Reopen settings and verify both values.

      **Expected Result:** The new name appears in the channel list and both values persist.
    `,
      ['overview', 'edit-channel']
    );

    const unique = Date.now().toString(36);
    const channelName = `pvc-${unique}`.slice(0, 20);
    const updatedName = `pvc-edit-${unique}`.slice(0, 20);
    const topic = `Private voice topic ${unique}`;
    const clanPage = new ClanPage(page);
    const settings = new ChannelSettingPage(page);

    await clanPage.createNewChannel(ChannelType.VOICE, channelName, ChannelStatus.PRIVATE);
    await clanPage.openChannelSettings(channelName);
    await settings.updateOverview(updatedName, topic);
    await settings.closeChannelSettings();
    await clanPage.verifyChannelVisibility(updatedName, true);

    await clanPage.openChannelSettings(updatedName);
    await settings.verifyOverview(updatedName, topic);
    await settings.closeChannelSettings();
  });

  test('Move a renamed private voice channel to another category', async ({ page }) => {
    await describeCase(
      `
      **Test Objective:** Verify Category shows the updated channel name and can move a private voice channel.

      **Test Steps:**
      1. Create a target category and a private voice channel.
      2. Rename the channel in Overview.
      3. Verify the new name in Category and move it to the target category.
      4. Reload and verify the channel remains in the target category.

      **Expected Result:** Category reflects the renamed channel and the category change persists.
    `,
      ['category', 'edit-channel']
    );

    const unique = Date.now().toString(36);
    const categoryName = `pvc-cat-${unique}`.slice(0, 20);
    const channelName = `pvc-${unique}`.slice(0, 20);
    const updatedName = `pvc-move-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    const menu = new ClanMenuPanel(page);
    const settings = new ChannelSettingPage(page);

    await menu.createCategory(categoryName);
    await clanPage.createNewChannel(ChannelType.VOICE, channelName, ChannelStatus.PRIVATE);
    await clanPage.openChannelSettings(channelName);
    await settings.updateOverview(updatedName, `Category test ${unique}`);
    await settings.openCategoryTab();
    await settings.verifyCategoryChannelName(updatedName);
    await settings.changeCategory(categoryName);
    await settings.closeChannelSettingsIfVisible();

    await page.reload();
    await clanPage.verifyChannelVisibility(updatedName, true);
    await clanPage.openChannelSettings(updatedName);
    await settings.openCategoryTab();
    await settings.verifyCategoryChannelName(updatedName);
    await settings.verifyCategory(categoryName);
    await settings.closeChannelSettings();
  });

  test('Delete a private voice channel', async ({ page }) => {
    await describeCase(
      `
      **Test Objective:** Verify that a private voice channel can be deleted.

      **Test Steps:**
      1. Create a private voice channel.
      2. Delete it from channel settings.
      3. Verify it is absent from the channel list and Channel Management.

      **Expected Result:** The deleted private voice channel is no longer available.
    `,
      ['delete-channel']
    );

    const channelName = `pvc-del-${Date.now().toString(36)}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    const settings = new ChannelSettingPage(page);

    await clanPage.createNewChannel(ChannelType.VOICE, channelName, ChannelStatus.PRIVATE);
    await clanPage.openChannelSettings(channelName);
    await settings.deleteChannel();
    await clanPage.verifyChannelVisibility(channelName, false);
    await clanPage.openChannelsListSetting();
    expect(await clanPage.isChannelPresentOnChannelManagement(channelName)).toBe(false);
  });
});
