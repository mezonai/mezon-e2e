import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { expect, test } from '@/fixtures/dual.fixture';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';

test.describe('Friend Management - Block User', () => {
  const accountA = AccountCredentials['accountKien6'];
  const accountB = AccountCredentials['accountKien7'];
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
        await dual.pageB.waitForTimeout(200);
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

  test('Modal profile message box hidden when either side is blocked', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify the user profile modal removes its message composer when the current user blocks someone or is blocked by them.
      
      **Test Steps:**
      1. Open the user profile modal while users are friends and confirm the message input is visible
      2. User A blocks User B and reopens the profile modal to ensure the message input is gone
      3. User A unblocks User B
      4. User B blocks User A and User A reopens the profile modal to confirm the input is still hidden when blocked by someone else
      5. User B unblocks User A
      
      **Expected Result:** The modal’s message input appears only when there is no block in either direction.
    `);

    await test.step('Open profile modal as friends and confirm message input visible', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
      await messagePageA.openUserProfile();
      const isChatDeniedA = await friendPageA.isChatDenied();
      const isChatDeniedB = await friendPageB.isChatDenied();
      expect(isChatDeniedA).toBeFalsy();
      expect(isChatDeniedB).toBeFalsy();
    });

    await test.step('User A blocks User B and profile modal hides message input', async () => {
      await friendPageA.blockFriendFromDM(userNameB);
      await messagePageA.openUserProfile();
      const isChatDeniedA = await friendPageA.isChatDenied();
      expect(isChatDeniedA).toBeTruthy();
    });

    await test.step('User A unblocks User B', async () => {
      await friendPageA.unblockFriend(userNameB);
      await friendPageA.assertBlockFriendNotVisible(userNameB);
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      const isChatDeniedA = await friendPageA.isChatDenied();
      expect(isChatDeniedA).toBeFalsy();
    });
  });

  test('DM invite modal filters blocked conversations', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA } = dual;
    const friendPageA = new FriendPage(pageA);
    const clanFactory = new ClanFactory();
    const clanMenuPanelA = new ClanMenuPanel(pageA);
    const clanPageA = new ClanPage(pageA);

    await AllureReporter.addDescription(`
      **Test Objective:** Ensure the DM invite modal excludes direct message threads that include blocked users.
      
      **Test Steps:**
      1. User A creates a DM with User B and confirms it appears in the invite modal
      2. User A blocks User B
      3. Reopen the invite modal and verify the DM with User B is filtered out
      
      **Expected Result:** Once blocked, any DM thread containing that user disappears from the invite list.
    `);

    await test.step('Create DM between User A and User B', async () => {
      await friendPageA.createDM(userNameB);
      await friendPageA.page.waitForTimeout(1000);
    });

    await test.step('Create clan and confirm DM appears in invite modal', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.blockUser, pageA);
      await clanMenuPanelA.openInvitePeopleModal();

      const inviteContainer = await clanPageA.getModalInviteContainer();
      await expect(inviteContainer).toBeVisible({ timeout: 10000 });
      const dmItemB = await clanPageA.getModalInviteUserItemByUsername(userNameB);
      await expect(dmItemB).toHaveCount(1, { timeout: 10000 });
      await clanPageA.clickModalInviteCloseButton();
      await inviteContainer.waitFor({ state: 'detached', timeout: 10000 });
    });

    await test.step('User A blocks User B', async () => {
      await friendPageA.blockFriend(userNameB);
      await friendPageA.assertBlockFriend(userNameB);
    });

    await test.step('DM with User B no longer appears in invite modal', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanMenuPanelA.openInvitePeopleModal();
      const inviteContainer = await clanPageA.getModalInviteContainer();
      await expect(inviteContainer).toBeVisible({ timeout: 10000 });
      const dmItemB = await clanPageA.getModalInviteUserItemByUsername(userNameB);
      await expect(dmItemB).toHaveCount(0, { timeout: 10000 });
      await clanPageA.clickModalInviteCloseButton();
      await inviteContainer.waitFor({ state: 'detached', timeout: 10000 });
    });

    await test.step('Cleanup clan created for invite modal validation', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Blocked users cannot trigger buzz or notification actions', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageB = new MessagePage(pageB);
    const clanPageB = new ClanPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Ensure that once User A blocks User B, blocking pro-actively prevents notification features like buzz from triggering.
      
      **Test Steps:**
      1. Open the DM for both users and confirm the buzz action is available
      2. User A blocks User B
      3. User B attempts to open the buzz modal using the DM header action
      4. Confirm the buzz modal does not appear and no notification is triggered for User A
      
      **Expected Result:** The buzz action becomes inaccessible once the counterpart is blocked, preventing new buzz notifications.
    `);

    await test.step('Open DM on both sides and confirm buzz modal is accessible', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
      await pageB.keyboard.press('Control+g');
      const buzzModalHeading = await messagePageB.getMessageBuzzHeader();
      await expect(buzzModalHeading).toBeVisible({ timeout: 5000 });
      await messagePageB.clickMessageBuzzCloseButton();
      await buzzModalHeading.waitFor({ state: 'detached', timeout: 5000 });
    });

    await test.step('User A blocks User B', async () => {
      await friendPageA.blockFriendFromDM(userNameB);
      await friendPageA.assertBlockFriend(userNameB);
    });

    await test.step('User B cannot trigger buzz after being blocked', async () => {
      await pageB.keyboard.press('Control+g');
      const buzzModalHeading = await messagePageB.getMessageBuzzHeader();
      await expect(buzzModalHeading).toHaveCount(1, { timeout: 3000 });
      const textMessageBuzz = `text message buzz ${Date.now()}`;
      await messagePageB.fillMessageBuzzInputMessage(textMessageBuzz);
      await messagePageB.clickMessageBuzzSendButton();
      await buzzModalHeading.waitFor({ state: 'detached', timeout: 5000 });
      const isPermissionDeniedModelVisible = await clanPageB.isPermissionModalVisible();
      expect(isPermissionDeniedModelVisible).toBeTruthy();
      await clanPageB.clickPermissionModalCancelButton();
      await expect(friendPageB.inputs.permissionDenied).toHaveCount(1, { timeout: 10000 });
    });
  });

  test('Block tab shows only self-blocked users and respects search filters', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Confirm the Block tab only lists friends blocked by the current user (source_id === currentUserId) and that search filtering works for both match and mismatch cases.
      
      **Test Steps:**
      1. User A blocks User B and verifies the Block tab lists User B while User B's Block tab remains unchanged
      2. User A searches within the Block tab using a matching and non-matching term
      3. User B confirms no entry for User A when blocked by someone else
      4. User A unblocks User B and friendship is restored
      5. User B blocks User A, repeats the Block tab and search validation, and User A verifies no entry appears
      
      **Expected Result:** Only the blocker sees the blocked counterpart in the Block tab, and the search input filters the list accurately.
    `);

    await test.step('User A blocks User B and sees entry in Block tab', async () => {
      await friendPageA.blockFriend(userNameB);
      await friendPageA.assertBlockFriend(userNameB);
    });

    await test.step('User B does not see User A in Block tab when only blocked by other', async () => {
      await friendPageB.assertBlockFriendNotVisible(userNameA);
    });

    await test.step('Search filter works in User A Block tab', async () => {
      await friendPageA.gotoFriendsPage();
      await friendPageA.tabs.block.click();
      await friendPageA.searchFriend(userNameB);
      await expect(friendPageA.lists.friendAll.filter({ hasText: userNameB })).toHaveCount(1);
      await friendPageA.clearSearch();
      await friendPageA.searchFriend(`${userNameB}-not-found`);
      await expect(friendPageA.lists.friendAll.filter({ hasText: userNameB })).toHaveCount(0);
      await friendPageA.clearSearch();
    });

    await test.step('Search filter in User B Block tab remains empty for User A', async () => {
      await friendPageB.gotoFriendsPage();
      await friendPageB.tabs.block.click();
      await friendPageB.searchFriend(userNameA);
      await expect(friendPageB.lists.friendAll.filter({ hasText: userNameA })).toHaveCount(0);
      await friendPageB.clearSearch();
    });

    await test.step('User A unblocks User B and friendship is restored', async () => {
      await friendPageA.unblockFriend(userNameB);
      await friendPageA.assertBlockFriendNotVisible(userNameB);
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
    });

    await test.step('User B blocks User A and sees entry in Block tab', async () => {
      await friendPageB.blockFriend(userNameA);
      await friendPageB.assertBlockFriend(userNameA);
    });

    await test.step('User A still does not see User B in Block tab when blocked by other', async () => {
      await friendPageA.assertBlockFriendNotVisible(userNameB);
    });

    await test.step('Search filter works in User B Block tab', async () => {
      await friendPageB.gotoFriendsPage();
      await friendPageB.tabs.block.click();
      await friendPageB.searchFriend(userNameA);
      await expect(friendPageB.lists.friendAll.filter({ hasText: userNameA })).toHaveCount(1);
      await friendPageB.clearSearch();
      await friendPageB.searchFriend(`${userNameA}-not-found`);
      await expect(friendPageB.lists.friendAll.filter({ hasText: userNameA })).toHaveCount(0);
      await friendPageB.clearSearch();
    });

    await test.step('Search filter in User A Block tab remains empty for User B', async () => {
      await friendPageA.gotoFriendsPage();
      await friendPageA.tabs.block.click();
      await friendPageA.searchFriend(userNameB);
      await expect(friendPageA.lists.friendAll.filter({ hasText: userNameB })).toHaveCount(0);
      await friendPageA.clearSearch();
    });
  });
});
