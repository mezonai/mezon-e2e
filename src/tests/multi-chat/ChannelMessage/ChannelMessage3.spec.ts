import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '../../../fixtures/dual.fixture';

test.describe('Channel Message 3', () => {
  const accountA = AccountCredentials['accountKien2'];
  const accountB = AccountCredentials['accountKien3'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const clanFactory = new ClanFactory();
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage1,
      credentials: accountA,
    });
  });

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

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({
      browser,
      clanFactory,
      credentials: accountA,
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

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User A ban user B in channel', async () => {
      await clanPageA.openMemberList();
      await clanPageA.banUserByName(userNameB);
    });

    await AllureReporter.step('User A send a message on channel and create a topic', async () => {
      await messageHelperA.sendTextMessage(testMessage);
      await messageHelperA.createTopicToInitMessage(testMessage);
    });

    await AllureReporter.step('Verify user B can not send message on topic', async () => {
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await messageHelperB.openTopicBoxByMessage(testMessage);

      const isMessageInputVisible = await clanPageB.isMessageInputVisible(true);
      expect(isMessageInputVisible).toBe(false);
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

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
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

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User A send message to user B from short profile', async () => {
      await clanPageA.openMemberList();
      await messageHelperA.clickMemberInList(userNameB);
      await messageHelperA.sendMessageFromShortProfile(testMessage);
      await pageA.waitForTimeout(2000);
    });

    await AllureReporter.step('Verify message is visible on DM', async () => {
      await pageB.reload();
      const lastMessage = await messageHelperB.getLastMessageInChat();
      expect(lastMessage).toContain(testMessage);
    });
  });
});
