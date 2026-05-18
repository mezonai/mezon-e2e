import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { test } from '@/fixtures/dual.fixture';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
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

test.describe('Friend Management - Block User', () => {
  const accountA = AccountCredentials['accountKien10'];
  const accountB = AccountCredentials['accountKien1'];
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);
  const setupOptions = { delayBeforeBMs: 200 };
  const setupModes = {
    parallel: setupDualUsersInParallel,
    sequential: setupDualUsersSequentially,
  };
  // const setupBeforeEach = setupModes.parallel;
  const setupBeforeEach = setupModes.sequential;

  test.beforeEach(async ({ dual }) => {
    await setupBeforeEach(dual, accountA, accountB, directFriendsUrl, setupOptions);
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

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
    await test.step('Establish friendship between users', async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageB.acceptFirstFriendRequest();
      await friendPageA.assertAllFriend(userNameB);
    });
  });
  test.afterEach(async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await Promise.allSettled([
      friendPageA.unblockFriend(userNameB),
      friendPageB.unblockFriend(userNameA),
    ]);
    await dual.parallel({
      A: async () => {
        await AuthHelper.logout(dual.pageA);
      },
      B: async () => {
        await AuthHelper.logout(dual.pageB);
      },
    });
  });

  test('Should remove call action in DM header after blocking friend', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Confirm that blocking a friend removes the call action from the DM header for both participants. 
      
      **Test Steps:**
      1. Users open a direct message conversation
      2. Verify the call action is visible in the header for both users
      3. User A blocks User B from the DM
      4. Validate that the call action disappears for both users
      
      **Expected Result:** The call action is no longer available in the DM header for either side once the block is applied.
    `);

    await test.step('Open DM between User A and User B', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await test.step('Verify call action visible before blocking', async () => {
      await messagePageA.assertDMHeaderCallVisible();
      await messagePageB.assertDMHeaderCallVisible();
    });

    await test.step('User A blocks User B from the DM', async () => {
      await friendPageA.blockFriendFromDM(userNameB);
      await friendPageA.page.waitForTimeout(1000);
    });

    await test.step('Verify call action removed for blocked pair', async () => {
      await messagePageA.assertDMHeaderCallNotVisible();
      await messagePageB.assertDMHeaderCallNotVisible();
    });
  });

  test('Should remove add member action in DM header after blocking friend', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Ensure blocking a friend removes the add member action from the DM header for the blocked pair. 
      
      **Test Steps:**
      1. Users open a direct message conversation
      2. Verify the add member action is visible in the header for both users
      3. User A blocks User B from the DM
      4. Confirm the add member action is removed for both users
      
      **Expected Result:** The DM header no longer shows the add member action for either side after blocking.
    `);

    await test.step('Open DM between User A and User B', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await test.step('Verify add member action visible before blocking', async () => {
      await messagePageA.assertDMHeaderAddMemberVisible();
      await messagePageB.assertDMHeaderAddMemberVisible();
    });

    await test.step('User A blocks User B from the DM', async () => {
      await friendPageA.blockFriendFromDM(userNameB);
      await friendPageA.page.waitForTimeout(1000);
    });

    await test.step('Verify add member action removed for blocked pair', async () => {
      await messagePageA.assertDMHeaderAddMemberNotVisible();
      await messagePageB.assertDMHeaderAddMemberNotVisible();
    });
  });

  test('Should remove video call action in DM header after blocking friend', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);

    await AllureReporter.addDescription(`
        **Test Objective:** Ensure blocking a friend removes the video call action from the DM header for the blocked pair. 
        
        **Test Steps:**
        1. Users open a direct message conversation
        2. Verify the video call action is visible in the header for both users
        3. User A blocks User B from the DM
        4. Confirm the video call action is removed for both users
        
        **Expected Result:** The DM header no longer shows the video call action for either side after blocking.
      `);

    await test.step('Open DM between User A and User B', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await test.step('Verify add member action visible before blocking', async () => {
      await messagePageA.assertDMHeaderVideoCallVisible();
      await messagePageB.assertDMHeaderVideoCallVisible();
    });

    await test.step('User A blocks User B from the DM', async () => {
      await friendPageA.blockFriendFromDM(userNameB);
      await friendPageA.page.waitForTimeout(1000);
    });

    await test.step('Verify add member action removed for blocked pair', async () => {
      await messagePageA.assertDMHeaderVideoCallNotVisible();
      await messagePageB.assertDMHeaderVideoCallNotVisible();
    });
  });
});
