import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect } from '../../../../fixtures/dual.fixture';

import { test } from '@/fixtures/dual.fixture';

test.describe('Friend Management - Block User', () => {
  const accountA = AccountCredentials['account2-1'];
  const accountB = AccountCredentials['account2-2'];
  const userNameA = accountA.email.split('@')[0];
  const userNameB = accountB.email.split('@')[0];
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

  test('DM composer should become read-only when either user is blocked', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Ensure the direct message composer becomes read-only when a user blocks the other participant, regardless of who initiates the block. 
      
      **Test Steps:**
      1. Open a DM between User A and User B and confirm the composer is available for both
      2. User A blocks User B from the DM context menu
      3. Verify the composer shows the "no permission" state for both users and User B appears in User A's block list
      4. User A unblocks User B, reopens the DM, and confirms the composer becomes editable again
      5. User B blocks User A from the DM context menu
      6. Verify the composer shows the "no permission" state for both users and User A appears in User B's block list
      
      **Expected Result:** The DM composer becomes read-only immediately after either user blocks the other, and returns to editable once the block is removed.
    `);

    await test.step('Open DM between User A and User B', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await test.step('Verify DM composer is initially editable for both users', async () => {
      await expect(friendPageA.inputs.permissionDenied).toHaveCount(0);
      await expect(friendPageB.inputs.permissionDenied).toHaveCount(0);
    });

    await test.step('User A blocks User B from DM', async () => {
      await friendPageA.blockFriendFromDM();
    });

    await test.step('Composer becomes read-only for both users after User A blocks', async () => {
      await expect(friendPageA.inputs.permissionDenied).toHaveCount(1);
      await expect(friendPageB.inputs.permissionDenied).toHaveCount(1);
    });

    await test.step('Verify User B is visible in User A block list', async () => {
      await friendPageA.assertBlockFriend(userNameB);
    });

    await test.step('User A unblocks User B and reopens DM', async () => {
      await friendPageA.unblockFriend(userNameB);
      await friendPageA.assertBlockFriendNotVisible(userNameB);
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await test.step('Verify DM composer becomes editable again for both users', async () => {
      await expect(friendPageA.inputs.permissionDenied).toHaveCount(0);
      await expect(friendPageB.inputs.permissionDenied).toHaveCount(0);
    });

    await test.step('User B blocks User A from DM', async () => {
      await friendPageB.blockFriendFromDM();
    });

    await test.step('Composer becomes read-only for both users after User B blocks', async () => {
      await expect(friendPageA.inputs.permissionDenied).toHaveCount(1);
      await expect(friendPageB.inputs.permissionDenied).toHaveCount(1);
    });

    await test.step('Verify User A is visible in User B block list', async () => {
      await friendPageB.assertBlockFriend(userNameA);
    });
  });

  test('Welcome header block button reflects blocker and blocked states', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const welcomeContainerA = pageA.locator('[data-e2e="chat_welcome"]');
    const welcomeContainerB = pageB.locator('[data-e2e="chat_welcome"]');

    await AllureReporter.addDescription(`
      **Test Objective:** Ensure the chat welcome header toggles its block/unblock button correctly when the current user blocks someone versus when they are blocked by the other party.
      
      **Test Steps:**
      1. Open the DM on both sides and verify the initial Block action is visible
      2. Block the friend from the welcome header and confirm the button switches to Unblock
      3. Validate the blocked user no longer sees block/unblock buttons in their welcome header
      4. Unblock the friend from the welcome header and confirm the Block button returns
      5. Ensure the other user regains access to the Block action once the relationship is restored
      
      **Expected Result:** The welcome header shows Block → Unblock when the current user initiates a block, hides the action when blocked by someone else, and restores Block after unblocking.
    `);

    await test.step('Open DM on both sides and confirm Block button is visible', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
      await welcomeContainerA.waitFor({ state: 'visible', timeout: 10000 });
      const initialBlockButton = welcomeContainerA.locator('button', { hasText: 'Block' });
      await expect(initialBlockButton).toBeVisible({ timeout: 10000 });
    });

    await test.step('User A blocks User B from the welcome header', async () => {
      const blockButtonA = welcomeContainerA.locator('button', { hasText: 'Block' });
      await blockButtonA.click();
      await expect(welcomeContainerA.locator('button', { hasText: 'Unblock' })).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step('Blocked User B welcome header hides block actions', async () => {
      await welcomeContainerB.waitFor({ state: 'visible', timeout: 10000 });
      await pageB.waitForTimeout(1000);
      await expect(welcomeContainerB.locator('button', { hasText: 'Block' })).toHaveCount(0);
      await expect(welcomeContainerB.locator('button', { hasText: 'Unblock' })).toHaveCount(0);
    });

    await test.step('User A unblocks User B and Block button returns', async () => {
      const unblockButtonA = welcomeContainerA.locator('button', { hasText: 'Unblock' });
      await unblockButtonA.click();
      await expect(welcomeContainerA.locator('button', { hasText: 'Block' })).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step('User B regains Block action after unblock', async () => {
      await friendPageB.createDM(userNameA);
      await welcomeContainerB.waitFor({ state: 'visible', timeout: 10000 });
      await expect(welcomeContainerB.locator('button', { hasText: 'Block' })).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test('Real-time welcome header reacts when other user toggles block state', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const welcomeContainerA = pageA.locator('[data-e2e="chat_welcome"]');
    const welcomeContainerB = pageB.locator('[data-e2e="chat_welcome"]');

    await AllureReporter.addDescription(`
      **Test Objective:** Verify websocket friend events update the welcome header and composer in real time when another user blocks or unblocks you.
      
      **Test Steps:**
      1. Open the DM on both clients and confirm the composer is active with a Block button visible
      2. User B blocks User A from the welcome header
      3. Without refresh, User A sees the composer disabled and the welcome header actions disappear
      4. User B unblocks User A
      5. User A immediately regains the Block action and composer access
      
      **Expected Result:** Blocking and unblocking initiated by the other user propagate through websocket handlers, updating the UI on the remote client with no reload.
    `);

    await test.step('Open DM on both sides and confirm baseline actions', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
      await welcomeContainerA.waitFor({ state: 'visible', timeout: 10000 });
      await expect(friendPageA.inputs.permissionDenied).toHaveCount(0, { timeout: 10000 });
      await expect(welcomeContainerA.locator('button', { hasText: 'Block' })).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step('User B blocks User A from welcome header', async () => {
      await welcomeContainerB.waitFor({ state: 'visible', timeout: 10000 });
      const blockButtonB = welcomeContainerB.locator('button', { hasText: 'Block' });
      await expect(blockButtonB).toBeVisible({ timeout: 10000 });
      await blockButtonB.click();
      await expect(welcomeContainerB.locator('button', { hasText: 'Unblock' })).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step('User A UI reflects being blocked without refresh', async () => {
      await expect(friendPageA.inputs.permissionDenied).toHaveCount(1, { timeout: 10000 });
      await expect(welcomeContainerA.locator('button', { hasText: 'Block' })).toHaveCount(0, {
        timeout: 10000,
      });
      await expect(welcomeContainerA.locator('button', { hasText: 'Unblock' })).toHaveCount(0, {
        timeout: 10000,
      });
    });

    await test.step('User B unblocks User A and sees state revert', async () => {
      const unblockButtonB = welcomeContainerB.locator('button', { hasText: 'Unblock' });
      await unblockButtonB.click();
      await expect(welcomeContainerB.locator('button', { hasText: 'Block' })).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step('User A regains composer access and Block button in real time', async () => {
      await expect(friendPageA.inputs.permissionDenied).toHaveCount(0, { timeout: 10000 });
      await expect(welcomeContainerA.locator('button', { hasText: 'Block' })).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test('Real-time remote block keeps blocker out of my Block tab but disables DM', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const welcomeContainerB = pageB.locator('[data-e2e="chat_welcome"]');

    await AllureReporter.addDescription(`
      **Test Objective:** Ensure remote block events do not add the blocker to your Block tab (since source_id mismatches), yet the DM composer becomes read-only in real time.
      
      **Test Steps:**
      1. Open the DM on both sides and confirm the Block tab is empty for User A
      2. User B blocks User A from the welcome header
      3. Verify User A's composer flips to the no-permission state without reload
      4. Confirm User B still does not appear in User A's Block tab
      5. User B unblocks User A so subsequent tests start clean
      
      **Expected Result:** The Block tab continues to exclude the blocker, but messaging permissions are revoked immediately on the blocked side.
    `);

    await test.step('Open DM on both sides and confirm Block tab empty for User A', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
      await friendPageA.gotoFriendsPage();
      await friendPageA.tabs.block.click();
      await expect(friendPageA.lists.friendAll.filter({ hasText: userNameB })).toHaveCount(0, {
        timeout: 10000,
      });
    });

    await test.step('User B blocks User A from welcome header', async () => {
      await friendPageB.createDM(userNameA);
      await welcomeContainerB.waitFor({ state: 'visible', timeout: 10000 });
      const blockButtonB = welcomeContainerB.locator('button', { hasText: 'Block' });
      await expect(blockButtonB).toBeVisible({ timeout: 10000 });
      await blockButtonB.click();
      await expect(welcomeContainerB.locator('button', { hasText: 'Unblock' })).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step('User A composer shows read-only state without page refresh', async () => {
      await expect(friendPageA.inputs.permissionDenied).toHaveCount(1, { timeout: 10000 });
    });

    await test.step('Block tab still excludes blocker User B', async () => {
      await friendPageA.gotoFriendsPage();
      await friendPageA.tabs.block.click();
      await expect(friendPageA.lists.friendAll.filter({ hasText: userNameB })).toHaveCount(0, {
        timeout: 10000,
      });
    });

    await test.step('Cleanup by unblocking User A from User B side', async () => {
      const unblockButtonB = welcomeContainerB.locator('button', { hasText: 'Unblock' });
      await unblockButtonB.click();
      await friendPageA.gotoFriendsPage();
      await friendPageA.tabs.block.click();
      await expect(friendPageA.lists.friendAll.filter({ hasText: userNameB })).toHaveCount(0, {
        timeout: 10000,
      });
    });
  });
});
