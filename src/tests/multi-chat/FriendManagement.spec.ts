import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect } from '@playwright/test';
import { test } from '../../fixtures/dual.fixture';

test.describe('Friend Management', () => {
  const accountA = AccountCredentials['account8'];
  const accountB = AccountCredentials['account9'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const VERIFY_REQUEST_EXISTS_STEP_NAME = 'Verify friend request exists on both sides';
  const CANCEL_REQUEST_STEP_NAME = 'User A cancels the friend request';
  const VERIFY_REQUEST_REMOVED_STEP_NAME =
    'Verify friend request is no longer visible on both sides';

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

  test('Verify that a user can send and accept a friend request', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63461',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully send and accept a friend request.
      
      **Test Steps:**
      1. Clean up any existing friend relationships between users
      2. User A sends a friend request to User B
      3. Verify that the request was sent successfully with toast notification
      4. User B receives and accepts the friend request
      5. Verify both users see each other in their friends list
      6. Clean up by removing the friend relationship
      
      **Expected Result:** The complete friend request flow works successfully with proper toast notifications and UI updates.
    `);

    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];

    await test.step(CLEANUP_STEP_NAME, async () => {
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
    });

    await test.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
      // await pageA.screenshot({
      //   path: `test-results/friend-request-sent-${Date.now()}.png`,
      //   fullPage: true,
      // });
    });

    await test.step('User B accepts the friend request', async () => {
      // await pageB.screenshot({
      //   path: `test-results/request-friend-toast-${Date.now()}.png`,
      //   fullPage: true,
      // });
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
      // await pageB.screenshot({
      //   path: `test-results/friend-request-accepted-${Date.now()}.png`,
      //   fullPage: true,
      // });
    });

    await test.step('Verify both users see each other as friends', async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);

      // Take screenshots of both users' friend lists
      await pageA.screenshot({
        path: `test-results/user-a-friends-list-${Date.now()}.png`,
        fullPage: true,
      });
      await pageB.screenshot({
        path: `test-results/user-b-friends-list-${Date.now()}.png`,
        fullPage: true,
      });
    });

    await test.step('Clean up - remove friend relationship', async () => {
      await friendPageA.removeFriend(userNameB);

      // Take screenshot after cleanup
      await pageA.screenshot({
        path: `test-results/final-cleanup-${Date.now()}.png`,
        fullPage: true,
      });
    });
  });

  test('Verify that a user can send and the receiver can reject a friend request', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63461',
    });
    await AllureReporter.addWorkItemLinks({
      tms: '63462',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can send a friend request and the receiver can reject it.
      
      **Test Steps:**
      1. Clean up any existing friend relationships between users
      2. User A sends a friend request to User B
      3. User B rejects the friend request
      4. Verify that the request is no longer visible in either user's friend list

      **Expected Result:** The friend request is sent successfully and the receiver can reject it.
    `);

    const [userNameB] = accountB.email.split('@');
    const [userNameA] = accountA.email.split('@');

    await test.step(CLEANUP_STEP_NAME, async () => {
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
    });

    await test.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
    });

    await test.step('User B rejects the friend request', async () => {
      await friendPageB.rejectFriendRequest(userNameA);
    });

    await test.step('Verify request is no longer visible', async () => {
      await friendPageA.assertFriendNotVisibleInCurrentTab(userNameB);
    });
  });

  test('Verify that a user can cancel her/his sent friend request', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63461',
    });
    await AllureReporter.addWorkItemLinks({
      tms: '63462',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can cancel a sent friend request.
      
      **Test Steps:**
      1. Clean up any existing friend relationships between users
      2. User A sends a friend request to User B
      3. Verify that the request was sent successfully
      4. User A cancels the friend request
      5. Verify that the request was cancelled successfully
      6. Verify that the request is no longer visible on either user's side

      **Expected Result:** The friend request is cancelled successfully.
      The request is not visible in the Pending tab.
    `);

    await test.step(CLEANUP_STEP_NAME, async () => {
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
    });

    await test.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
    });

    await test.step(VERIFY_REQUEST_EXISTS_STEP_NAME, async () => {
      await friendPageA.assertFriendRequestExists(userNameB);
      await friendPageB.assertFriendRequestExists(userNameA);
    });

    await test.step(CANCEL_REQUEST_STEP_NAME, async () => {
      await friendPageA.cancelFriendRequest(userNameB);
    });

    await test.step(VERIFY_REQUEST_REMOVED_STEP_NAME, async () => {
      const isSentRequestVisibleAfterCancel = await friendPageA.checkFriendRequestExists(userNameA);
      expect(isSentRequestVisibleAfterCancel).toBeFalsy();
      const isReceiverRequestVisibleAfterCancel =
        await friendPageB.checkFriendRequestExists(userNameA);
      expect(isReceiverRequestVisibleAfterCancel).toBeFalsy();
    });
  });

  test('Verify that a user can block and unblock a friend', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can block and unblock a friend.
      
      **Test Steps:**
      1. Clean up any existing friend relationships between users
      2. Establish friendship between users (send and accept friend request)
      3. User A blocks User B
      4. Verify that User B appears in the Block tab
      5. User A unblocks User B
      6. Verify that User B is no longer in the Block tab
      7. Verify that the friendship is restored

      **Expected Result:** The friend can be blocked successfully, appears in the Block tab, and can be unblocked to restore the friendship.
    `);

    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];

    await test.step(CLEANUP_STEP_NAME, async () => {
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
    });

    await test.step('Establish friendship between users', async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageB.acceptFirstFriendRequest();
      await friendPageA.assertAllFriend(userNameB);
    });

    await test.step('User A blocks User B', async () => {
      await friendPageA.blockFriend(userNameB);
    });

    await test.step('Verify User B appears in Block tab', async () => {
      await friendPageA.assertBlockFriend(userNameB);
    });

    await test.step('User A unblocks User B', async () => {
      await friendPageA.unblockFriend(userNameB);
    });

    await test.step('Verify friendship is restored', async () => {
      await friendPageA.assertBlockFriendNotVisible(userNameB);
      await friendPageB.assertAllFriend(userNameA);
    });
  });

  test('Verify friend search filters the list by username or display name', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await test.step(CLEANUP_STEP_NAME, async () => {
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
    });
    await test.step('Establish friendship between users', async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageB.acceptFirstFriendRequest();
    });

    await test.step('Navigate to Friends page and All tab', async () => {
      await friendPageA.gotoFriendsPage();
      await friendPageA.tabs.all.click();
    });

    await test.step('Search with partial username and verify friend is visible', async () => {
      await friendPageA.searchFriend(userNameB.slice(0, 3));
      await friendPageA.assertAllFriend(userNameB);
    });

    await test.step('Search with non-matching term and verify friend is not visible', async () => {
      await friendPageA.searchFriend('___no_match___');
      await friendPageA.assertFriendNotVisibleInCurrentTab(userNameB);
    });

    await test.step('Clear search and verify friend is visible again', async () => {
      await friendPageA.clearSearch();
      await friendPageA.assertAllFriend(userNameB);
    });
  });

  test('Verify send button disabled for invalid input and enabled for valid', async ({ dual }) => {
    const { pageA } = dual;
    const friendPageA = new FriendPage(pageA);

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await test.step('Navigate to Friends page and open Add Friend modal', async () => {
      await friendPageA.gotoFriendsPage();
      await friendPageA.clickAddFriendButton();
    });

    await test.step('Test invalid input - verify send button is disabled', async () => {
      // invalid input (contains space or special not allowed)
      await friendPageA.enterUsername('invalid user!');
      await expect(await friendPageA.isSendRequestDisabled()).toBeTruthy();
    });

    await test.step('Test valid input - verify send button is enabled', async () => {
      // valid input
      await friendPageA.clearAddFriendInput();
      await friendPageA.enterUsername('valid_user');
      await expect(await friendPageA.isSendRequestDisabled()).toBeFalsy();
    });
  });

  test('Should error when add friend to user who already sent', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];
    await AllureReporter.addWorkItemLinks({
      tms: '63461',
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully send and accept a friend request.
       
      **Test Steps:**
      1. Clean up any existing friend relationships between users
      2. User A sends friend request to User B
      3. User A sends friend request to User B again
      4. Verify that the request was sent successfully with toast notification
      5. User B receives and accepts the friend request
      6. Verify both users see each other in their friends list
      7. Clean up by removing the friend relationship
       
      **Expected Result:** The complete friend request flow works successfully with proper toast notifications and UI updates.
     `);

    await test.step(CLEANUP_STEP_NAME, async () => {
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
    });
    await test.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
    });

    await test.step(VERIFY_REQUEST_EXISTS_STEP_NAME, async () => {
      await dual.pageA.waitForTimeout(1000);
      await friendPageA.assertFriendRequestExists(userNameB);
      await friendPageB.assertFriendRequestExists(userNameA);
    });

    await test.step('Sent request again', async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.assertAlreadySentRequestError();
    });
  });
});
