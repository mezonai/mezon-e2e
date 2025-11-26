import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '../../../fixtures/dual.fixture';

test.describe('Channel Message 1', () => {
  const accountA = AccountCredentials['account2-1'];
  const accountB = AccountCredentials['account2-2'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const clanFactory = new ClanFactory();

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

  test('Verify that when User A edits a message that mentions User B, the edited message appears correctly in User B`s inbox', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63368',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
        **Test Objective:** Verify that when User A edits a message that mentions User B, the edited message appears correctly in User B's inbox.
        
        **Test Steps:**
        1. Clean up any existing friend relationships between users
        2. User A sends a friend request to User B
        3. User B receives and accepts the friend request
        4. Verify both users see each other in their friends list
        5. User A create a clan
        6. User A invite user B to clan
        7. User B accept invite
        8. User A send message mention user B
        9. User A edit the original mention message
        10. User B check inbox for edited message
        
        **Expected Result:** User A edits a message that mentions User B, the edited message appears correctly in User B's inbox.
      `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
    const messagePageA = new MessagePage(pageA);
    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];

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

    const timestamp = Date.now();
    const uniqueMessage = `Hello @${userNameB} ${timestamp}`;
    const editedMessage = `Edited message @${userNameB} ${timestamp}`;
    await AllureReporter.step('User A send message mention user B', async () => {
      await messageHelperA.sendTextMessage(uniqueMessage);
    });

    await AllureReporter.step('User B find mention message on inbox', async () => {
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await messageHelperB.openHeaderInboxButton();
      await messageHelperB.assertMessageInInboxByContent(uniqueMessage);
    });

    await AllureReporter.step('User A edit mention message', async () => {
      const oldMessage = await messagePageA.getLastMessageWithProfileName(uniqueMessage);
      await messageHelperA.editMessage(oldMessage, editedMessage);
    });

    await AllureReporter.step('User B find edited mention message on inbox', async () => {
      await messageHelperB.openHeaderInboxButton();
      await messageHelperB.assertMessageInInboxByContent(editedMessage);
    });
  });

  test('Verify that user is banned cannot send message on channel', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user is banned cannot send message on channel
      
      **Test Steps:**
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. User A ban user B
      5. Verify user B can not send message on channel after ban

      **Expected Result:** User is banned cannot send message on channel
    `);

    await AllureReporter.addLabels({
      tag: ['clan', 'ban-user', 'send-message'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];

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
    await AllureReporter.step('User A ban user B in clan', async () => {
      await clanPageA.openMemberList();
      await clanPageA.banUserByName(userNameB);
    });

    await AllureReporter.step('Verify user can not send message on channel', async () => {
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      const isMessageInputVisible = await clanPageB.isMessageInputVisible();
      expect(isMessageInputVisible).toBe(false);
    });
  });

  test('Verify that banned item is visible on channel of user banned', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that banned item is visible on channel of user banned
      
      **Test Steps:**
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. User A ban user B

      **Expected Result:** Banned item is visible on channel of user banned
    `);

    await AllureReporter.addLabels({
      tag: ['clan', 'ban-user', 'banned-item'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];

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
    let duration: number | null;
    let unitTime: string | null;
    await AllureReporter.step('User A ban user B in clan', async () => {
      await clanPageA.openMemberList();
      const { value, unit } = await clanPageA.banUserByName(userNameB);
      duration = value;
      unitTime = unit;
    });

    await AllureReporter.step('Banned item is visible on channel of user banned', async () => {
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      const isBannedInputVisible = await clanPageB.isBannedItemVisible();
      expect(isBannedInputVisible).toBe(true);
      await pageB.reload();
      await clanPageB.verifyBannedTime(duration, unitTime);
    });
  });

  test('Verify that user is banned can not open context menu and react message', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user is banned can not open context menu and react message
      
      **Test Steps:**
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. User A send message on channel
      5. User A ban user B

      **Expected Result:** User is banned can not open context menu and react message
    `);

    await AllureReporter.addLabels({
      tag: ['clan', 'ban-user', 'context-menu', 'react-message'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];
    const messageHelperA = new MessageTestHelpers(pageA);

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

    await AllureReporter.step('User A ban user B in clan', async () => {
      await clanPageA.openMemberList();
      await clanPageA.banUserByName(userNameB);
    });

    await AllureReporter.step('User A send a message on channel', async () => {
      await messageHelperA.sendTextMessage('Text message');
    });

    await AllureReporter.step(
      'Verify user can not open context menu and hover message modal on banned channel',
      async () => {
        await pageB.reload();
        await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        const isReactionVisible = await clanPageB.isHoverMessageModalVisible();
        expect(isReactionVisible).toBe(false);
        const isContextMenuVisible = await clanPageB.isContextMenuVisible();
        expect(isContextMenuVisible).toBe(false);
      }
    );
  });

  test('Verify that user is banned can not buzz', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user is banned can not buzz

      **Test Steps:**
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. User A send message on channel
      5. User A ban user B
      6. User press ctrl+g to buzz

      **Expected Result:** User is banned can not buzz
    `);

    await AllureReporter.addLabels({
      tag: ['clan', 'ban-user', 'buzz'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];
    const messageHelperB = new MessageTestHelpers(pageB);

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

    await AllureReporter.step('Verify user B can not buzz on channel', async () => {
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });

      await messageHelperB.openBuzzMessageModal();

      const isBuzzModalVisuble = await messageHelperB.isBuzzModalOpen();
      expect(isBuzzModalVisuble).toBe(false);
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
    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];
    const messageHelperB = new MessageTestHelpers(pageB);
    const unique = Date.now().toString(36).slice(-6);
    const roleName = `Sushi ${unique}`;

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

    await AllureReporter.step('User A create a new role "Sushi"', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.addNewRoleOnClan(roleName);
    });

    await AllureReporter.step('User A add role "Sushi" to user B', async () => {
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    });

    await AllureReporter.step('User A send message mention role "Sushi"', async () => {
      await clanPageA.openChannelByName('general');
      await clanPageA.mentionByText(`@${roleName}`);
    });

    await AllureReporter.step('User B check inbox for role mention notification', async () => {
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await pageB.waitForTimeout(3000);
      await messageHelperB.openHeaderInboxButton();
      await messageHelperB.assertMessageInInboxByContent(`@${roleName}`);
    });
  });
});
