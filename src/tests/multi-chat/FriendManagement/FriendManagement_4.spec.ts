import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { test } from '@/fixtures/dual.fixture';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

test.describe('Friend Management - Friend Removal Actions and Realtime Sync', () => {
  const accountA = AccountCredentials.accountKien1;
  const accountB = AccountCredentials.accountKien2;
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

  test('TC01: Cancel friend removal from confirmation modal and verify mutual friendship retained', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;

    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when User A initiates friend removal from the friend list more menu but cancels from the modal, both users remain friends.

      **Test Steps:**
      1. Establish mutual friendship between User A and User B
      2. User A opens the more actions menu for User B in the friend list
      3. User A clicks Remove Friend option
      4. User A clicks Cancel in the confirmation modal
      5. Verify that User A and User B remain visible in each other's friend list
    `);

    await AllureReporter.addLabels({
      tag: ['friend-management', 'cancel-remove-friend', 'multi-user'],
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
    });

    await AllureReporter.step('User A opens remove friend confirmation and cancels', async () => {
      await friendPageA.openMoreMenuForFriend(userNameB);
      await pageA.getByRole('button', { name: /remove/i }).click();
      await friendPageA.cancelRemoveFriend();
    });

    await AllureReporter.step('Verify both users remain mutual friends', async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
    });
  });

  test('TC02: Remove friend from friend list more menu and verify mutual removal in realtime', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;

    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when User A removes User B from the friend list, both users are removed from each other's friend list in realtime.

      **Test Steps:**
      1. Establish mutual friendship between User A and User B
      2. User A removes User B via the friend list more menu
      3. User A verifies User B is removed from All Friends
      4. User B verifies User A is removed from All Friends in realtime
    `);

    await AllureReporter.addLabels({
      tag: ['friend-management', 'remove-friend-sync', 'multi-user'],
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
    });

    await AllureReporter.step('User A removes User B from friend list', async () => {
      await friendPageA.removeFriend(userNameB);
    });

    await AllureReporter.step('Verify User B is removed from User A friend list', async () => {
      await friendPageA.assertFriendNotVisibleInCurrentTab(userNameB);
    });

    await AllureReporter.step(
      'Verify User A is removed from User B friend list in realtime',
      async () => {
        await friendPageB.assertFriendNotVisibleInCurrentTab(userNameA);
      }
    );
  });
});
