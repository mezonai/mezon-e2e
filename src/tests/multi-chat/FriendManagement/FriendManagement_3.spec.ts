import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
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
import { test } from '../../../fixtures/dual.fixture';

test.describe('Friend Management - Requests, Search, and Validation', () => {
  const accountA = AccountCredentials['accountKien9'];
  const accountB = AccountCredentials['accountKien10'];
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const VERIFY_REQUEST_EXISTS_STEP_NAME = 'Verify friend request exists on both sides';
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

  test('Should show an error when sending a duplicate pending friend request', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addWorkItemLinks({
      tms: '63461',
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that the system shows an error when trying to send a friend request to a user who already has a pending request.
       
      **Test Steps:**
      1. Clean up any existing friend relationships between users
      2. User A sends friend request to User B
      3. Verify that the request exists on both sides
      4. User A attempts to send another friend request to User B
      5. Verify that an appropriate error is shown for the duplicate request
       
      **Expected Result:** The system prevents duplicate friend requests and shows an error when attempting to send a request to a user who already has a pending request.
     `);

    await test.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
    });

    await test.step(VERIFY_REQUEST_EXISTS_STEP_NAME, async () => {
      await friendPageA.assertFriendRequestExists(userNameB);
      await friendPageB.assertFriendRequestExists(userNameA);
    });

    await test.step('Sent request again', async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.assertAlreadySentRequestError();
    });
  });

  test('Should show an error when adding an existing friend', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addWorkItemLinks({
      tms: '63461',
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that the system shows an error when trying to send a friend request to a user who is already a friend.
       
      **Test Steps:**
      1. Clean up any existing friend relationships between users
      2. User A sends friend request to User B
      3. Verify that the request exists on both sides
      4. User B accepts the friend request
      5. User A attempts to send another friend request to User B
      6. Verify that an appropriate error is shown for the duplicate request

      **Expected Result:** The system prevents duplicate friend requests and shows an error when attempting to send a request to a user who is already a friend.
     `);

    await test.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
    });

    await test.step(VERIFY_REQUEST_EXISTS_STEP_NAME, async () => {
      await friendPageA.assertFriendRequestExists(userNameB);
      await friendPageB.assertFriendRequestExists(userNameA);
    });

    await test.step('User B accepts the friend request', async () => {
      await friendPageB.acceptFirstFriendRequest();
      await friendPageB.assertAllFriend(userNameA);
      await friendPageA.assertAllFriend(userNameB);
    });

    await test.step('Sent request again', async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.assertAlreadyFriendError();
    });
  });

  test('Should automatically become friends when both users send friend requests', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addWorkItemLinks({
      tms: '63461',
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when the recipient sends a friend request back to someone who already sent them a request, they automatically become friends.
      
      **Test Steps:**
      1. Clean up any existing friend relationships between users
      2. User A sends friend request to User B
      3. Verify that the request exists on both sides
      4. User B sends a friend request back to User A
      5. Verify that both users automatically become friends
       
      **Expected Result:** When both users send friend requests to each other, they automatically become friends without needing to accept manually.
     `);

    await test.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
    });

    await test.step(VERIFY_REQUEST_EXISTS_STEP_NAME, async () => {
      await friendPageA.assertFriendRequestExists(userNameB);
      await friendPageB.assertFriendRequestExists(userNameA);
    });

    await test.step('The recipient sends a friend request back', async () => {
      await friendPageB.sendFriendRequestToUser(userNameA);
      await friendPageB.assertAllFriend(userNameA);
      await friendPageA.assertAllFriend(userNameB);
    });
  });
});
