import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect } from '@playwright/test';
import { test } from '../../../fixtures/dual.fixture';

test.describe('Channel Message 5', () => {
  const accountA = AccountCredentials['accountKien2'];
  const accountB = AccountCredentials['accountKien3'];
  const accountC = AccountCredentials['accountKien4'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const clanFactory = new ClanFactory();
  const [userNameA, userNameB, userNameC] = getUsernamesFromEmails([
    accountA.email,
    accountB.email,
    accountC.email,
  ]);

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
  test('Verify that profile status reflect correct on channel member list', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64803',
      github_issue: '10162',
    });
    const { pageA, pageB } = dual;
    const profilePageA = new ProfilePage(pageA);
    const friendPageB = new FriendPage(pageB);
    const friendPageA = new FriendPage(pageA);
    const clanPageA = new ClanPage(pageA);

    await AllureReporter.addDescription(`
          **Test Objective:** Verify that profile status reflect correct on channel member list
          **Test Steps:**
          1. User A set profile status to 'Do Not Disturb' for '30 Minutes'
          2. Verify that new profile status reflect correct on channel member list
          
          **Expected Result:** Profile status reflect correct on channel member list
        `);

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
      await friendPageA.cleanupFriendRelationships(userNameC);
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

    await AllureReporter.step(
      "User A set profile status to 'Do Not Disturb' for '30 Minutes'",
      async () => {
        const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();
        await profilePageA.openFooterProfileModal();
        await profilePageA.openSelectProfileStatusModal(currentProfileStatus);

        await profilePageA.setProfileStatus('Do Not Disturb', 'For 30 Minutes');
      }
    );

    const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();

    await AllureReporter.step('verify it is visible on channel member list', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.openMemberList();
      const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameA);
      await profilePageA.verifyNewProfileStatusVisibleDueToLocator(
        memberItem,
        currentProfileStatus
      );
    });
  });

  test('Verify that profile status reflect correct on channel short profile', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64803',
      github_issue: '10162',
    });
    const { pageA, pageB } = dual;
    const profilePageA = new ProfilePage(pageA);
    const friendPageB = new FriendPage(pageB);
    const friendPageA = new FriendPage(pageA);
    const clanPageA = new ClanPage(pageA);

    await AllureReporter.addDescription(`
          **Test Objective:** Verify that profile status reflect correct on channel short profile
          **Test Steps:**
          1. User A set profile status to 'Do Not Disturb' for '30 Minutes'
          2. Verify that new profile status reflect correct on channel short profile
          
          **Expected Result:** Profile status reflect correct on channel short profile
        `);

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
      await friendPageA.cleanupFriendRelationships(userNameC);
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

    await AllureReporter.step(
      "User A set profile status to 'Do Not Disturb' for '30 Minutes'",
      async () => {
        const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();
        await profilePageA.openFooterProfileModal();
        await profilePageA.openSelectProfileStatusModal(currentProfileStatus);

        await profilePageA.setProfileStatus('Do Not Disturb', 'For 30 Minutes');
      }
    );

    const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();

    await AllureReporter.step('verify it is visible on channel short profile', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.openMemberList();
      const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameA);
      await memberItem.click();
      const profileLocator = await profilePageA.getUserProfileLocator();
      await profilePageA.verifyNewProfileStatusVisibleDueToLocator(
        profileLocator,
        currentProfileStatus
      );
    });
  });

  test('Verify that profile status reflect correct on channel full profile', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64803',
      github_issue: '10162',
    });
    const { pageA, pageB } = dual;
    const profilePageA = new ProfilePage(pageA);
    const friendPageB = new FriendPage(pageB);
    const friendPageA = new FriendPage(pageA);
    const clanPageA = new ClanPage(pageA);

    await AllureReporter.addDescription(`
          **Test Objective:** Verify that profile status reflect correct on channel full profile
          **Test Steps:**
          1. User A set profile status to 'Do Not Disturb' for '30 Minutes'
          2. Verify that new profile status reflect correct on channel full profile
          
          **Expected Result:** Profile status reflect correct on channel full profile
        `);

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
      await friendPageA.cleanupFriendRelationships(userNameC);
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

    await AllureReporter.step(
      "User A set profile status to 'Do Not Disturb' for '30 Minutes'",
      async () => {
        const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();
        await profilePageA.openFooterProfileModal();
        await profilePageA.openSelectProfileStatusModal(currentProfileStatus);

        await profilePageA.setProfileStatus('Do Not Disturb', 'For 30 Minutes');
      }
    );

    const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();

    await AllureReporter.step('verify it is visible on channel full profile', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.openMemberList();
      const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameA);
      await memberItem.click({ button: 'right' });
      const profileLocator = await profilePageA.getUserProfileLocator();
      await profilePageA.verifyNewProfileStatusVisibleDueToLocator(
        profileLocator,
        currentProfileStatus
      );
    });
  });

  test('Verify that user cannot forward message for another one who has been blocked', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageB = new MessagePage(pageB);
    const messageHelperA = new MessageTestHelpers(pageA);

    await AllureReporter.addDescription(`
        **Test Objective:** Ensure that a user cannot forward messages to a friend who has been blocked. 
        
        **Test Steps:**
        1. Users open a direct message conversation
        2. User A sends a message in the DM
        3. User A attempts to forward the message to User B (who is then blocked)
        4. User A blocks User B from the DM
        5. User A attempts to forward another message to User B after blocking
        
        **Expected Result:** User cannot forward messages to a friend who has been blocked
      `);

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
      await friendPageA.cleanupFriendRelationships(userNameC);
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

    await test.step('Open DM between User A and User B', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await test.step('User A blocks User B from the DM', async () => {
      await friendPageA.blockFriendFromDM(userNameB);
      await friendPageA.page.waitForTimeout(1000);
    });

    await AllureReporter.step(
      'User A send a message on channel, forward message and verify block user not in modal ',
      async () => {
        await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        const messageContent = `Message to forward ${Date.now()}`;
        await messageHelperA.sendTextMessage(messageContent);
        await messagePageB.openForwardMessageModal();

        const isBlockedUserPresentOnForwardModal =
          await messagePageB.isChannelPresentOnForwardModal(userNameB);
        expect(isBlockedUserPresentOnForwardModal).toBe(false);

        await dual.pageA.keyboard.press('Escape');
      }
    );
  });

  test('Verify that user A can add friend and send message after block user B', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
    const clanPageA = new ClanPage(pageA);

    await AllureReporter.addDescription(`
        **Test Objective:** Ensure that a user can add a friend and send messages after blocking another user. 
        
        **Test Steps:**
        1. Users open a direct message conversation
        2. User A sends a message in the DM
        3. User A attempts to forward the message to User B (who is then blocked)
        4. User A blocks User B from the DM
        5. User A attempts to forward another message to User B after blocking
        
        **Expected Result:** User can add a friend and send messages after blocking another user
      `);

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
      await friendPageA.cleanupFriendRelationships(userNameC);
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

    await test.step('Open DM between User A and User B', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await test.step('User A blocks User B from the DM', async () => {
      await friendPageA.blockFriendFromDM(userNameB);
      await friendPageA.page.waitForTimeout(1000);
    });

    await AllureReporter.step('User A send request to add User B as friend again', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.openMemberList();
      const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameB);
      await memberItem.click({ button: 'right' });
      await clanPageA.clickAddFriendButtonFromModal();
      await friendPageA.verifySentRequestToast();
    });

    await AllureReporter.step(
      'User A send message to user B from short profile and verify message sent successfully',
      async () => {
        const messageContent = `Message after block ${Date.now()}`;
        await messageHelperA.sendTextMessage(messageContent);
        const lastMessage = await messageHelperB.getLastMessageInChat();
        expect(lastMessage).toContain(messageContent);
      }
    );
  });
});
