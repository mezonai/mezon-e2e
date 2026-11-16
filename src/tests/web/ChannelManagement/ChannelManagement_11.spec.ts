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

test.describe('Channel Management - Switch Public Channel to Private with ACL and Revert (TC-CI-21 / Case 164)', () => {
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

  test('Verify switching a public channel to private, configuring ACL, and reverting back to public', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '65164',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify switching a public channel to private with ACL configuration and reverting to public (TC-CI-21 / Case 164).

      **Test Steps:**
      1. Create a public text channel.
      2. Open Channel Settings -> Permissions tab.
      3. Enable Private Channel toggle and confirm save in modal.
      4. Add role to member/role management list.
      5. Verify channel status is private and role exists in ACL list.
      6. Toggle Private Channel off and save changes to revert to public.
      7. Verify channel returns to public state.
      8. Clean up channel.

      **Expected Result:** Channel transitions cleanly between public and private without orphaned ACL or UI errors.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-management', 'permissions', 'channel-acl', 'public-to-private', 'tc-ci-21'],
    });

    const clanPage = new ClanPage(page);
    const channelSettingPage = new ChannelSettingPage(page);
    const channelName = `ch-acl-${generateRandomString(6)}`.toLowerCase();
    const testRole = `acl-role-${generateRandomString(4)}`.toLowerCase();

    await AllureReporter.step(`Create role ${testRole} in clan`, async () => {
      await clanPage.openRoleSettingsPage();
      await clanPage.addNewRoleOnClan(testRole);
    });

    await AllureReporter.step(`Create public text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC);
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(true);
    });

    await AllureReporter.step('Switch public channel to private via permissions tab', async () => {
      await clanPage.openChannelSettings(channelName);
      await channelSettingPage.setPrivateMode(true);
    });

    await AllureReporter.step('Add role to private channel ACL', async () => {
      await channelSettingPage.openAddMembersRolesModal();
      await channelSettingPage.addMembersAndRolesForPrivateChannel(testRole);
    });

    await AllureReporter.step('Verify channel status is private with role in ACL', async () => {
      const isPrivate = await channelSettingPage.verifyChannelStatusIsPrivate(channelName);
      expect(isPrivate).toBe(true);
    });

    await AllureReporter.step('Switch channel back from private to public', async () => {
      await clanPage.openChannelSettings(channelName);
      await channelSettingPage.setPrivateMode(false);
      const isPublic = await channelSettingPage.verifyChannelStatusIsPublic(channelName);
      expect(isPublic).toBe(true);
    });

    await AllureReporter.step('Clean up channel', async () => {
      await clanPage.openChannelSettings(channelName);
      await channelSettingPage.deleteChannel();
    });
  });
});
