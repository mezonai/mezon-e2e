import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { test } from '@/fixtures/dual.fixture';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import generateRandomString from '@/utils/randomString';
import { expect } from '@playwright/test';
import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

test.describe('Clan Management - Community Gating: Administrator vs Clan Manager (TC-CI-20 / Case 163)', () => {
  const accountA = AccountCredentials['account2-3'];
  const accountB = AccountCredentials['account2-4'];
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);
  const setupBeforeEach = setupDualUsersSequentially;

  test.beforeEach(async ({ dual }) => {
    await setupBeforeEach(dual, accountA, accountB, directFriendsUrl);
  });

  test.afterEach(async ({ dual }) => {
    await dual.parallel({
      A: async page => {
        if (page.url().includes('mezon')) {
          await AuthHelper.logout(page);
        }
      },
      B: async page => {
        if (page.url().includes('mezon')) {
          await AuthHelper.logout(page);
        }
      },
    });
  });

  test('Verify Clan Manager cannot enable Community; only Administrator has access (TC-CI-20 / Case 163)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65163' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that Clan Manager (Manage Clan) cannot enable Community or edit Community Overview, whereas Administrator has full access (TC-CI-20 / Case 163).
      **Steps:**
      1. Create clan with User A (Owner/Administrator) and invite User B.
      2. User A grants User B a role with 'Manage Clan' (Clan Manager) only.
      3. User B opens Clan Settings and verifies 'Enable Community' is hidden/blocked.
      4. User A (Administrator) opens Clan Settings and verifies 'Enable Community' is accessible.
      **Expected Result:** Community settings are strictly gated to Administrator; Clan Manager cannot access.
    `);

    await AllureReporter.addLabels({
      tag: ['clan-management', 'community', 'permissions', 'administrator', 'tc-ci-20'],
    });

    const clanManagerRole = `clan-mgr-${generateRandomString(4)}`;

    await AllureReporter.step('Clean up existing friend relationships', async () => {
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

    await AllureReporter.step('User A sends friend request to User B', async () => {
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
    await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement2, pageA);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User A grants Clan Manager role to User B', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.createRoleWithPermission(clanManagerRole, 'Manage Clan');
      await clanPageA.addRoleForUserByUsername(userNameB, clanManagerRole);
    });

    await AllureReporter.step(
      'Verify User B (Clan Manager) CANNOT see Enable Community',
      async () => {
        await pageB.reload();
        await clanPageB.openRoleSettingsPage();
        const enableCommunitySidebarB = pageB.getByText('Enable Community', { exact: false });
        await expect(enableCommunitySidebarB).toBeHidden({ timeout: 5000 });
        await clanPageB.closeSettingsClan();
      }
    );

    await AllureReporter.step(
      'Verify User A (Administrator) CAN see Enable Community',
      async () => {
        await clanPageA.openRoleSettingsPage();
        const enableCommunitySidebarA = pageA.getByText('Enable Community', { exact: false });
        await expect(enableCommunitySidebarA).toBeVisible({ timeout: 5000 });
        await clanPageA.closeSettingsClan();
      }
    );

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
