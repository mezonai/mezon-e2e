import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { expect, test } from '@/fixtures/dual.fixture';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

test.describe('Clan Management - Manage Clan Permission', () => {
  const accountA = AccountCredentials['account2-3'];
  const accountB = AccountCredentials['account2-4'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);
  const setupBeforeEach = setupDualUsersSequentially;

  test.beforeEach(async ({ dual }) => {
    await setupBeforeEach(dual, accountA, accountB, directFriendsUrl);
  });

  test.afterEach(async ({ dual }) => {
    await dual.parallel({
      A: async page => {
        await AuthHelper.logout(page);
      },
      B: async page => {
        await AuthHelper.logout(page);
      },
    });
  });

  test('Verify that user with manage clan permission can access clan settings', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64954' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user with Manage Clan permission can access clan settings.
      **Steps:**
      1. Invite User B to clan
      2. Add role with Manage Clan permission to User B
      3. Verify User B can open clan settings and see overview
      **Expected Result:** User B can access clan settings.
    `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const roleName = `role-${Date.now().toString(36).slice(-8)}`;

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      await Promise.allSettled([
        friendPageA.unblockFriend(userNameB),
        friendPageB.unblockFriend(userNameA),
      ]);
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
    });

    await AllureReporter.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.acceptFriendRequest, async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.verifyMutualFriends, async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    const clanFactory = new ClanFactory();
    await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement2, pageA);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Add role with Manage Clan permission to User B', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.createRoleWithPermission(roleName, 'Manage Clan');
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    });

    await AllureReporter.step('Verify User B can access clan settings', async () => {
      await pageB.reload();
      const opened = await clanPageB.openClanSettings();
      expect(opened).toBe(true);
      await clanPageB.closeSettingsClan();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that user without manage clan permission cannot access clan settings overview', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64954' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user without Manage Clan permission cannot access clan settings overview.
      **Steps:**
      1. Invite User B to clan
      2. Verify User B cannot access clan settings before role assignment
      **Expected Result:** User B cannot manage clan without the permission.
    `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      await Promise.allSettled([
        friendPageA.unblockFriend(userNameB),
        friendPageB.unblockFriend(userNameA),
      ]);
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
    });

    await AllureReporter.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.acceptFriendRequest, async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.verifyMutualFriends, async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    const clanFactory = new ClanFactory();
    await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement2, pageA);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Verify User B cannot access clan settings', async () => {
      await pageB.reload();
      await clanPageB.openChannelSettingsSidebar('general');
      await clanPageB.verifyUserWithChannelManagePermission(false);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that manage clan permission allows managing roles', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64954' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that Manage Clan permission allows managing roles.
      **Steps:**
      1. Invite User B to clan
      2. Add role with Manage Clan permission to User B
      3. Verify User B can create a new role
      **Expected Result:** User B can manage roles.
    `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const roleName = `role-${Date.now().toString(36).slice(-8)}`;
    const newRoleName = `new-role-${Date.now().toString(36).slice(-8)}`;

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      await Promise.allSettled([
        friendPageA.unblockFriend(userNameB),
        friendPageB.unblockFriend(userNameA),
      ]);
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
    });

    await AllureReporter.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.acceptFriendRequest, async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.verifyMutualFriends, async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    const clanFactory = new ClanFactory();
    await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement2, pageA);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Add role with Manage Clan permission to User B', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.createRoleWithPermission(roleName, 'Manage Clan');
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    });

    await AllureReporter.step('Verify User B can create a new role', async () => {
      await pageB.reload();
      await clanPageB.openRoleSettingsPage();
      await clanPageB.addNewRoleOnClan(newRoleName);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that manage clan permission allows updating clan name', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64954' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that Manage Clan permission allows updating clan name.
      **Steps:**
      1. Invite User B to clan
      2. Add role with Manage Clan permission to User B
      3. Verify User B can update clan name
      **Expected Result:** User B can update clan settings.
    `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const roleName = `role-${Date.now().toString(36).slice(-8)}`;
    const newClanName = `Updated Clan ${Date.now().toString(36).slice(-6)}`;

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      await Promise.allSettled([
        friendPageA.unblockFriend(userNameB),
        friendPageB.unblockFriend(userNameA),
      ]);
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
    });

    await AllureReporter.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.acceptFriendRequest, async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.verifyMutualFriends, async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    const clanFactory = new ClanFactory();
    await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement2, pageA);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Add role with Manage Clan permission to User B', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.createRoleWithPermission(roleName, 'Manage Clan');
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    });

    await AllureReporter.step('Verify User B can update clan settings', async () => {
      await pageB.reload();
      await clanPageB.openClanSettings();
      await clanPageB.updateClanName(newClanName);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that removing manage clan permission revokes clan management access', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64954' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that removing Manage Clan permission revokes clan management access.
      **Steps:**
      1. Invite User B to clan
      2. Add role with Manage Clan permission to User B
      3. Verify User B can manage clan
      4. Delete the role
      5. Verify User B cannot manage clan
      **Expected Result:** Clan management access is revoked when permission is removed.
    `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const roleName = `role-${Date.now().toString(36).slice(-8)}`;

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      await Promise.allSettled([
        friendPageA.unblockFriend(userNameB),
        friendPageB.unblockFriend(userNameA),
      ]);
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
    });

    await AllureReporter.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.acceptFriendRequest, async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.verifyMutualFriends, async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    const clanFactory = new ClanFactory();
    await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement2, pageA);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Add role with Manage Clan permission to User B', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.createRoleWithPermission(roleName, 'Manage Clan');
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    });

    await AllureReporter.step('Verify User B can manage clan', async () => {
      await pageB.reload();
      const opened = await clanPageB.openClanSettings();
      expect(opened).toBe(true);
      await clanPageB.closeSettingsClan();
    });

    await AllureReporter.step('Delete the role', async () => {
      await clanPageA.deleteRole(roleName);
    });

    await AllureReporter.step('Verify User B cannot manage clan after role removal', async () => {
      await pageB.reload();
      await clanPageB.openChannelSettingsSidebar('general');
      await clanPageB.verifyUserWithChannelManagePermission(false);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
