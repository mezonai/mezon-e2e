import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect } from '@playwright/test';
import { test } from '../../../fixtures/dual.fixture';

test.describe('Channel Messages - Search Filters', () => {
  const accountA = AccountCredentials.accountKien5;
  const accountB = AccountCredentials.accountKien6;
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);
  const CHANNEL_MESSAGE_TAG = 'channel-message';
  const SEARCH_TAG = 'search';
  const MULTI_USER_TAG = 'multi-user';
  const PREPARE_FRIENDSHIP_STEP = 'Prepare friendship and direct message';
  const CREATE_CHANNEL_STEP = 'User A creates a clan and text channel';
  const INVITE_MEMBER_STEP = 'User A invites User B to the clan';
  const SEND_MESSAGE_STEP = 'User A sends a message in the created channel';

  test.beforeEach(async ({ dual }) => {
    await setupDualUsersSequentially(dual, accountA, accountB, directFriendsUrl);
  });

  test.afterEach(async ({ dual }) => {
    await dual.parallel({
      A: page => AuthHelper.logout(page),
      B: page => AuthHelper.logout(page),
    });
  });

  test('Display clan members and default targets in From user search suggestions', async ({
    dual,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify the channel message search From user filter lists clan members and default targets.

      **Test Steps:**
      1. User A creates a clan and a text channel
      2. User A invites User B and User B joins the clan
      3. User A sends a message in the created channel
      4. User A opens channel search and enters >
      5. Verify the From user popover contains User A, User B, Everyone, and @here

      **Expected Result:** The From user suggestions display the clan owner, invited member, Everyone, and @here.
    `);
    await AllureReporter.addLabels({
      tag: [CHANNEL_MESSAGE_TAG, SEARCH_TAG, 'from-user', MULTI_USER_TAG],
    });

    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const clanFactory = new ClanFactory();
    const unique = Date.now().toString(36);
    const channelName = `search-${unique}`.slice(0, 20);
    const message = `search-message-${unique}`;

    await AllureReporter.step(PREPARE_FRIENDSHIP_STEP, async () => {
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
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
      await pageA.waitForTimeout(2000);
      await Promise.all([pageA.reload(), pageB.reload()]);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await AllureReporter.step(CREATE_CHANNEL_STEP, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      const channelCreated = await clanPageA.createNewChannel(
        ChannelType.TEXT,
        channelName,
        ChannelStatus.PUBLIC
      );
      expect(channelCreated).toBe(true);
    });

    await AllureReporter.step(INVITE_MEMBER_STEP, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);
    });

    await AllureReporter.step(SEND_MESSAGE_STEP, async () => {
      await clanPageA.openChannelByName(channelName);
      await messagePageA.sendMessageInCurrentChannel(message);
    });

    await AllureReporter.step('Verify From user search suggestions', async () => {
      await messagePageA.verifyChannelSearchFromUserSuggestions([userNameA, userNameB]);
    });

    await AllureReporter.attachScreenshot(pageA, 'Channel search From user suggestions');
    await clanFactory.cleanupClan(pageA);
  });

  test('Display clan members and default targets in Mentions search suggestions', async ({
    dual,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify the channel message search Mentions filter lists clan members and default targets.

      **Test Steps:**
      1. User A creates a clan and a text channel
      2. User A invites User B and User B joins the clan
      3. User A sends a message in the created channel
      4. User A opens channel search and enters ~
      5. Verify the Mentions popover contains User A, User B, Everyone, and @here

      **Expected Result:** The Mentions suggestions display the clan owner, invited member, Everyone, and @here.
    `);
    await AllureReporter.addLabels({
      tag: [CHANNEL_MESSAGE_TAG, SEARCH_TAG, 'mentions', MULTI_USER_TAG],
    });

    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const clanFactory = new ClanFactory();
    const unique = Date.now().toString(36);
    const channelName = `mention-${unique}`.slice(0, 20);
    const message = `mention-message-${unique}`;

    await AllureReporter.step(PREPARE_FRIENDSHIP_STEP, async () => {
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
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
      await pageA.waitForTimeout(2000);
      await Promise.all([pageA.reload(), pageB.reload()]);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await AllureReporter.step(CREATE_CHANNEL_STEP, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      const channelCreated = await clanPageA.createNewChannel(
        ChannelType.TEXT,
        channelName,
        ChannelStatus.PUBLIC
      );
      expect(channelCreated).toBe(true);
    });

    await AllureReporter.step(INVITE_MEMBER_STEP, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);
    });

    await AllureReporter.step(SEND_MESSAGE_STEP, async () => {
      await clanPageA.openChannelByName(channelName);
      await messagePageA.sendMessageInCurrentChannel(message);
    });

    await AllureReporter.step('Verify Mentions search suggestions', async () => {
      await messagePageA.verifyChannelSearchMentionSuggestions([userNameA, userNameB]);
    });

    await AllureReporter.attachScreenshot(pageA, 'Channel search Mentions suggestions');
    await clanFactory.cleanupClan(pageA);
  });

  test('Display content type filters in Has search suggestions', async ({ dual }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify the channel message search Has filter lists supported content types.

      **Test Steps:**
      1. User A creates a clan and a text channel
      2. User A invites User B and User B joins the clan
      3. User A sends a message in the created channel
      4. User A opens channel search and enters &
      5. Verify the Has popover contains video, link, and image

      **Expected Result:** The Has suggestions display video, link, and image filters.
    `);
    await AllureReporter.addLabels({
      tag: [CHANNEL_MESSAGE_TAG, SEARCH_TAG, 'has-filter', MULTI_USER_TAG],
    });

    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const clanFactory = new ClanFactory();
    const unique = Date.now().toString(36);
    const channelName = `has-${unique}`.slice(0, 20);
    const message = `has-message-${unique}`;

    await AllureReporter.step(PREPARE_FRIENDSHIP_STEP, async () => {
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
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
      await pageA.waitForTimeout(2000);
      await Promise.all([pageA.reload(), pageB.reload()]);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await AllureReporter.step(CREATE_CHANNEL_STEP, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      const channelCreated = await clanPageA.createNewChannel(
        ChannelType.TEXT,
        channelName,
        ChannelStatus.PUBLIC
      );
      expect(channelCreated).toBe(true);
    });

    await AllureReporter.step(INVITE_MEMBER_STEP, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);
    });

    await AllureReporter.step(SEND_MESSAGE_STEP, async () => {
      await clanPageA.openChannelByName(channelName);
      await messagePageA.sendMessageInCurrentChannel(message);
    });

    await AllureReporter.step('Verify Has search suggestions', async () => {
      await messagePageA.verifyChannelSearchHasSuggestions();
    });

    await AllureReporter.attachScreenshot(pageA, 'Channel search Has suggestions');
    await clanFactory.cleanupClan(pageA);
  });
});
