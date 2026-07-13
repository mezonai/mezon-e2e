import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ProfilePage } from '@/pages/ProfilePage';
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
import { test } from '../../../fixtures/dual.fixture';

test.describe('Friend Management - Module 2', () => {
  const accountA = AccountCredentials['accountKien9'];
  const accountB = AccountCredentials['accountKien10'];
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);
  const setupModes = {
    parallel: setupDualUsersInParallel,
    sequential: setupDualUsersSequentially,
  };
  // const setupBeforeEach = setupModes.parallel;
  const setupBeforeEach = setupModes.sequential;

  test.beforeEach(async ({ dual }) => {
    await setupBeforeEach(dual, accountA, accountB, directFriendsUrl);
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await FriendHelper.cleanupMutualFriendRelationships(
      friendPageA,
      friendPageB,
      userNameA,
      userNameB
    );
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

  test('Verify that noti badge is display after receive friend request', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64789',
      github_issue: '9721',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that noti badge is display after receive friend request
      
      **Test Steps:**
      1. Clean up any existing friend relationships between users
      2. User A sends a friend request to User B
      3. Verify that the request was sent successfully with toast notification
      4. User B receives and verify noti badge is display
      5. User B reject the friend request and verify noti badge is not display
      
      **Expected Result:** Noti badge is display after receive friend request and not display after reject the friend request.
    `);

    const countBeforeSendRequest = await friendPageB.getFriendPendingBadgeCount();

    await test.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
    });

    await test.step('Verify user B noti badge is display after receive friend request', async () => {
      await friendPageB.assertFriendRequestExists(userNameA);
      await friendPageB.verifyFriendPendingBadgeIsDisplayed(countBeforeSendRequest);
    });

    await test.step('Clean up - remove friend request', async () => {
      const countBeforeRejectRequest = await friendPageB.getFriendPendingBadgeCount();
      await friendPageB.rejectFriendRequest(userNameA);
      await friendPageB.verifyFriendPendingBadgeIsDisappeared(countBeforeRejectRequest);
    });
  });

  test('Verify that user can unfriend from short profile', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64789',
      github_issue: '9721',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageB = new MessagePage(pageB);
    const messagePageA = new MessagePage(pageA);
    const profilePageA = new ProfilePage(pageA);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can unfriend from short profile
      
      **Test Steps:**
      1. Clean up any existing friend relationships between users
      2. User A sends a friend request to User B
      3. Verify that the request was sent successfully with toast notification
      4. User B receives and verify noti badge is display
      5. User A remove friend from short profile
      6. Verify that user A and user B are not friend anymore
      
      **Expected Result:** User can unfriend from short profile
    `);

    const countBeforeSendRequest = await friendPageB.getFriendPendingBadgeCount();

    await test.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
    });

    await test.step('Verify user B noti badge is display after receive friend request', async () => {
      await friendPageB.assertFriendRequestExists(userNameA);
      await friendPageB.verifyFriendPendingBadgeIsDisplayed(countBeforeSendRequest);
    });

    await AllureReporter.step('User B accepts friend request', async () => {
      await friendPageB.acceptFriendRequestFromUser(userNameA);
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await test.step('User A remove friend from short profile', async () => {
      await messagePageB.sendMessageWhenInDM('This is a message of user B before being unfriended');
      await pageA.waitForTimeout(1000);
      await profilePageA.openShortProfileFromUsernameOnChat(userNameB);
      await messagePageA.removeFriendFromShortProfile();
      await friendPageA.confirmRemoveFriend();
    });
  });
});
