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

test.describe('Channel Management - Role and Member Permissions in Private Channel', () => {
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

  test('Verify that user can add and remove role permissions for a private channel', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64636',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can manage role and member permissions in a private channel.

      **Test Steps:**
      1. Create a new private text channel
      2. Open Channel Settings
      3. Open Add Members/Roles modal in Permissions section
      4. Select a role and submit
      5. Verify the role is displayed in the private channel permissions list
      6. Remove the role from the private channel
      7. Verify the role is no longer in the list
      8. Clean up channel

      **Expected Result:** Role permissions can be added and removed from a private channel successfully.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-management', 'private-channel', 'permissions', 'roles-management'],
    });

    const clanPage = new ClanPage(page);
    const channelSettingPage = new ChannelSettingPage(page);
    const channelName = `priv-perm-${generateRandomString(6)}`.toLowerCase();
    const testRole = `role-${generateRandomString(4)}`.toLowerCase();

    await AllureReporter.step(`Create role ${testRole} in clan`, async () => {
      await clanPage.openRoleSettingsPage();
      await clanPage.addNewRoleOnClan(testRole);
    });

    await AllureReporter.step(`Create private text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PRIVATE);
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(true);
    });

    await AllureReporter.step('Open channel settings and Add Members/Roles modal', async () => {
      await clanPage.openChannelSettings(channelName);
      await channelSettingPage.openPermissionsTab();
      await channelSettingPage.openAddMembersRolesModal();
    });

    await AllureReporter.step('Add role to private channel and verify in list', async () => {
      await channelSettingPage.addMembersAndRolesForPrivateChannel(testRole);
    });

    await AllureReporter.step('Remove role from private channel permissions', async () => {
      await channelSettingPage.removeRoleFromPrivateChannel(testRole);
    });

    await AllureReporter.step('Delete test channel to clean up', async () => {
      await channelSettingPage.deleteChannel();
    });
  });
});
