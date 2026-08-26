import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { expect, test } from '@/fixtures/dual.fixture';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

test.describe('Clan Management - Manage Channels Permission', () => {
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

  test('Verify that user with manage channels permission can edit channel', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64954' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user with Manage Channels permission can edit channel.
      **Steps:**
      1. Invite User B to clan
      2. Add role with Manage Channels permission to User B
      3. Verify User B can see Edit Channel option
      **Expected Result:** User B can manage channels.
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

    await AllureReporter.step('Add role with Manage Channels permission to User B', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.createRoleWithPermission(roleName, 'Manage Channels');
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    });

    await AllureReporter.step('Verify User B can manage channels', async () => {
      await pageB.reload();
      await clanPageB.openChannelSettingsSidebar('general');
      await clanPageB.verifyUserWithChannelManagePermission(true);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that user without manage channels permission cannot edit channel', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64954' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user without Manage Channels permission cannot edit channel.
      **Steps:**
      1. Invite User B to clan
      2. Verify User B cannot see Edit Channel option before role assignment
      **Expected Result:** User B cannot manage channels without the permission.
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

    await AllureReporter.step('Verify User B cannot manage channels', async () => {
      await pageB.reload();
      await clanPageB.openChannelSettingsSidebar('general');
      await clanPageB.verifyUserWithChannelManagePermission(false);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that manage channels permission allows creating new channels', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64954' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that Manage Channels permission allows creating new channels.
      **Steps:**
      1. Invite User B to clan
      2. Add role with Manage Channels permission to User B
      3. Verify User B can create a new channel
      **Expected Result:** User B can create channels with Manage Channels permission.
    `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const roleName = `role-${Date.now().toString(36).slice(-8)}`;
    const channelName = `test-ch-${Date.now().toString(36).slice(-6)}`;

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

    await AllureReporter.step('Add role with Manage Channels permission to User B', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.createRoleWithPermission(roleName, 'Manage Channels');
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    });

    await AllureReporter.step('Verify User B can create a new channel', async () => {
      await pageB.reload();
      const created = await clanPageB.createNewChannel(ChannelType.TEXT, channelName);
      expect(created).toBe(true);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that manage channels permission allows editing channel name', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64954' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that Manage Channels permission allows editing channel name.
      **Steps:**
      1. Invite User B to clan
      2. Add role with Manage Channels permission to User B
      3. Verify User B can edit channel name
      **Expected Result:** User B can edit channel names.
    `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const roleName = `role-${Date.now().toString(36).slice(-8)}`;
    const newChannelName = `renamed-${Date.now().toString(36).slice(-6)}`;

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

    await AllureReporter.step('Add role with Manage Channels permission to User B', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.createRoleWithPermission(roleName, 'Manage Channels');
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    });

    await AllureReporter.step('Verify User B can edit channel name', async () => {
      await pageB.reload();
      await clanPageB.openChannelSettings('general');
      const input = pageB.locator('input[value="general"]');
      await expect(input).toBeVisible({ timeout: 5000 });
      await input.fill(newChannelName);
      await pageB.waitForTimeout(1000);
      await clanPageB.closeSettingsChannel();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that removing manage channels permission revokes channel edit access', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64954' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that removing Manage Channels permission revokes channel edit access.
      **Steps:**
      1. Invite User B to clan
      2. Add role with Manage Channels permission to User B
      3. Verify User B can manage channels
      4. Delete the role
      5. Verify User B cannot manage channels
      **Expected Result:** Channel edit access is revoked when permission is removed.
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

    await AllureReporter.step('Add role with Manage Channels permission to User B', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.createRoleWithPermission(roleName, 'Manage Channels');
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    });

    await AllureReporter.step('Verify User B can manage channels', async () => {
      await pageB.reload();
      await clanPageB.openChannelSettingsSidebar('general');
      await clanPageB.verifyUserWithChannelManagePermission(true);
    });

    await AllureReporter.step('Delete the role', async () => {
      await clanPageA.deleteRole(roleName);
    });

    await AllureReporter.step(
      'Verify User B cannot manage channels after role removal',
      async () => {
        await pageB.reload();
        await clanPageB.openChannelSettingsSidebar('general');
        await clanPageB.verifyUserWithChannelManagePermission(false);
      }
    );

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
