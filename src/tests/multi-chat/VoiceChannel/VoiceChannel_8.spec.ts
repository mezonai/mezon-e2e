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

test.describe('Voice Channel - Dual User Join and Realtime Disconnect Sync', () => {
  const accountA = AccountCredentials.accountKien3;
  const accountB = AccountCredentials.accountKien4;
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

  test('TC01: Verify dual users join a voice channel and disconnect in realtime', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that both users can join a voice channel simultaneously and when one user disconnects, the channel member list updates in realtime.

      **Test Steps:**
      1. Establish mutual friendship between User A and User B
      2. User A creates a clan and creates a dedicated voice channel
      3. User A invites User B to the clan and User B accepts
      4. User A joins the voice channel
      5. User B joins the voice channel
      6. Verify both users are present in the voice channel
      7. User B leaves the voice channel
      8. User A observes User B has left the voice channel in realtime
      9. Cleanup clan
    `);

    await AllureReporter.addLabels({
      tag: ['voice-channel', 'dual-join-disconnect-sync', 'multi-user'],
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
    const channelName = `voice-${Date.now().toString(36)}`;

    try {
      await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
        await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      });

      await AllureReporter.step(`User A creates new voice channel: ${channelName}`, async () => {
        await clanPageA.createNewChannel(ChannelType.VOICE, channelName);
        const isNewChannelPresent = await clanPageA.isNewChannelPresent(channelName);
        expect(isNewChannelPresent).toBe(true);
      });

      await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
        await clanPageA.clickButtonInvitePeopleFromMenu();
        const url = await clanPageA.inviteUserToClanByUsername(userNameB);
        await clanPageB.joinClanByUrlInvite(url);
      });

      await AllureReporter.step('User A joins voice channel', async () => {
        const isJoinedVoiceChannel = await clanPageA.joinVoiceChannel(channelName);
        expect(isJoinedVoiceChannel).toBe(true);
      });

      await AllureReporter.step('User B joins voice channel', async () => {
        const isJoinedVoiceChannel = await clanPageB.joinVoiceChannel(channelName);
        expect(isJoinedVoiceChannel).toBe(true);
      });

      await AllureReporter.step('Verify both users are in the voice channel', async () => {
        const isUserAInVoice = await clanPageA.isUserInVoiceChannel(channelName, userNameA);
        expect(isUserAInVoice).toBe(true);

        const isUserBInVoice = await clanPageA.isUserInVoiceChannel(channelName, userNameB);
        expect(isUserBInVoice).toBe(true);
      });

      await AllureReporter.step('User B leaves the voice channel', async () => {
        const isLeft = await clanPageB.leaveVoiceChannel(channelName);
        expect(isLeft).toBe(true);
      });

      await AllureReporter.step(
        'Verify User B is no longer in the voice channel on User A side',
        async () => {
          await clanPageA.verifyUserNotInVoiceChannel(channelName, userNameB);
        }
      );
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });
});
