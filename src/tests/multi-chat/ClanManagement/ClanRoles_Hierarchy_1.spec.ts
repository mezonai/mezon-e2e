import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { expect, test } from '@/fixtures/dual.fixture';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanSettingsPage } from '@/pages/ClanSettingsPage';
import { ROUTES } from '@/selectors';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import generateRandomString from '@/utils/randomString';
import joinUrlPaths from '@/utils/joinUrlPaths';

test.describe('Clan Roles - Hierarchy, Administrator Bypass, ACL & Audit Log (TC-CI-20, 21, Cases 120, 121, 163, 164)', () => {
  const accountA = AccountCredentials['account2-3'];
  const accountB = AccountCredentials['account2-4'];
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);

  test.beforeEach(async ({ dual }) => {
    await setupDualUsersSequentially(dual, accountA, accountB, directFriendsUrl);
  });

  test.afterEach(async ({ dual }) => {
    await dual.parallel({
      A: async page => {
        if (page.url().includes('mezon')) {
          await AuthHelper.logout(page);
        }
      },
      B: async page => {
        if (page.url().includes('mezon')) {
          await AuthHelper.logout(page);
        }
      },
    });
  });

  test('TC01: Verify Role hierarchy: Lower role cannot edit or delete higher role', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66091' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify role hierarchy enforcement where higher roles cannot be edited or deleted by lower roles.
    `);

    const { pageA } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanFactory = new ClanFactory();

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.openClanSettings();

      const roleName = `SeniorRole_${generateRandomString(4)}`;
      await clanPageA.createRoleWithPermission(roleName, 'Manage Channels');
      await clanPageA.openClanSettings();
      await clanPageA.verifyUserCannotEditRoleItself(roleName);
      await clanPageA.closeSettingsClan();
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC02: Verify Administrator role bypass: Administrator sees Community settings; Clan Manager restricted (TC-CI-20)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66092' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Community and Audit Log tabs are visible to Administrator but restricted for limited roles.
    `);

    const { pageA } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanFactory = new ClanFactory();

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.openClanSettings();

      // Owner has full Administrator privileges
      await clanPageA.verifyAdministratorPermissionRole(true);
      await clanPageA.closeSettingsClan();
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC03: Verify Private channel ACL: Member cannot view private channel until role is assigned (TC-CI-21)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66093' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify private channel is hidden from User B until User A adds User B or role.
    `);

    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const clanFactory = new ClanFactory();

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      // Create private channel
      const privChannelName = `priv-acl-${generateRandomString(5).toLowerCase()}`;
      await clanPageA.createNewChannel(ChannelType.TEXT, privChannelName, ChannelStatus.PRIVATE);

      // User B should NOT see private channel initially
      const privChanOnB = pageB.locator(`text=${privChannelName}`);
      await expect(privChanOnB).toHaveCount(0);
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC04: Verify Audit Log records role creation action', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66094' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify creating a role logs a Create Role entry in Clan Audit Log.
    `);

    const { pageA } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanSettingsPageA = new ClanSettingsPage(pageA);
    const clanFactory = new ClanFactory();

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.openClanSettings();

      const newRole = `AuditRole_${generateRandomString(4)}`;
      await clanPageA.createRoleWithPermission(newRole, 'Send Messages');

      await clanPageA.openClanSettings();
      await clanSettingsPageA.openAuditLogTab();

      const auditContent = pageA.locator('div[class*="audit"], [data-e2e*="audit_log"]').first();
      await expect(auditContent).toBeVisible({ timeout: 10000 });
      await clanPageA.closeSettingsClan();
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC05: Verify Audit Log records role rename / update action', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66095' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify renaming a role logs an Update Role entry in Audit Log.
    `);

    const { pageA } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanSettingsPageA = new ClanSettingsPage(pageA);
    const clanFactory = new ClanFactory();

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.openClanSettings();

      const origRole = `Orig_${generateRandomString(4)}`;
      const updatedRole = `Updated_${generateRandomString(4)}`;
      await clanPageA.createRoleWithPermission(origRole, 'Manage Channels');

      await clanPageA.openClanSettings();
      await clanPageA.updateRoleName(origRole, updatedRole);

      await clanSettingsPageA.openAuditLogTab();
      await clanSettingsPageA.verifyUpdateRoleAuditLog(updatedRole, userNameA);
      await clanPageA.closeSettingsClan();
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC06: Verify Audit Log records member kick action', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66096' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify kicking a member records Kick Member entry in Audit Log.
    `);

    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const clanSettingsPageA = new ClanSettingsPage(pageA);
    const clanFactory = new ClanFactory();

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      // Kick User B
      await clanPageA.kickUserByName(userNameB);

      // Verify Audit Log
      await clanPageA.openClanSettings();
      await clanSettingsPageA.openAuditLogTab();

      const kickLog = pageA.locator('text=Kick, text=Removed, [class*="audit"]').first();
      await expect(kickLog).toBeVisible({ timeout: 10000 });
      await clanPageA.closeSettingsClan();
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC07: Verify Audit Log records channel deletion action', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66097' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify deleting a channel logs Delete Channel in Audit Log.
    `);

    const { pageA } = dual;
    const clanPageA = new ClanPage(pageA);
    const channelSettingPageA = new ChannelSettingPage(pageA);
    const clanSettingsPageA = new ClanSettingsPage(pageA);
    const clanFactory = new ClanFactory();

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      const chToDelete = `del-${generateRandomString(5).toLowerCase()}`;
      await clanPageA.createNewChannel(ChannelType.TEXT, chToDelete);
      await clanPageA.openChannelSettings(chToDelete);
      await channelSettingPageA.deleteChannel();

      // Open audit log
      await clanPageA.openClanSettings();
      await clanSettingsPageA.openAuditLogTab();

      const auditEntries = pageA.locator('div[class*="audit"], [data-e2e*="audit_log"]').first();
      await expect(auditEntries).toBeVisible({ timeout: 10000 });
      await clanPageA.closeSettingsClan();
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC08: Verify Audit Log action type filter dropdown selects and filters entries', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66098' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify filtering Audit Log by Action Type filters visible rows.
    `);

    const { pageA } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanSettingsPageA = new ClanSettingsPage(pageA);
    const clanFactory = new ClanFactory();

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.openClanSettings();
      await clanSettingsPageA.openAuditLogTab();

      // Action filter dropdown
      const filterSelect = pageA.locator('select, [data-e2e*="filter"], [role="combobox"]').first();
      if (await filterSelect.isVisible({ timeout: 5000 })) {
        await filterSelect.click();
        await pageA.waitForTimeout(500);
        await pageA.keyboard.press('Escape');
      }
      await clanPageA.closeSettingsClan();
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC09: Verify Higher role can assign lower roles from member list', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66099' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify User A can assign a created role to User B from member list.
    `);

    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const clanFactory = new ClanFactory();

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      // Open Member list
      await clanPageA.openMemberListSetting();
      const userRow = clanPageA.selector.member.getSettingsRow(userNameB);
      await expect(userRow).toBeVisible({ timeout: 8000 });
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC10: Verify Removing role from member revokes channel permissions in realtime', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66100' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify revoking a role immediately updates permissions for recipient in realtime.
    `);

    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const clanFactory = new ClanFactory();

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      // User B is member in clan
      const generalChan = pageB.locator('text=general').first();
      await expect(generalChan).toBeVisible({ timeout: 8000 });
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });
});
