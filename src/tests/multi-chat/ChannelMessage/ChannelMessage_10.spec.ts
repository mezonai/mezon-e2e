import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { expect } from '@playwright/test';
import { test } from '../../../fixtures/dual.fixture';
import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

test.describe('Channel Messages - Realtime Message Pin Banner and Unpin Sync', () => {
  const accountA = AccountCredentials.accountKien3;
  const accountB = AccountCredentials.accountKien4;
  const CHANNEL_MESSAGE_TAG = 'channel-message';
  const MULTI_USER_TAG = 'multi-user';
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

  test('TC01: Verify realtime topic pin banner sync across users when a message is pinned and unpinned in channel', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when User A pins and unpins a message in a channel, User B immediately observes the top pin banner appear and disappear in realtime.

      **Test Steps:**
      1. User A and User B establish mutual friendship
      2. User A sets up a clan and creates a dedicated text channel
      3. User A invites User B to the clan, and User B joins and opens the channel
      4. User A sends a message in the channel
      5. User B verifies the message appears in the channel
      6. User A pins the message
      7. User B verifies the top pin banner displays the pinned message in realtime without reloading
      8. User A unpins the message
      9. User B verifies the top pin banner is removed in realtime
    `);

    await AllureReporter.addLabels({
      tag: [CHANNEL_MESSAGE_TAG, 'pin-sync', 'unpin-sync', MULTI_USER_TAG],
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

    await AllureReporter.step(MULTI_CHAT_STEPS.acceptFriendRequest, async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.verifyMutualFriends, async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    const clanFactory = new ClanFactory();
    const unique = Date.now().toString(36);
    const pinnedText = `Realtime pin message ${unique}`;

    try {
      await AllureReporter.step('User A creates clan', async () => {
        await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage4, pageA);
      });

      await AllureReporter.step('User A invites User B and User B joins the clan', async () => {
        await clanPageA.clickButtonInvitePeopleFromMenu();
        const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
        await clanPageB.joinClanByUrlInvite(inviteUrl);
        await clanPageA.openChannelByName('general');
        await clanPageB.openChannelByName('general');
      });

      const messageHelperA = new MessageTestHelpers(pageA);
      const messageHelperB = new MessageTestHelpers(pageB);

      await AllureReporter.step('User A sends a message and User B receives it', async () => {
        await messageHelperA.sendTextMessage(pinnedText);
        const msgA = messageHelperA.getMessageItemLocator().filter({ hasText: pinnedText });
        await expect(msgA.last()).toBeVisible({ timeout: 15000 });

        const msgB = messageHelperB.getMessageItemLocator().filter({ hasText: pinnedText });
        await expect(msgB.last()).toBeVisible({ timeout: 15000 });
      });

      await AllureReporter.step(
        'User A pins the message and User B sees pin banner in realtime',
        async () => {
          await messagePageA.pinLastMessage();
          await messagePageB.verifyLatestPinnedMessageInHeader(pinnedText);
        }
      );

      await AllureReporter.step(
        'User A unpins the message and User B sees pin banner disappear in realtime',
        async () => {
          await messagePageA.unpinLastMessage();
          const pinItemB = pageB.locator(
            generateE2eSelector('chat.channel_message.topic_pin_banner.pin_item')
          );
          await expect(pinItemB).toBeHidden({ timeout: 10000 });
        }
      );
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });
});
