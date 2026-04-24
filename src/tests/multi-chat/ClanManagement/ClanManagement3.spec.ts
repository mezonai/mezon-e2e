import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { test } from '@/fixtures/dual.fixture';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect } from '@playwright/test';

test.describe('Clan Management 3', () => {
  const accountA = AccountCredentials['account2-3'];
  const accountB = AccountCredentials['account2-4'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);

  test.beforeEach(async ({ dual }) => {
    await dual.parallel({
      A: async () => {
        const credentials = await AuthHelper.setupAuthWithEmailPassword(dual.pageA, accountA);
        await AuthHelper.prepareBeforeTest(
          dual.pageA,
          joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS),
          credentials
        );
      },
      B: async () => {
        const credentials = await AuthHelper.setupAuthWithEmailPassword(dual.pageB, accountB);
        await AuthHelper.prepareBeforeTest(
          dual.pageB,
          joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS),
          credentials
        );
      },
    });
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

  test('Verify that I can add role to private channel and verify that user is visible on member lists of channel', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64954',
      github_issue: '9685',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that I can add role to private channel and verify that user is visible on member lists of channel.

      **Test Steps:**
      1. Invite User B to clan
      2. Add new role with delete message permissions to User B
      3. Create public channel
      4. Change permission of channel to private
      5. Add role to channel
      **Expected Result:** I can add role to private channel and verify that user is visible on member lists of channel.
    `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const roleName = `role-${Date.now().toString(36).slice(-8)}`;
    const unique = Date.now().toString(36);
    const channelName = `tc-${unique}`.slice(0, 20);
    const channelSettingsA = new ChannelSettingPage(pageA);

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

    await AllureReporter.step('User B accepts the friend request', async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step('Verify both users see each other as friends', async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });
    const clanFactory = new ClanFactory();
    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement2, pageA);
    });

    await AllureReporter.step(`User A create new text channel: ${channelName}`, async () => {
      await clanPageA.createNewChannel(ChannelType.TEXT, channelName);
      const isNewChannelPresent = await clanPageA.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step(
      'Add new role with delete message permissions to User B',
      async () => {
        await clanPageA.openRoleSettingsPage();
        await clanPageA.createRoleWithPermission(roleName, 'Delete Messages');
        await clanPageA.addRoleForUserByUsername(userNameB, roleName);
      }
    );

    await AllureReporter.step(
      'User A update channel to private and add members, roles',
      async () => {
        await clanPageA.openChannelSettings(channelName);
        await channelSettingsA.openPermissionsTab();
        await channelSettingsA.updateChannelStatusAndOpenAddMembersRolesModal();
        await channelSettingsA.addMembersAndRolesForPrivateChannel(roleName);
        await channelSettingsA.closeChannelSettings();
      }
    );

    await AllureReporter.step(
      'Verify that user B is visible on member list of channel',
      async () => {
        await clanPageA.openChannelByName(channelName);
        await clanPageA.openMemberList();
        const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameB);
        expect(memberItem).toBeVisible({ timeout: 3000 });
      }
    );

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
