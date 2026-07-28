import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { test } from '@/fixtures/dual.fixture';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { expect } from '@playwright/test';

test.describe('Voice Channel - Share Screen', () => {
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

  test('Verify that user can join voice channel and share screen', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can join voice channel and share screen

      **Test Steps:**
      1. User A creates a clan
      2. User A creates a voice channel
      3. User A invites User B to clan
      4. User B accepts invite
      5. User A joins voice channel
      6. User A shares screen
      7. Verify screen sharing is active

      **Expected Result:** User can join voice channel and share screen successfully
    `);

    await AllureReporter.addLabels({
      tag: ['voice-channel', 'share-screen'],
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

    const ran = Math.floor(Math.random() * 999) + 1;
    const channelName = `voice-channel-${ran}`;

    await AllureReporter.step(`Create new voice channel: ${channelName}`, async () => {
      await clanPageA.createNewChannel(ChannelType.VOICE, channelName);
      const isNewChannelPresent = await clanPageA.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('User A invites User B to clan and User B accepts it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User A joins voice channel', async () => {
      await clanPageA.joinVoiceChannel(channelName);
      // const isUserInVoiceChannel = await clanPageA.isJoinVoiceChannel(channelName);
      // expect(isUserInVoiceChannel).toBe(true);
    });

    // await AllureReporter.step('Verify voice room screen with control bar is visible', async () => {
    //   await clanPageA.verifyVoiceChannelScreenVisible(channelName);
    // });

    await AllureReporter.step('User A shares screen in voice channel', async () => {
      const isScreenSharing = await clanPageA.shareScreen();
      expect(isScreenSharing).toBe(true);
    });

    await AllureReporter.step(
      'Verify screen sharing is active and icon share screen is visible on the right of the name',
      async () => {
        await clanPageB.verifyShareIconIsVisible(userNameA);
      }
    );

    await test.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that share icon is visible when user share screen', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that share icon is visible when user share screen

      **Test Steps:**
      1. User A creates a clan
      2. User A creates a voice channel
      3. User A invites User B to clan
      4. User B accepts invite
      5. User A joins voice channel
      6. User A shares screen
      7. Verify screen sharing is active

      **Expected Result:** Share icon is visible when user shares screen
    `);

    await AllureReporter.addLabels({
      tag: ['voice-channel', 'share-screen'],
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
    const messagePageB = new MessagePage(pageB);
    const messageHelperB = new MessageTestHelpers(pageB);

    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
    });

    const ran = Math.floor(Math.random() * 999) + 1;
    const channelName = `voice-channel-${ran}`;

    await AllureReporter.step(`Create new voice channel: ${channelName}`, async () => {
      await clanPageA.createNewChannel(ChannelType.VOICE, channelName);
      const isNewChannelPresent = await clanPageA.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('User A invites User B to clan and User B accepts it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User A joins voice channel', async () => {
      await clanPageA.joinVoiceChannel(channelName);
    });

    await AllureReporter.step('User A shares screen in voice channel', async () => {
      const isScreenSharing = await clanPageA.shareScreen();
      expect(isScreenSharing).toBe(true);
    });

    await AllureReporter.step(
      'Verify screen sharing is active and icon share screen is visible on the right of the name',
      async () => {
        await clanPageB.verifyShareIconIsVisible(userNameA);
      }
    );

    await AllureReporter.step('Open DM list and verify share icon is visible', async () => {
      await messagePageB.openSearchModalbyPressCtrlK();
      await messageHelperB.openDMByNameOnsearchModal(userNameA);
      await messagePageB.shareScreenIconInDM();
    });

    await test.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
