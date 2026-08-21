import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { test } from '@/fixtures/dual.fixture';
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
import { expect } from '@playwright/test';

test.describe('Voice Channel - Kick User From Call', () => {
  const accountA = AccountCredentials['account2-3'];
  const accountB = AccountCredentials['account2-4'];
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

  test('Verify that owner can kick another user out of the voice call', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that owner can kick another user out of the voice call

      **Test Steps:**
      1. User A creates a clan
      2. User A creates a voice channel
      3. User A invites User B to clan
      4. User B accepts invite
      5. Both users join the voice channel
      6. Verify both users are in the voice channel
      7. User A (owner) kicks User B out of the voice call
      8. Verify User B is removed from the voice channel

      **Expected Result:** Owner can kick another user out of the voice call and the kicked user is no longer in the voice channel
    `);

    await AllureReporter.addLabels({
      tag: ['voice-channel', 'kick-user-from-call'],
    });

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
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
    });

    const channelName = `voice-${Date.now().toString(36)}-${test.info().parallelIndex}`;

    await AllureReporter.step(`Create new voice channel: ${channelName}`, async () => {
      await clanPageA.createNewChannel(ChannelType.VOICE, channelName);
      const isNewChannelPresent = await clanPageA.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('User A invites User B to clan and User B accepts it', async () => {
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

    await AllureReporter.step('Owner (User A) kicks User B out of the voice call', async () => {
      const isKicked = await clanPageA.kickUserFromVoiceCall(userNameB);
      expect(isKicked).toBe(true);
    });

    await AllureReporter.step(
      'Verify User B is no longer in the voice room screen on owner side',
      async () => {
        const isUserBStillInRoom = await clanPageA.isUserInVoiceRoomScreen(userNameB);
        expect(isUserBStillInRoom).toBe(false);

        const isUserBStillInVoice = await clanPageA.isUserInVoiceChannel(channelName, userNameB);
        expect(isUserBStillInVoice).toBe(false);
      }
    );

    await AllureReporter.step(
      'Verify User B has left the voice channel on their own side',
      async () => {
        const isUserBStillInVoice = await clanPageB.isUserInVoiceChannel(channelName, userNameB);
        expect(isUserBStillInVoice).toBe(false);
      }
    );

    await test.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
