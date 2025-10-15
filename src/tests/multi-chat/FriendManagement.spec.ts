import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect } from '@playwright/test';
import { test } from '../../fixtures/dual.fixture';

test.describe('Friend Management', () => {
  const accountA = AccountCredentials['account8'];
  const accountB = AccountCredentials['account9'];

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
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully send a friend request to another user.
      
      **Test Steps:**
      1. Navigate to the Friends page
      2. Click "Add Friend" button
      3. Enter username in the username input
      4. Click "Send Friend Request" button
      5. Verify that the request was sent successfully
      
      **Expected Result:** The friend request is sent successfully and the send button becomes disabled.
    `);

    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];

    await test.step('Clean up existing friend relationships', async () => {
      await friendPageA.removeFriend(userNameB);
      await pageA.screenshot({
        path: `test-results/remove-friend-user-a-${Date.now()}.png`,
        fullPage: true,
      });
      await friendPageA.removeFriendRequest(userNameB);
      await pageA.screenshot({
        path: `test-results/remove-friend-request-user-a-${Date.now()}.png`,
        fullPage: true,
      });
      await friendPageB.removeFriend(userNameA);
      await pageB.screenshot({
        path: `test-results/remove-friend-user-b-${Date.now()}.png`,
        fullPage: true,
      });
      await friendPageB.removeFriendRequest(userNameA);
      await pageB.screenshot({
        path: `test-results/remove-friend-request-user-b-${Date.now()}.png`,
        fullPage: true,
      });
    });

    await test.step('User A sends friend request to User B', async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await pageA.screenshot({
        path: `test-results/friend-request-sent-${Date.now()}.png`,
        fullPage: true,
      });
    });

    await test.step('User B accepts the friend request', async () => {
      await pageB.screenshot({
        path: `test-results/request-friend-toast-${Date.now()}.png`,
        fullPage: true,
      });
      await friendPageB.acceptFirstFriendRequest();
      await pageB.screenshot({
        path: `test-results/friend-request-accepted-${Date.now()}.png`,
        fullPage: true,
      });
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
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can send a friend request and the receiver can reject it.
      
      **Test Steps:**
      1. Navigate to the Friends page
      2. Click "Add Friend" button
      3. Enter username in the username input
      4. Click "Send Friend Request" button
      5. Verify that the request was sent successfully
      6. Navigate to the Friends page of the receiver
      7. Click "Pending" tab
      8. Verify that the request is visible in the Pending tab
      9. Click "Reject" button
      10. Verify that the request was rejected successfully
      11. Navigate to the Friends page of the sender
      12. Click "All" tab
      13. Verify that the request is not visible in the All tab

      **Expected Result:** The friend request is sent successfully and the receiver can reject it.
    `);

    const [userNameB] = accountB.email.split('@');
    const [userNameA] = accountA.email.split('@');

    await friendPageA.sendFriendRequestToUser(userNameB);

    await friendPageB.rejectFriendRequest(userNameA);

    await friendPageA.assertFriendNotVisibleInCurrentTab(userNameB);
  });

  test('Verify that a user can cancel a sent friend request', async ({ dual }) => {
    const { pageA } = dual;
    const friendPageA = new FriendPage(pageA);

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can cancel a sent friend request.
      
      **Test Steps:**
      1. Navigate to the Friends page
      2. Click "Add Friend" button
      3. Enter username in the username input
      4. Click "Send Friend Request" button
      5. Verify that the request was sent successfully
      6. Click "Cancel" button
      7. Verify that the request was cancelled successfully

      **Expected Result:** The friend request is cancelled successfully.
      The request is not visible in the Pending tab.
    `);

    const userNameB = accountB.email.split('@')[0];
    await friendPageA.sendFriendRequestToUser(userNameB);

    await friendPageA.cancelFriendRequest(userNameB);
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
      1. Navigate to the Friends page
      2. Click "Add Friend" button
      3. Enter username in the username input
      4. Click "Send Friend Request" button
      5. Verify that the request was sent successfully
      6. Click "Block" button
      7. Verify that the request was blocked successfully
      8. Click "Unblock" button
      9. Verify that the request was unblocked successfully

      **Expected Result:** The friend request is blocked successfully and the request is visible in the Block tab.
    `);

    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];

    const existFriend = await friendPageA.checkFriendExists(userNameB);

    if (existFriend) {
      await friendPageA.removeFriend(userNameB);
    }

    await friendPageA.sendFriendRequestToUser(userNameB);
    await friendPageB.acceptFirstFriendRequest();

    await friendPageA.assertAllFriend(userNameB);

    await friendPageA.blockFriend(userNameB);

    await friendPageA.assertBlockFriend(userNameB);

    await friendPageA.unblockFriend(userNameB);
    await friendPageA.assertBlockFriendNotVisible(userNameB);

    await friendPageB.assertAllFriend(userNameA);
  });

  test('Verify friend search filters the list by username or display name', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const userNameB = accountB.email.split('@')[0];

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await friendPageA.sendFriendRequestToUser(userNameB);
    await friendPageB.acceptFirstFriendRequest();

    await friendPageA.gotoFriendsPage();
    await friendPageA.tabs.all.click();

    // search match
    await friendPageA.searchFriend(userNameB.slice(0, 3));
    await friendPageA.assertAllFriend(userNameB);

    // search not match
    await friendPageA.searchFriend('___no_match___');
    await friendPageA.assertFriendNotVisibleInCurrentTab(userNameB);

    // clear
    await friendPageA.clearSearch();
    await friendPageA.assertAllFriend(userNameB);
  });

  test('Verify send button disabled for invalid input and enabled for valid', async ({ dual }) => {
    const { pageA } = dual;
    const friendPageA = new FriendPage(pageA);

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await friendPageA.gotoFriendsPage();
    await friendPageA.clickAddFriendButton();

    // invalid input (contains space or special not allowed)
    await friendPageA.enterUsername('invalid user!');
    await expect(await friendPageA.isSendRequestDisabled()).toBeTruthy();

    // valid input
    await friendPageA.clearAddFriendInput();
    await friendPageA.enterUsername('valid_user');
    await expect(await friendPageA.isSendRequestDisabled()).toBeFalsy();
  });
});
