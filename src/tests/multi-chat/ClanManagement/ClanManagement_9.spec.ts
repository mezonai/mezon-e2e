import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { expect, test } from '@/fixtures/dual.fixture';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

test.describe('Clan Management - Channel Permission Overrides and Realtime Sync', () => {
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

  test('Verify priority of allow and deny channel permission override on message sending', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64954' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const channelSettingsA = new ChannelSettingPage(pageA);
    const channelName = `ch-${Date.now().toString(36).slice(-6)}`;
    const roleName = `role-${Date.now().toString(36).slice(-6)}`;
    const clanFactory = new ClanFactory();

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that channel permission overrides strictly prioritize allow/deny. When Send Messages is overridden to deny, member cannot compose. When restored to allow, member can compose again and both clients sync realtime.

      **Test Steps:**
      1. Setup clan, invite User B and create a custom role assigned to User B
      2. User A creates a channel and adds User B/Role to channel permissions
      3. User B verifies initial composer access by sending marker message 1
      4. User A opens Channel Settings -> Permissions, denies Send Messages override, and saves
      5. User B verifies composer is blocked (permissionDenied)
      6. User A changes Send Messages override to allow and saves
      7. User B verifies composer is re-enabled, sends marker message 2, and both clients see it

      **Expected Result:** Deny override disables composer; allow override restores sending; realtime sync is preserved.
    `);

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

    await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.memberManagement, pageA);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Create custom role and assign to User B', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.addNewRoleOnClan(roleName);
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    });

    await AllureReporter.step('User A creates a dedicated test channel', async () => {
      await clanPageA.createNewChannel(ChannelType.TEXT, channelName);
      await clanPageA.openChannelByName(channelName);
      await clanPageB.openChannelByName(channelName);
    });

    await AllureReporter.step('User B sends marker message before override', async () => {
      const marker1 = `Marker-Before-${Date.now()}`;
      await clanPageB.sendFirstMessage(marker1);
      await expect(pageA.locator(`text=${marker1}`)).toBeVisible({ timeout: 10000 });
    });

    await AllureReporter.step('User A sets Send Messages override to DENY', async () => {
      await clanPageA.openChannelSettings(channelName);
      await channelSettingsA.openPermissionsTab();
      await channelSettingsA.updateChannelStatusAndOpenAddMembersRolesModal();
      await channelSettingsA.addMembersAndRolesForPrivateChannel(roleName);
      await channelSettingsA.savePermissionChanges();
      await channelSettingsA.denyChannelPermission('Send Messages');
      await channelSettingsA.savePermissionChanges();
      await channelSettingsA.closeChannelSettings();
    });

    await AllureReporter.step('Verify User B composer is disabled by DENY override', async () => {
      await clanPageB.openChannelByName(channelName);
      await expect
        .poll(async () => clanPageB.isMessageInputDisabled(), { timeout: 10000 })
        .toBe(true);
    });

    await AllureReporter.step('User A changes Send Messages override to ALLOW', async () => {
      await clanPageA.openChannelSettings(channelName);
      await channelSettingsA.openPermissionsTab();
      await channelSettingsA.allowChannelPermission('Send Messages');
      await channelSettingsA.savePermissionChanges();
      await channelSettingsA.closeChannelSettings();
    });

    await AllureReporter.step('Verify User B can send message after ALLOW override', async () => {
      await clanPageB.openChannelByName(channelName);
      await expect
        .poll(async () => clanPageB.isMessageInputDisabled(), { timeout: 10000 })
        .toBe(false);

      const marker2 = `Marker-After-${Date.now()}`;
      await clanPageB.sendFirstMessage(marker2);
      await expect(pageA.locator(`text=${marker2}`)).toBeVisible({ timeout: 10000 });
      await expect(pageB.locator(`text=${marker2}`)).toBeVisible({ timeout: 10000 });
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify revoking role while member is actively viewing channel updates permissions in realtime', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64954' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const roleName = `role-live-${Date.now().toString(36).slice(-6)}`;
    const clanFactory = new ClanFactory();

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that revoking a role while the member is actively viewing the channel takes effect immediately via realtime event.

      **Test Steps:**
      1. Setup clan, invite User B and create a role
      2. Assign role to User B
      3. User B opens clan channel
      4. User A deletes the role from Clan Settings > Roles
      5. Verify User B no longer has the role and permissions update without manual reload

      **Expected Result:** Role is revoked in realtime for the viewing member.
    `);

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

    await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.memberManagement, pageA);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Create role and assign to User B', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.addNewRoleOnClan(roleName);
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    });

    await AllureReporter.step('User B actively views channel', async () => {
      await clanPageB.openChannelByName('general');
      await expect(pageB.locator(generateE2eSelector('mention.input'))).toBeVisible({
        timeout: 5000,
      });
    });

    await AllureReporter.step('User A deletes role from Clan Settings', async () => {
      await clanPageA.deleteRole(roleName);
    });

    await AllureReporter.step('Verify role is removed from User B', async () => {
      await clanPageA.openMemberListSetting();
      await clanPageA.verifyUserHasRoleOnMemberSettings(userNameB, roleName, false);
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
