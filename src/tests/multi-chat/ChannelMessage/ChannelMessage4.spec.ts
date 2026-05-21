import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ROUTES } from '@/selectors';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import {
  getUsernamesFromEmails,
  setupDualUsersInParallel,
  setupDualUsersSequentially,
} from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { expect } from '@playwright/test';
import { test } from '../../../fixtures/dual.fixture';

test.describe('Channel Message 4', () => {
  const accountA = AccountCredentials['accountKien2'];
  const accountB = AccountCredentials['accountKien3'];
  const accountC = AccountCredentials['accountKien4'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const [userNameA, userNameB, userNameC] = getUsernamesFromEmails([
    accountA.email,
    accountB.email,
    accountC.email,
  ]);
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);
  const setupModes = {
    parallel: setupDualUsersInParallel,
    sequential: setupDualUsersSequentially,
  };
  // const setupBeforeEach = setupModes.parallel;
  const setupBeforeEach = setupModes.sequential;

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

  test('Verify that user can share contact in group', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);
    const unique = Date.now().toString(36).slice(-6);
    const nameGroupChat = `groupchat-${unique}`.slice(0, 20);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can share contact in group
      Steps:
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. User A share friend contact card on group
      **Expected Result:** User can share contact in group
    `);

    await AllureReporter.addLabels({
      tag: ['group', 'contact-card', 'share'],
    });
    const clanPageA = new ClanPage(pageA);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
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
      await friendPageA.sendFriendRequestToUser(userNameC);
      await friendPageA.verifySentRequestToast();
    });
    await AllureReporter.step(
      'User A create a group, send a message and update new avatar',
      async () => {
        await messagePageA.createGroup();
        await dual.pageA.waitForTimeout(1000);

        await messagePageA.sendMessageWhenInDM('This is a message to forward');
        await dual.pageA.waitForTimeout(1000);

        await messagePageA.updateNameGroupChatDM(nameGroupChat);
        await dual.pageA.waitForTimeout(1000);

        await messagePageA.openGroupFromName(nameGroupChat);
      }
    );

    await AllureReporter.step('User A click share friend contact card to group', async () => {
      await messagePageA.showMemberGroup();
      await clanPageA.clickShareContactByName(userNameB);
      await messageHelperA.verifyShareContactModalVisible();
      await messageHelperA.shareContactInDMOrChannel(nameGroupChat);
    });

    await AllureReporter.step('Verify contact card message is visible on destination', async () => {
      await pageB.reload();
      await messagePageB.openGroupFromName(nameGroupChat);
      await messageHelperB.verifyContactSharedInDMOrChannel(`@${userNameB}`);
      await messageHelperB.verifyCallItemVisibleInShareContactCard(`@${userNameB}`, false);
    });
  });

  test('Verify that user can share contact and when click button message on card, it will navigate to friend`s dm', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);
    const unique = Date.now().toString(36).slice(-6);
    const nameGroupChat = `groupchat-${unique}`.slice(0, 20);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can share contact and when click button message on card, it will navigate to friend's dm
      Steps:
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. User A share friend contact card on group
      **Expected Result:** User can share contact and when click button message on card, it will navigate to friend's dm
    `);

    await AllureReporter.addLabels({
      tag: ['group', 'contact-card', 'share', 'message-button'],
    });
    const clanPageA = new ClanPage(pageA);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
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
      await friendPageA.sendFriendRequestToUser(userNameC);
      await friendPageA.verifySentRequestToast();
    });
    await AllureReporter.step(
      'User A create a group, send a message and update new avatar',
      async () => {
        await messagePageA.createGroup();
        await dual.pageA.waitForTimeout(1000);

        await messagePageA.sendMessageWhenInDM('This is a message to forward');
        await dual.pageA.waitForTimeout(1000);

        await messagePageA.updateNameGroupChatDM(nameGroupChat);
        await dual.pageA.waitForTimeout(1000);

        await messagePageA.openGroupFromName(nameGroupChat);
      }
    );

    await AllureReporter.step('User A click share friend contact card to group', async () => {
      await messagePageA.showMemberGroup();
      await clanPageA.clickShareContactByName(userNameB);
      await messageHelperA.verifyShareContactModalVisible();
      await messageHelperA.shareContactInDMOrChannel(nameGroupChat);
    });

    await AllureReporter.step('Click message on share contact card', async () => {
      await pageB.reload();
      await messagePageB.openGroupFromName(nameGroupChat);
      await messageHelperB.verifyContactSharedInDMOrChannel(`@${userNameB}`);
      await messageHelperB.clickMessageOnShareContactCard();
    });

    await AllureReporter.step("Verify navigate to friend's dm", async () => {
      const usernameLocator = await messagePageB.getGroupName();
      await expect(usernameLocator).toHaveText(userNameB, { timeout: 3000 });
    });
  });

  test('Verify that user can join voice channel from link', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
      github_issue: '9816',
    });

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
        **Test Objective:** Verify that user can join voice channel from link
  
        **Test Steps:**
        1. Create new voice channel
        2. Join voice channel
        3. Copy voice channel link
        4. Send voice channel link in general channel
        4. Verify voice channel link is sent
  
        **Expected Result:** Voice channel link is sent
      `);

    await AllureReporter.addLabels({
      tag: ['voice-channel', 'send-voice-channel-link'],
    });
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
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
      await friendPageA.sendFriendRequestToUser(userNameC);
      await friendPageA.verifySentRequestToast();
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

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Join voice channel', async () => {
      await clanPageA.joinVoiceChannel(channelName);
      const isUserInVoiceChannel = await clanPageA.isJoinVoiceChannel(channelName);
      expect(isUserInVoiceChannel).toBe(true);
    });

    await AllureReporter.step('Copy and send voice channel link', async () => {
      await clanPageA.copyVoiceChannelLink();
      await clanPageA.openChannelByName('general');
      await messageHelperA.pasteAndSendTextV2();
      await pageA.waitForTimeout(3000);
    });

    await AllureReporter.step('Verify voice channel link is sent', async () => {
      const isVoiceChannelLinkSent = await messageHelperA.verifyLastMessageHasText(channelName);
      expect(isVoiceChannelLinkSent).toBe(true);
    });

    await AllureReporter.step('Verify voice channel link is visible to User B', async () => {
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      const isVoiceChannelLinkSent = await messageHelperB.verifyLastMessageHasText(channelName);
      expect(isVoiceChannelLinkSent).toBe(true);
    });

    await AllureReporter.step(
      'User B clicks on voice channel link and joins the channel',
      async () => {
        await clanPageB.joinVoiceChannelFromMessage(channelName);
        const isUserInVoiceChannel = await clanPageB.isJoinVoiceChannel(channelName);
        expect(isUserInVoiceChannel).toBe(true);
      }
    );
  });

  test('Verify that user can click wave to save hi and welcome message is visible', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
      github_issue: '9816',
    });

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
        **Test Objective:** Verify that user can click wave to save hi and welcome message is visible
  
        **Test Steps:**
        1. Invite friend to clan
        2. Friend accepts invite
        3. Clicks wave to say hi
        4. Verify welcome message is visible
      `);

    await AllureReporter.addLabels({
      tag: ['channel', 'wave', 'welcome-message'],
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
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage4, pageA);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User A clicks wave to say hi to User B', async () => {
      await clanPageA.clickWaveButton(userNameB);
    });

    await AllureReporter.step('Verify welcome message is visible to User B', async () => {
      const isWelcomeMessageVisible = await clanPageA.verifyWelcomeMessageInChannel();
      expect(isWelcomeMessageVisible).toBe(true);
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that user can share contact from short profile', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);
    const profilePageB = new ProfilePage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can share contact from short profile
      **Steps:**
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. User A share friend contact card from short profile on direct message
      **Expected Result:** User can share contact from short profile
    `);

    await AllureReporter.addLabels({
      tag: ['group', 'contact-card', 'share', 'short-profile'],
    });
    const messageHelperB = new MessageTestHelpers(pageB);
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
    });
    await AllureReporter.step('User A create DM with user B, send a message', async () => {
      await messagePageA.createDMByName(userNameB);
      await messagePageB.createDMByName(userNameA);
      await messagePageA.sendMessageWhenInDM('This is a message to forward');
      await dual.pageA.waitForTimeout(1000);
    });
    await AllureReporter.step(
      'User B open short profile of User A and share contact card to DM',
      async () => {
        await profilePageB.openShortProfileFromUsernameOnChat(userNameA);
        await messagePageB.clickShareContactButtonOnShortProfile();
        await messageHelperB.verifyShareContactModalVisible();
        await messageHelperB.shareContactInDMOrChannel(userNameC);
      }
    );
    await AllureReporter.step('Verify contact card message is visible on DM', async () => {
      await messagePageB.createDMByName(userNameC);
      await messageHelperB.verifyContactSharedInDMOrChannel(`@${userNameA}`);
    });
  });
});
