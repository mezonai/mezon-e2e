import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { test } from '../../fixtures/dual.fixture';

test.describe('Member Management', () => {
  const accountA = AccountCredentials['account2-1'];
  const accountB = AccountCredentials['account2-2'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.memberManagement,
      credentials: accountA,
    });
  });

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

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({
      browser,
      clanFactory,
      credentials: accountA,
    });
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

  test('Verify that role not cache on member settings when user leave and join clan again', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63514',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
        **Test Objective:** Verify that role not cache when user leave and join clan again.
        
        **Test Steps:**
        1. Clean up any existing friend relationships between users
        2. User A sends a friend request to User B
        3. User B receives and accepts the friend request
        4. Verify both users see each other in their friends list
        5. User A create a clan and add a role
        6. User A invite user B to clan
        7. User B accept invite
        8. User A add role to user B
        9. User B leave clan
        10. User A invite user B to clan again
        11. User B accept
        
        **Expected Result:** User after leave and join clan again will not has the role add before leave
      `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];
    const unique = Date.now().toString(36).slice(-6);
    const roleName = `Role-${unique}`.slice(0, 20);

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
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

    await AllureReporter.step('User B accepts the friend request', async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step('Verify both users see each other as friends', async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await AllureReporter.step(
      'User A send a fisrt message to user B and move to created clan and add a new role',
      async () => {
        await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await clanPageA.openRoleSettingsPage();
        await clanPageA.addNewRoleOnClan(roleName);
      }
    );

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Add role for user B and verify user B has new role', async () => {
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
      await clanPageA.verifyUserHasRoleOnMemberSettings(userNameB, roleName);
    });

    await AllureReporter.step('User B verify that it has new role and leave clan', async () => {
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageB.openMemberListSetting();
      await clanPageB.verifyUserHasRoleOnMemberSettings(userNameB, roleName);
      await clanPageB.leaveClan();
    });

    await AllureReporter.step(
      'User A invite user B to clan again and verify the role still not visible',
      async () => {
        await clanPageA.clickButtonInvitePeopleFromMenu();
        const url = await clanPageA.inviteUserToClanByUsername(userNameB);
        await friendPageB.createDM(userNameA);
        await clanPageB.joinClanByUrlInvite(url);
        await clanPageA.verifyUserHasRoleOnMemberSettings(userNameB, roleName, false);
      }
    );
  });
});
