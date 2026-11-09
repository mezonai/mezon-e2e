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
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

test.describe('Channel Management - Realtime Channel Deletion Synchronization', () => {
  const accountA = AccountCredentials.accountKien5;
  const accountB = AccountCredentials.accountKien6;
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);

  test.beforeEach(async ({ dual }) => {
    await setupDualUsersSequentially(dual, accountA, accountB, directFriendsUrl);
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

  test('TC01: Verify deleted channel disappears in realtime for other clan members without reload', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const channelSettingPageA = new ChannelSettingPage(pageA);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when Clan Owner (User A) deletes a channel, User B immediately observes the channel removed from the sidebar channel list in realtime without reloading the page.

      **Test Steps:**
      1. User A and User B establish mutual friendship
      2. User A creates a new clan
      3. User A creates a dedicated text channel
      4. User A invites User B and User B joins the clan
      5. User B verifies the channel is visible in the channel list
      6. User A opens channel settings and deletes the channel
      7. User B verifies the channel disappears from the channel list in realtime
      8. Cleanup clan
    `);

    await AllureReporter.addLabels({
      tag: ['channel-management', 'channel-deletion-sync', 'multi-user'],
    });

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
    const channelName = `chan-${Date.now().toString(36)}`;

    try {
      await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
        await clanFactory.setupClan(ClanSetupHelper.configs.channelManagement, pageA);
      });

      await AllureReporter.step(`User A creates new channel: ${channelName}`, async () => {
        await clanPageA.createNewChannel(ChannelType.TEXT, channelName);
        const isCreated = await clanPageA.isNewChannelPresent(channelName);
        expect(isCreated).toBe(true);
      });

      await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
        await clanPageA.clickButtonInvitePeopleFromMenu();
        const url = await clanPageA.inviteUserToClanByUsername(userNameB);
        await clanPageB.joinClanByUrlInvite(url);
      });

      await AllureReporter.step(
        'User B verifies the channel is visible in clan sidebar',
        async () => {
          await clanPageB.verifyChannelVisibility(channelName, true);
        }
      );

      await AllureReporter.step(
        'User A opens channel settings and deletes the channel',
        async () => {
          await clanPageA.openChannelSettings(channelName);
          await channelSettingPageA.deleteChannel();
        }
      );

      await AllureReporter.step(
        'User B verifies the channel is removed from sidebar in realtime',
        async () => {
          await clanPageB.verifyChannelVisibility(channelName, false);
        }
      );
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });
});
