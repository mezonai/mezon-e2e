import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures/dual.fixture';

const PRIVATE_VOICE_TAGS = ['voice-channel', 'private-channel', 'permissions'];
const accountA = AccountCredentials['account2-1'];
const accountB = AccountCredentials['account2-2'];
const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);

async function describeCase(description: string, tags: string[] = []): Promise<void> {
  await AllureReporter.addTestParameters({
    testType: AllureConfig.TestTypes.E2E,
    userType: AllureConfig.UserTypes.AUTHENTICATED,
    severity: AllureConfig.Severity.CRITICAL,
  });
  await AllureReporter.addDescription(description);
  await AllureReporter.addLabels({ tag: [...PRIVATE_VOICE_TAGS, ...tags] });
}

async function prepareFriendshipAndClan(
  pageA: Page,
  pageB: Page,
  clanFactory: ClanFactory
): Promise<{ clanPageA: ClanPage; clanPageB: ClanPage }> {
  const friendPageA = new FriendPage(pageA);
  const friendPageB = new FriendPage(pageB);
  const clanPageA = new ClanPage(pageA);
  const clanPageB = new ClanPage(pageB);

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
  await friendPageA.sendFriendRequestToUser(userNameB);
  await friendPageA.verifySentRequestToast();
  await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
  await friendPageB.acceptFirstFriendRequest();
  await friendPageA.assertAllFriend(userNameB);
  await friendPageB.assertAllFriend(userNameA);
  await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);

  await clanFactory.setupClan(ClanSetupHelper.configs.channelManagement, pageA);
  await clanPageA.clickButtonInvitePeopleFromMenu();
  const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
  await clanPageB.joinClanByUrlInvite(inviteUrl);

  return { clanPageA, clanPageB };
}

test.describe('Private Voice Channel - Access Control', () => {
  let clanFactory: ClanFactory;

  test.beforeEach(async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    clanFactory = new ClanFactory();
    await setupDualUsersSequentially(dual, accountA, accountB, directFriendsUrl);
  });

  test.afterEach(async ({ dual }) => {
    try {
      await clanFactory.cleanupClan(dual.pageA);
    } finally {
      await dual.parallel({
        A: page => AuthHelper.logout(page),
        B: page => AuthHelper.logout(page),
      });
    }
  });

  test('Public and private mode update channel-list access in realtime', async ({ dual }) => {
    await describeCase(
      `
      **Test Objective:** Verify public/private mode controls private voice visibility.

      **Test Steps:**
      1. Create a public voice channel and verify both clan members see it.
      2. Enable Private Channel without granting User B access.
      3. Verify the owner still sees it while User B does not.
      4. Disable Private Channel and verify User B sees it again.

      **Expected Result:** Channel-list visibility follows private mode without requiring reload.
    `,
      ['privacy-toggle', 'channel-list']
    );

    const { pageA, pageB } = dual;
    const { clanPageA, clanPageB } = await prepareFriendshipAndClan(pageA, pageB, clanFactory);
    const settingsA = new ChannelSettingPage(pageA);
    const channelName = `pvc-toggle-${Date.now().toString(36)}`.slice(0, 20);

    await clanPageA.createNewChannel(ChannelType.VOICE, channelName, ChannelStatus.PUBLIC);
    await clanPageA.verifyChannelVisibility(channelName, true);
    await clanPageB.verifyChannelVisibility(channelName, true);

    await clanPageA.openChannelSettings(channelName);
    await settingsA.setPrivateMode(true);
    await clanPageA.verifyChannelVisibility(channelName, true);
    await clanPageA.verifyVoiceChannelPrivacyIcon(channelName, true);
    await clanPageB.verifyChannelVisibility(channelName, false);

    await settingsA.setPrivateMode(false);
    await settingsA.closeChannelSettings();
    await clanPageA.verifyVoiceChannelPrivacyIcon(channelName, false);
    await clanPageB.verifyChannelVisibility(channelName, true);
  });

  test('Administrator can manage a private voice channel without channel ACL', async ({ dual }) => {
    await describeCase(
      `
      **Test Objective:** Verify an Administrator can discover private channels in Channel Management without bypassing channel ACL.

      **Test Steps:**
      1. Create a private voice channel and verify an ordinary member cannot see it.
      2. Create an Administrator role and assign it to the member.
      3. Reload User B after the role change.
      4. Verify the private voice channel remains hidden from the channel list without ACL.
      5. Open Channel Management and verify the private voice channel is listed for the Administrator.

      **Expected Result:** The Administrator can manage the private channel from Channel Management, but cannot access it from the channel list until granted channel ACL.
    `,
      ['administrator', 'channel-list', 'channel-management']
    );

    const { pageA, pageB } = dual;
    const { clanPageA, clanPageB } = await prepareFriendshipAndClan(pageA, pageB, clanFactory);
    const unique = Date.now().toString(36);
    const channelName = `pvc-admin-${unique}`.slice(0, 20);
    const roleName = `Admin-${unique}`.slice(0, 20);

    await clanPageA.createNewChannel(ChannelType.VOICE, channelName, ChannelStatus.PRIVATE);
    await clanPageA.verifyChannelVisibility(channelName, true);
    await clanPageB.verifyChannelVisibility(channelName, false);

    await clanPageA.openRoleSettingsPage();
    await clanPageA.createRoleWithPermission(roleName, 'Administrator');
    await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    // Clan-level role changes are rehydrated on navigation/reload in the current client.
    await pageB.reload();
    await clanPageB.verifyChannelVisibility(channelName, false);
    await clanPageB.openChannelsListSettingByUrl();
    expect(await clanPageB.isChannelPresentOnChannelManagement(channelName)).toBe(true);
  });

  test('Add and remove member access for a private voice channel', async ({ dual }) => {
    await describeCase(
      `
      **Test Objective:** Verify direct member access can be added and removed.

      **Test Steps:**
      1. Create a private voice channel hidden from User B.
      2. Add User B in channel Permissions and verify the channel appears.
      3. Remove User B and verify the channel disappears.

      **Expected Result:** Direct member ACL changes update User B's channel list in realtime.
    `,
      ['member-access', 'add-member', 'remove-member']
    );

    const { pageA, pageB } = dual;
    const { clanPageA, clanPageB } = await prepareFriendshipAndClan(pageA, pageB, clanFactory);
    const settingsA = new ChannelSettingPage(pageA);
    const channelName = `pvc-member-${Date.now().toString(36)}`.slice(0, 20);

    await clanPageA.createNewChannel(ChannelType.VOICE, channelName, ChannelStatus.PRIVATE);
    await clanPageB.verifyChannelVisibility(channelName, false);

    await clanPageA.openChannelSettings(channelName);
    await settingsA.openPermissionsTab();
    await settingsA.openAddMembersRolesModal();
    await settingsA.addMembersAndRolesForPrivateChannel(undefined, userNameB);
    await clanPageB.verifyChannelVisibility(channelName, true);

    await settingsA.removeMemberFromPrivateChannel(userNameB);
    await clanPageB.verifyChannelVisibility(channelName, false);
    await settingsA.closeChannelSettings();
  });

  test('Add and remove role access for a private voice channel', async ({ dual }) => {
    await describeCase(
      `
      **Test Objective:** Verify role-based access can be added and removed.

      **Test Steps:**
      1. Create a role, assign it to User B, and create a private voice channel.
      2. Add the role in channel Permissions and verify User B sees the channel.
      3. Remove the role from channel Permissions and verify the channel disappears.

      **Expected Result:** Role ACL changes update User B's channel list in realtime.
    `,
      ['role-access', 'add-role', 'remove-role']
    );

    const { pageA, pageB } = dual;
    const { clanPageA, clanPageB } = await prepareFriendshipAndClan(pageA, pageB, clanFactory);
    const settingsA = new ChannelSettingPage(pageA);
    const unique = Date.now().toString(36);
    const channelName = `pvc-role-${unique}`.slice(0, 20);
    const roleName = `Voice-${unique}`.slice(0, 20);

    await clanPageA.openRoleSettingsPage();
    await clanPageA.addNewRoleOnClan(roleName);
    await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    await clanPageA.createNewChannel(ChannelType.VOICE, channelName, ChannelStatus.PRIVATE);
    await clanPageB.verifyChannelVisibility(channelName, false);

    await clanPageA.openChannelSettings(channelName);
    await settingsA.openPermissionsTab();
    await settingsA.openAddMembersRolesModal();
    await settingsA.addMembersAndRolesForPrivateChannel(roleName);
    await clanPageB.verifyChannelVisibility(channelName, true);

    await settingsA.removeRoleFromPrivateChannel(roleName);
    await clanPageB.verifyChannelVisibility(channelName, false);
    await settingsA.closeChannelSettings();
  });

  test('Deleting a private voice channel removes it for every permitted member', async ({
    dual,
  }) => {
    await describeCase(
      `
      **Test Objective:** Verify private voice deletion is propagated to permitted members.

      **Test Steps:**
      1. Create a private voice channel and grant User B direct access.
      2. Verify both users see the channel.
      3. Delete the channel and verify it disappears for both users and Channel Management.

      **Expected Result:** No permitted user can see the deleted private voice channel.
    `,
      ['delete-channel', 'member-access']
    );

    const { pageA, pageB } = dual;
    const { clanPageA, clanPageB } = await prepareFriendshipAndClan(pageA, pageB, clanFactory);
    const settingsA = new ChannelSettingPage(pageA);
    const channelName = `pvc-delete-${Date.now().toString(36)}`.slice(0, 20);

    await clanPageA.createNewChannel(ChannelType.VOICE, channelName, ChannelStatus.PRIVATE);
    await clanPageA.openChannelSettings(channelName);
    await settingsA.openPermissionsTab();
    await settingsA.openAddMembersRolesModal();
    await settingsA.addMembersAndRolesForPrivateChannel(undefined, userNameB);
    await clanPageA.verifyChannelVisibility(channelName, true);
    await clanPageB.verifyChannelVisibility(channelName, true);

    await settingsA.deleteChannel();
    await clanPageA.verifyChannelVisibility(channelName, false);
    await clanPageB.verifyChannelVisibility(channelName, false);
    await clanPageA.openChannelsListSetting();
    expect(await clanPageA.isChannelPresentOnChannelManagement(channelName)).toBe(false);
  });
});
