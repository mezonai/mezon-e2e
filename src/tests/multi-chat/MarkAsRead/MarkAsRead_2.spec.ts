import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { test } from '@/fixtures/dual.fixture';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import {
  getUsernamesFromEmails,
  setupDualUsersInParallel,
  setupDualUsersSequentially,
} from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';

test.describe('Unread State - Mark Clans, Channels, and Direct Messages as Read', () => {
  const accountA = AccountCredentials['accountKien7'];
  const accountB = AccountCredentials['accountKien8'];
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

  test('Verify that I can mark as read on direct message (avatar badge count)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that I can mark as read on direct message.
      
      **Test Steps:**
      1. User A send message for user B
      2. Verify icon avatar of user A on left side bar is visible and has badge
      3. Click mark as read on message
      4. Verify icon avatar of user A on left side bar is visible and has not badge

      **Expected Result:** I can mark as read on direct message.
    `);

    await AllureReporter.addLabels({
      tag: ['direct-message', 'mark-as-read', 'icon-badge', 'avatar'],
    });

    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
    let userADMChatURL: string;

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
      const url = pageB.url();
      userADMChatURL = url;
      await pageB.goto(ROUTES.DIRECT_FRIENDS);
    });

    await AllureReporter.step(`User A send message to user B on direct message:`, async () => {
      await messageHelperA.sendTextMessage('Text message');
    });

    await AllureReporter.step(
      'Verify user A on friends list with new messages have highlight',
      async () => {
        await messageHelperB.verifyDMAvatarIconOnSidebarVisible(userADMChatURL);
      }
    );
    await AllureReporter.step('User B click mark as read', async () => {
      await messageHelperB.clickButtonMarkAsReadByUsername(userNameA);
    });
    await AllureReporter.step(
      'Verify that channels with new messages not have have highlight',
      async () => {
        await messageHelperB.verifyDMAvatarIconOnSidebarVisible(userADMChatURL, false);
      }
    );
  });
});
