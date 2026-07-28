import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
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
import { expect, test } from '../../../fixtures/dual.fixture';

test.describe('Topic Messages - Banned User Restrictions and Role Mentions', () => {
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
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage2, pageA);
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

  test('Verify that banned item is visible on topic of banned channel', async ({ dual }) => {
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
      tag: ['clan', 'ban-user', 'topic', 'banned-item'],
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
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage2, pageA);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    let duration: number | null;
    let unitTime: string | null;
    await AllureReporter.step('User A ban user B in clan', async () => {
      await pageA.waitForTimeout(1000);
      await pageA.reload();
      await clanPageA.openMemberList();
      const { value, unit } = await clanPageA.banUserByName(userNameB);
      duration = value;
      unitTime = unit;
    });

    await AllureReporter.step('User A send a message on channel and create a topic', async () => {
      await messageHelperA.sendTextMessage(testMessage);
      await messageHelperA.createTopicToInitMessage(testMessage);
    });

    await AllureReporter.step('User B is banned can not send message on topic', async () => {
      await pageB.reload();
      // await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await messageHelperB.openTopicBoxByMessage(testMessage);

      const isBannedInputVisible = await clanPageB.isBannedItemVisible(true);
      expect(isBannedInputVisible).toBe(true);
      await clanPageB.verifyBannedTime(duration, unitTime, true);
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that user is banned can not react message and open context menu on topic', async ({
    dual,
  }) => {
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
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage2, pageA);
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

    await AllureReporter.step(
      'Verify user B can not react or open context menu on topic message',
      async () => {
        await pageB.reload();
        // await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await messageHelperB.openTopicBoxByMessage(testMessage);
        const isReactionVisible = await clanPageB.isHoverMessageModalVisible(true);
        expect(isReactionVisible).toBe(false);

        const isContextMenuVisible = await clanPageB.isContextMenuVisible(true);
        expect(isContextMenuVisible).toBe(false);
      }
    );

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that user is banned can not forward message', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user is banned can not forward message

      **Test Steps:**
      1. User A create clan
      2. User A invite user B
      3. User A create a channel
      4. User B accept invite
      5. User A ban user B on created channel
      6. User B try to forward message to banned channel


      **Expected Result:** User is banned can not forward message to banned channel
    `);

    await AllureReporter.addLabels({
      tag: ['clan', 'ban-user', 'forward-message'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messageHelperB = new MessageTestHelpers(pageB);
    const messagePageB = new MessagePage(pageB);
    const testMessage = `Test message - ${Date.now()}`;
    const unique = Date.now().toString(36);
    const channelName = `tc-${unique}`.slice(0, 20);
    const FAILED_MESSAGE = 'Failed to forward message';

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
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage2, pageA);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User A create a channel', async () => {
      await clanPageA.createNewChannel(ChannelType.TEXT, channelName);
      const isNewChannelAPresent = await clanPageA.isNewChannelPresent(channelName);
      expect(isNewChannelAPresent).toBe(true);
    });

    await AllureReporter.step('User A ban user B in channel', async () => {
      await pageA.waitForTimeout(1000);
      await pageA.reload();
      await clanPageA.openMemberList();
      await clanPageA.banUserByName(userNameB);
    });

    await AllureReporter.step('Verify user B can not forward message to channel', async () => {
      await pageB.reload();
      // await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });

      await messageHelperB.sendTextMessage(testMessage);
      await messagePageB.openForwardMessageModal();

      const isBannedChannelPresentOnForwardModal =
        await messagePageB.isChannelPresentOnForwardModal(channelName);
      expect(isBannedChannelPresentOnForwardModal).toBe(true);

      await messagePageB.forwardMessageToChannel(channelName);
      await friendPageB.verifyReceivedRequestToast(FAILED_MESSAGE);
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that Role mention noti is displayed in Inbox', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
      github_issue: '10347',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that Role mention noti is displayed in Inbox
      
      **Test Steps:**
      1. User A invite user B to clan
      2. User B accept invite
      3. User A create a new role "Sushi"
      4. User A add role "Sushi" to user B
      5. User A send message mention role "Sushi"
      6. User B check inbox for role mention notification

      **Expected Result:** Role mention notification is displayed in user B's Inbox
    `);

    await AllureReporter.addLabels({
      tag: ['clan', 'role-mention', 'inbox'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
    const unique = Date.now().toString(36).slice(-6);
    const roleName = `Sushi ${unique}`;

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
      await clanFactory.setupClan(ClanSetupHelper.configs.blockUser, pageA);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User A create a new role "Sushi"', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.addNewRoleOnClan(roleName);
    });

    await AllureReporter.step('User A add role "Sushi" to user B', async () => {
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    });

    await AllureReporter.step('User A send message mention role "Sushi"', async () => {
      await clanPageA.openChannelByName('general');
      await messagePageA.mentionByText(roleName);
    });

    await AllureReporter.step('User B check inbox for role mention notification', async () => {
      await pageB.reload();
      // await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await pageB.waitForTimeout(3000);
      await messageHelperB.openHeaderInboxButton();
      await messageHelperB.assertMessageInInboxByContent(`@${roleName}`);
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
