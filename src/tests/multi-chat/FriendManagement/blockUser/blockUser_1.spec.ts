import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { expect, test } from '@/fixtures/dual.fixture';
import { ClanInviteFriendModal } from '@/pages/Clan/ClanInviteFriendModal';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';

test.describe('Friend Management - Block User', () => {
  const accountA = AccountCredentials['accountKien2'];
  const accountB = AccountCredentials['accountKien3'];
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

  test('Verify that a user can block and unblock a friend', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

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

    await test.step('User A blocks User B', async () => {
      await friendPageA.blockFriend(userNameB);
    });

    await test.step('Verify friend relation not appear', async () => {
      const isFriendVisibleA = await friendPageA.checkFriendExists(userNameB);
      expect(isFriendVisibleA).toBeFalsy();

      const isFriendVisibleB = await friendPageB.checkFriendExists(userNameA);
      expect(isFriendVisibleB).toBeFalsy();
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

  test('Blocker User should not invite blocked user B to clan', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA } = dual;
    const friendPageA = new FriendPage(pageA);
    const userNameB = accountB.email.split('@')[0];

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a blocked user is not shown in the clan invite list.
      
      **Test Steps:**
      1. Establish friendship between User A and User B
      2. User A blocks User B
      3. Verify User B appears in the Block tab
      4. User A creates a clan
      5. User A opens the invite people modal
      6. Verify that blocked User B is not shown in the invite list
      
      **Expected Result:** Blocked users should not appear in the clan invite friend list.
    `);

    await test.step('User A blocks User B', async () => {
      await friendPageA.blockFriend(userNameB);
      await friendPageA.assertBlockFriend(userNameB);
    });
    const clanFactory = new ClanFactory();
    const clanMenuPanelA = new ClanMenuPanel(pageA);
    const clanInviteFriendModalA = new ClanInviteFriendModal(pageA);

    await test.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.blockUser, pageA);
    });

    await test.step('User A opens invite friend modal', async () => {
      await clanMenuPanelA.openInvitePeopleModal();
    });

    await test.step('Verify blocked User B is not shown in invite list', async () => {
      const isFriendShown = await clanInviteFriendModalA.isFriendShownInList(userNameB);
      expect(isFriendShown).toBeFalsy();
      await pageA.reload({
        waitUntil: 'domcontentloaded',
      });
    });

    await test.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Blocked User should not invite blocker user to clan', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const userNameB = accountB.email.split('@')[0];

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a blocked user is not shown in the clan invite list.
      
      **Test Steps:**
      1. Establish friendship between User A and User B
      2. User A blocks User B
      3. Verify User B appears in the Block tab
      4. User A creates a clan
      5. User A opens the invite people modal
      6. Verify that blocked User B is not shown in the invite list
      
      **Expected Result:** Blocked users should not appear in the clan invite friend list.
    `);

    const clanFactory = new ClanFactory();
    const clanMenuPanelB = new ClanMenuPanel(pageB);
    const clanInviteFriendModalB = new ClanInviteFriendModal(pageB);
    await test.step('User A blocks User B', async () => {
      await friendPageA.blockFriend(userNameB);
      await friendPageA.assertBlockFriend(userNameB);
    });

    await test.step('User B creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.blockUser, pageB);
    });

    await test.step('User B opens invite friend modal', async () => {
      await clanMenuPanelB.openInvitePeopleModal();
    });

    await test.step('Verify blocked User B is not shown in invite list', async () => {
      const isFriendShown = await clanInviteFriendModalB.isFriendShownInList(userNameB);
      expect(isFriendShown).toBeFalsy();
      await pageB.reload({
        waitUntil: 'domcontentloaded',
      });
    });

    await test.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageB);
    });
  });

  test('Should realtime disable chat in DM', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA, pageB } = dual;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that realtime chat is disabled in DM when a user blocks another user.
      
      **Test Steps:**
      1. Establish friendship between User A and User B
      2. User A blocks User B
      3. Verify User B appears in the Block tab
      4. User A opens the invite people modal
      5. Verify that blocked User B is not shown in the invite list
      
      **Expected Result:** Real-time chat should be disabled in DM when a user blocks another user.
    `);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await test.step('Create DM between User A and User B', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await test.step('Verify chat is enabled in DM on both sides', async () => {
      const isChatDeniedA = await friendPageA.isChatDenied();
      expect(isChatDeniedA).toBeFalsy();
      const isChatDeniedB = await friendPageB.isChatDenied();
      expect(isChatDeniedB).toBeFalsy();
    });

    await test.step('User A blocks User B directly from DM', async () => {
      await friendPageA.blockFriendFromDM(userNameB);
      await friendPageA.page.waitForTimeout(1000);
    });

    await test.step('Verify realtime chat is disabled in DM on current page', async () => {
      const isChatDeniedA = await friendPageA.isChatDenied();
      expect(isChatDeniedA).toBeTruthy();
      const isChatDeniedB = await friendPageB.isChatDenied();
      expect(isChatDeniedB).toBeTruthy();
    });
  });
});
