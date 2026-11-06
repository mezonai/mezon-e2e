import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { MezonCredentials } from '@/types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Member List Search and Empty State', () => {
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

  test('Verify clan member list search with no match shows empty state and clearing restores members', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that searching a non-existent member in clan member list yields zero results, and clearing search restores the member list.

      **Test Steps:**
        1. Open member list settings page
        2. Verify current clan members are visible
        3. Enter a non-existent search keyword
        4. Verify that member list results are empty
        5. Clear the search input
        6. Verify that the original member list is restored
      **Expected Result:** Empty state or zero rows appear when no member matches, and clearing search recovers the list.
    `);
    await AllureReporter.addLabels({
      tag: ['member_list_search', 'empty_state', 'clear_search'],
    });

    const clanPage = new ClanPage(page);
    const memberRows = clanPage.selector.memberSettings.userContainer;

    await AllureReporter.step('Open clan member list settings page', async () => {
      await clanPage.openMemberListSetting();
      await expect(memberRows.first()).toBeVisible({ timeout: 10000 });
    });

    const initialCount = await memberRows.count();
    expect(initialCount).toBeGreaterThan(0);

    await AllureReporter.step('Search for non-existent member keyword', async () => {
      const nonExistentKeyword = `nonexistent_${Date.now().toString(36)}`;
      await clanPage.searchMemberList(nonExistentKeyword);
      await expect(memberRows).toHaveCount(0, { timeout: 5000 });
    });

    await AllureReporter.step('Clear search input and verify member list is restored', async () => {
      await clanPage.clearMemberListSearch();
      await expect(memberRows).toHaveCount(initialCount, { timeout: 5000 });
    });
  });

  test('Verify channel permission member list search with no match shows empty state and clearing restores members', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that in channel permissions member list, searching a non-existent member displays 'No members found' empty state, and clearing search restores members.

      **Test Steps:**
        1. Create a private channel
        2. Open channel settings and navigate to Permissions tab
        3. Verify the member list displays the channel owner
        4. Enter a non-existent member search keyword
        5. Verify 'No members found' empty state is visible
        6. Clear the search input
        7. Verify 'No members found' is hidden and the member list is restored
        8. Close channel settings
      **Expected Result:** Empty state appears when search does not match, and clearing restores the member list.
    `);
    await AllureReporter.addLabels({
      tag: ['channel_member_permission_search', 'empty_state', 'clear_search'],
    });

    const clanPage = new ClanPage(page);
    const channelSettingsPage = new ChannelSettingPage(page);
    const channelName = `prm-srch-${Date.now().toString(36)}`.slice(0, 20);

    await AllureReporter.step(`Create private text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PRIVATE);
      await clanPage.verifyChannelVisibility(channelName, true);
    });

    await AllureReporter.step('Open channel settings and Permissions tab', async () => {
      await clanPage.openChannelSettings(channelName);
      await channelSettingsPage.openPermissionsTab();
    });

    const memberItem = channelSettingsPage.getMemberItemLocator().first();
    await AllureReporter.step('Verify initial member is visible', async () => {
      await expect(memberItem).toBeVisible({ timeout: 5000 });
    });

    await AllureReporter.step(
      'Search for non-existent keyword and verify No members found empty state',
      async () => {
        const nonExistentKeyword = `nobody_${Date.now().toString(36)}`;
        await channelSettingsPage.searchChannelMembers(nonExistentKeyword);
        await channelSettingsPage.verifyNoMembersFoundVisible(true);
        await expect(memberItem).toBeHidden({ timeout: 5000 });
      }
    );

    await AllureReporter.step('Clear search input and verify member list is restored', async () => {
      await channelSettingsPage.clearChannelMembersSearch();
      await channelSettingsPage.verifyNoMembersFoundVisible(false);
      await expect(memberItem).toBeVisible({ timeout: 5000 });
    });

    await AllureReporter.step('Close channel settings', async () => {
      await channelSettingsPage.closeChannelSettings();
    });
  });
});
