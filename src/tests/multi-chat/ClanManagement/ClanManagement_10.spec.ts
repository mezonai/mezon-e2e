import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { expect, test } from '@/fixtures/dual.fixture';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

test.describe('Clan Management - Realtime Member List Synchronization', () => {
  const accountA = AccountCredentials.accountKien7;
  const accountB = AccountCredentials.accountKien8;
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

  test('TC01: Verify member list realtime sync when a new member joins the clan', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when User B accepts an invitation and joins the clan, User A immediately observes User B appearing in the clan member list in realtime without reloading the page.

      **Test Steps:**
      1. User A and User B establish mutual friendship
      2. User A sets up a new Clan
      3. User A generates an invite link and sends it to User B
      4. User B accepts the invite link and joins the clan
      5. User A verifies User B appears in the clan member list in realtime
      6. User B leaves the clan and User A verifies User B is removed from the member list in realtime
      7. Cleanup clan
    `);

    await AllureReporter.addLabels({
      tag: ['clan-management', 'member-list-sync', 'multi-user'],
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
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    const clanFactory = new ClanFactory();

    try {
      await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
        await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement5, pageA);
      });

      await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
        await clanPageA.clickButtonInvitePeopleFromMenu();
        const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
        await clanPageB.joinClanByUrlInvite(inviteUrl);
      });

      await AllureReporter.step(
        'User A verifies User B appears in member list in realtime',
        async () => {
          await clanPageA.openMemberList();
          const memberItemB = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameB);
          await expect(memberItemB).toBeVisible({ timeout: 15000 });
        }
      );

      await AllureReporter.step(
        'User B leaves the clan and User A verifies User B disappears from member list in realtime',
        async () => {
          await clanPageB.leaveClan();
          const memberItemB = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameB);
          await expect(memberItemB).toBeHidden({ timeout: 15000 });
        }
      );
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });
});
