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
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect } from '@playwright/test';
import { test } from '../../../fixtures/dual.fixture';

test.describe('Channel Message 7', () => {
  const accountA = AccountCredentials['accountKien5'];
  const accountB = AccountCredentials['accountKien6'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);

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
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
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
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
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
});
