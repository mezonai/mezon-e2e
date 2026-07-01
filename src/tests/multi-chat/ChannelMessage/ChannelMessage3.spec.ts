import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
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
import { expect, test } from '../../../fixtures/dual.fixture';
import { MessagePage } from '@/pages/MessagePage';

test.describe('Channel Message 3', () => {
  const accountA = AccountCredentials['accountKien2'];
  const accountB = AccountCredentials['accountKien3'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
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

  test('Verify that user is banned can not send message on topic', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user is banned can not send message on topic
      
      **Test Steps:**
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. User A send message on channel
      5. User A ban user B

      **Expected Result:** User is banned can not send message on topic
    `);

    await AllureReporter.addLabels({
      tag: ['clan', 'ban-user', 'topic', 'send-message'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
    const testMessage = `Test message - ${Date.now()}`;

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

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User A ban user B in channel', async () => {
      await pageA.waitForTimeout(1000);
      await pageA.reload();
      await clanPageA.openMemberList();
      await clanPageA.banUserByName(userNameB);
    });

    await AllureReporter.step('User A send a message on channel and create a topic', async () => {
      await messageHelperA.sendTextMessage(testMessage);
      await messageHelperA.createTopicToInitMessage(testMessage);
    });

    await AllureReporter.step('Verify user B can not send message on topic', async () => {
      await pageB.reload();
      // await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await messageHelperB.openTopicBoxByMessage(testMessage);

      const isMessageInputVisible = await clanPageB.isMessageInputVisible(true);
      expect(isMessageInputVisible).toBe(false);
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Send message from short profile in clan channel', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Send message from short profile in clan channel
      
      **Test Steps:**
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. User A send message from short profile

      **Expected Result:** Send message from short profile in clan channel
    `);

    await AllureReporter.addLabels({
      tag: ['clan', 'short-profile', 'send-message'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
    const testMessage = `Test message - ${Date.now()}`;
    const messagePageB = new MessagePage(pageB);

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

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User A send message to user B from short profile', async () => {
      await pageA.waitForTimeout(1000);
      await pageA.reload();
      await clanPageA.openMemberList();
      await messageHelperA.clickMemberInList(userNameB);
      await messageHelperA.sendMessageFromShortProfile(testMessage);
      await pageA.waitForTimeout(2000);
    });

    await AllureReporter.step('Verify message is visible on DM', async () => {
      await pageB.reload();
      await pageB.waitForTimeout(2000);
      await messagePageB.openSearchModalbyPressCtrlK();
      await messageHelperB.openDMByNameOnsearchModal(userNameA);
      const lastMessage = await messageHelperB.getLastMessageInChat();
      expect(lastMessage).toContain(testMessage);
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that user can share friend contact card in clan channel', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can share friend contact card in clan channel
      Steps:
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. User A share friend contact card in clan channel
      **Expected Result:** User can share friend contact card in clan channel
    `);

    await AllureReporter.addLabels({
      tag: ['clan', 'contact-card', 'share'],
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
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });
    const clanFactory = new ClanFactory();
    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User A share friend contact card in clan channel', async () => {
      await clanPageA.openMemberList();
      await clanPageA.clickShareContactByName(userNameB);
      await messageHelperA.verifyShareContactModalVisible();
      await messageHelperA.shareContactInDMOrChannel('general', true, clanFactory.getClanName());
    });
    await AllureReporter.step('Verify contact card message is visible on destination', async () => {
      await pageB.reload();
      // await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await messageHelperB.verifyContactSharedInDMOrChannel(`@${userNameB}`);
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that user can not share friend contact card to friend`s DM', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can not share friend contact card in friend's DM
      Steps:
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. User A share friend contact card to friend's DM
      **Expected Result:** User can not share friend contact card in friend's DM
    `);

    await AllureReporter.addLabels({
      tag: ['clan', 'contact-card', 'share', 'dm'],
    });
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messageHelperA = new MessageTestHelpers(pageA);
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

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User A click share friend contact card to friend`s dm', async () => {
      await pageA.waitForTimeout(1000);
      await pageA.reload();
      await clanPageA.openMemberList();
      await clanPageA.clickShareContactByName(userNameB);
      await messageHelperA.verifyShareContactModalVisible();
      await messageHelperA.shareContactInDMOrChannel(userNameB, false);
      await pageA.keyboard.press('Escape');
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that user can not call itself from share contact', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can not call itself from share contact
      Steps:
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. User A share friend contact card to channel
      5. User B verify call item is not present on shared contact card
      **Expected Result:** User can not call itself from share contact
    `);

    await AllureReporter.addLabels({
      tag: ['clan', 'contact-card', 'share', 'call'],
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
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });
    const clanFactory = new ClanFactory();
    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
    });
    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User A click share friend contact card to friend`s dm', async () => {
      await pageA.waitForTimeout(1000);
      await pageA.reload();
      await clanPageA.openMemberList();
      await clanPageA.clickShareContactByName(userNameB);
      await messageHelperA.verifyShareContactModalVisible();
      await messageHelperA.shareContactInDMOrChannel('general', true, clanFactory.getClanName());
    });

    await AllureReporter.step('Verify contact card message has not call item', async () => {
      await pageB.reload();
      // await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await messageHelperB.verifyContactSharedInDMOrChannel(`@${userNameB}`);
      await messageHelperB.verifyCallItemVisibleInShareContactCard(`@${userNameB}`, false);
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
