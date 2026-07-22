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

test.describe('Channel Message 7', () => {
  const accountA = AccountCredentials['accountKien5'];
  const accountB = AccountCredentials['accountKien6'];
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

  test('Verify that user can vote on poll created by other user', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
      github_issue: '9816',
    });

    const { pageA, pageB } = dual;

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);

    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that user can vote on poll created by other user

    **Test Steps:**
    1. User A and User B become friends
    2. User A creates a clan and text channel
    3. User A invites User B to clan
    4. User A creates a poll
    5. User B votes on poll
    6. Verify vote is applied

    **Expected Result:** User B can vote on poll created by User A
  `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'poll', 'vote', 'multi-user'],
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

    const unique = Date.now().toString(36);
    const channelName = `tc-${unique}`.slice(0, 20);

    const question = `Poll question ${unique}`;
    const answers = ['Answer 1', 'Answer 2', 'Answer 3'];

    await AllureReporter.step('User A creates text channel', async () => {
      await clanPageA.createNewChannel(ChannelType.TEXT, channelName);
      expect(await clanPageA.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step('User A invites User B to clan', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);

      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);

      await pageB.reload();
    });

    await AllureReporter.step('User A creates poll', async () => {
      await messagePageA.openCreatePoll();
      await messagePageA.createPoll(question, answers);
      await messagePageA.verifyPollCard(question, answers);
    });

    await AllureReporter.step('User B votes on poll', async () => {
      await pageB.waitForTimeout(1000);
      await clanPageB.openChannelByName(channelName);
      await messagePageB.votePollByIndex(0);
    });

    await AllureReporter.step('Verify User B voted successfully', async () => {
      await messagePageB.verifyUserVoted(0);
    });
  });

  test('Verify that user cannot end poll created by other user', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
      github_issue: '9816',
    });

    const { pageA, pageB } = dual;

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);

    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that user cannot end poll created by other user

    **Test Steps:**
    1. User A and User B become friends
    2. User A creates a clan and text channel
    3. User A invites User B to clan
    4. User A creates a poll
    5. User B click right on poll
    6. Verify end poll option not visible

    **Expected Result:** Verify that user cannot end poll created by other user
  `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'poll', 'vote', 'multi-user'],
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

    const unique = Date.now().toString(36);
    const channelName = `tc-${unique}`.slice(0, 20);

    const question = `Poll question ${unique}`;
    const answers = ['Answer 1', 'Answer 2', 'Answer 3'];

    await AllureReporter.step('User A creates text channel', async () => {
      await clanPageA.createNewChannel(ChannelType.TEXT, channelName);
      expect(await clanPageA.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step('User A invites User B to clan', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);

      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);

      await pageB.reload();
    });

    await AllureReporter.step('User A creates poll', async () => {
      await messagePageA.openCreatePoll();
      await messagePageA.createPoll(question, answers);
      await messagePageA.verifyPollCard(question, answers);
    });

    await AllureReporter.step(
      'User B click right on poll and verify that end poll option not visible',
      async () => {
        await pageB.waitForTimeout(1000);
        await clanPageB.openChannelByName(channelName);
        const endPollButtonVisible = await messagePageB.verifyEndPollOptionVisible();
        await expect(endPollButtonVisible).toBeFalsy();
      }
    );
  });
  test('Verify that user can not share contact for themselves.', async ({ dual }) => {
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
        **Test Objective:** Verify that user can not share contact for themselves.
        **Steps:**
        1. User A create clan
        2. User A invite user B
        3. User B accept invite
        4. User A send message to user B
        5. User B click on user A avatar to open short profile and share friend contact card from short profile on direct message
          6. Verify cannot share contact with themselves
        **Expected Result:** User can not share contact for themselves.
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
      }
    );
    await AllureReporter.step('Verify cannot share contact with themselves', async () => {
      await messageHelperB.shareContactInDMOrChannel(userNameB, false);
      await pageB.keyboard.press('Escape');
    });
  });

  test('Verify that user can not share contact for the person`s contact.', async ({ dual }) => {
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
        **Test Objective:** Verify that user can not share contact for person's contact.
        **Steps:**
        1. User A create clan
        2. User A invite user B
        3. User B accept invite
        4. User A send message to user B
        5. User B click on user A avatar to open short profile and share friend contact card from short profile on direct message
        **Expected Result:** User can not share contact for person's contact
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
      }
    );
    await AllureReporter.step('Verify cannot share contact for the person`s contact.', async () => {
      await messageHelperB.shareContactInDMOrChannel(userNameA, false);
      await pageB.keyboard.press('Escape');
    });
  });

  test('Verify that shows count badge in search modal for unread DM', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that shows count badge in search modal for unread DM

    **Test Steps:**
    1. User A and User B become friends
    2. User A creates DM with User B
    3. User A sends a message to User B
    4. User B opens search modal and verifies badge on suggest_item

    **Expected Result:** Badge is displayed in search modal for unread DM
    `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'badge', 'search-modal', 'suggest_item'],
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

    await AllureReporter.step('User B accepts the friend request', async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step('Verify both users see each other as friends', async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
    });

    await AllureReporter.step('User A create DM with user B and send a message', async () => {
      await messagePageA.createDMByName(userNameB);
      await pageB.goto(directFriendsUrl);
      await pageB.waitForTimeout(2000);
      await messagePageA.sendMessageWhenInDM('Test message for badge');
      await pageA.waitForTimeout(2000);
    });

    await AllureReporter.step(
      'User B opens search modal and verifies badge on suggest_item',
      async () => {
        await messagePageB.verifyBadgeOnSearchModal(userNameA, true);
      }
    );
  });
});
