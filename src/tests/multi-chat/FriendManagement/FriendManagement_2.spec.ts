import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { test } from '../../../fixtures/dual.fixture';

test.describe('Friend Management', () => {
  const accountA = AccountCredentials['account8'];
  const accountB = AccountCredentials['account9'];
  const userNameA = accountA.email.split('@')[0];
  const userNameB = accountB.email.split('@')[0];
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';

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
});
