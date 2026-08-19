import AllureConfig from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { expect, test } from '@/fixtures/dual.fixture';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import {
  getUsernamesFromEmails,
  setupDualUsersInParallel,
  setupDualUsersSequentially,
} from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';

test.describe('Clan Management - Role Permissions, Ownership, and Membership Dates', () => {
  const accountA = AccountCredentials['account2-3'];
  const accountB = AccountCredentials['account2-4'];
  const memberAccount = AccountCredentials['account2-4'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const CREATE_CLAN_STEP_NAME = 'User A creates a clan';
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);
  const setupModes = {
    parallel: setupDualUsersInParallel,
    sequential: setupDualUsersSequentially,
  };
  // const setupBeforeEach = setupModes.parallel;
  const setupBeforeEach = setupModes.sequential;

  test.beforeEach(async ({ dual }) => {
    await setupBeforeEach(dual, accountA, accountB, directFriendsUrl);
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

  test('Verify that the Mezon membership date matches when the user joined Mezon', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64610',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify member since on Member management tab and member list on channel display correct
      Steps:
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. Verify member since on Member management tab and member list on channel display correct
    `);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const profilePageB = new ProfilePage(pageB);
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

    await AllureReporter.step('User B accepts the friend request', async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });
    await AllureReporter.step('Verify both users see each other as friends', async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });
    const clanFactory = new ClanFactory();
    await AllureReporter.step(CREATE_CLAN_STEP_NAME, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement2, pageA);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });
    let memberSince: string | Date;
    await AllureReporter.step(
      'Verify that member since on short profile of user B display correct',
      async () => {
        await pageB.reload();
        // await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await clanPageB.openMemberList();
        const memberItem = await clanPageB.getMemberItemIn2ndSideBarbyUsername(userNameB);
        await clanPageB.openContextModalOnMemberList(memberItem);
        const timeJoin = await clanPageB.getMemberSinceFromFullProfile();
        memberSince = timeJoin;
        await pageB.keyboard.press('Escape');
      }
    );

    await AllureReporter.step(
      'Verify that member since on member management tab display correct',
      async () => {
        await clanPageB.openMemberListSetting();
        await profilePageB.verifyMemberSinceJoinMezonInMemberManagement(memberSince);
      }
    );

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Create category option requires manageClan permission', async ({ dual }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
        **Test Objective:** Ensure the Create Category action is visible only to members with manageClan permission.
  
        **Test Steps:**
        1. Open the context menu as a clan manager and confirm the Create Category entry is visible
        2. Generate an invite link and join the clan with a non-manager account
        3. Open the context menu as the non-manager and confirm the Create Category entry is hidden
  
        **Expected Result:** Only the manager sees the Create Category option; non-manager members do not.
      `);

    await AllureReporter.addLabels({
      tag: ['category', 'context-menu', 'permissions'],
    });

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const menuPanelA = new ClanMenuPanel(pageA);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);

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

    await AllureReporter.step('User B accepts the friend request', async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step('Verify both users see each other as friends', async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });
    const clanFactory = new ClanFactory();
    await AllureReporter.step(CREATE_CLAN_STEP_NAME, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.createCategory, pageA);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await test.step('Manager sees Create Category entry in context menu', async () => {
      await menuPanelA.openPanel();
      await expect(menuPanelA.buttons.createCategory).toBeVisible();
      await pageA.keyboard.press('Escape');
    });

    await AllureReporter.addParameter('secondaryAccount', memberAccount.email);

    await test.step('Non-manager context menu hides Create Category entry', async () => {
      await pageB.reload();
      // await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      const memberMenuPanel = new ClanMenuPanel(pageB);
      await memberMenuPanel.openPanel();
      await expect(memberMenuPanel.buttons.invitePeople).toBeVisible();
      await expect(memberMenuPanel.buttons.createCategory).toHaveCount(0);
      await pageB.keyboard.press('Escape');
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });

    await AllureReporter.attachScreenshot(pageB, 'Context Menu Without ManageClan');
  });

  test('Verify welcome system message is not sent when clan setup tips are disabled', async ({
    dual,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify disabling clan setup tips prevents the welcome system message.

      **Test Steps:**
      1. User A creates a clan
      2. User A opens Clan Settings > Overview
      3. User A turns off "Send helpful tips for clan setup."
      4. User A invites User B and User B joins the clan
      5. User A opens the general channel
      6. Verify chat.system_message.5 welcoming User B does not exist

      **Expected Result:** No welcome system message is displayed for User B.
    `);
    await AllureReporter.addLabels({
      tag: ['clan-management', 'system-message', 'helpful-tips', 'multi-user'],
    });

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const clanFactory = new ClanFactory();

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

    await AllureReporter.step('User A and User B become friends', async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await AllureReporter.step(CREATE_CLAN_STEP_NAME, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement4, pageA);
    });

    try {
      await AllureReporter.step('User A disables clan setup helpful tips', async () => {
        await clanPageA.disableClanSetupHelpfulTips();
        await clanPageA.closeSettingsClan();
      });

      await AllureReporter.step('User A invites User B and User B joins the clan', async () => {
        await clanPageA.clickButtonInvitePeopleFromMenu();
        const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
        await clanPageB.joinClanByUrlInvite(inviteUrl);
      });

      await AllureReporter.step('Verify no welcome system message exists in general', async () => {
        await clanPageA.verifyWelcomeSystemMessageDoesNotExist('general', userNameB);
      });

      await AllureReporter.attachScreenshot(pageA, 'Welcome system message is not displayed');
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('Highest role color changes after roles are reordered by drag and drop', async ({
    dual,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify a member's display color follows their highest role after role reordering.

      **Test Steps:**
      1. User A creates a clan and invites User B
      2. User A creates Role A and Role B with different colors so Role A has higher priority
      3. User A assigns both roles to User B
      4. Verify User B displays Role A's color
      5. Drag Role B above Role A
      6. Verify User B displays Role B's color

      **Expected Result:** User B's display color changes to the color of the new highest role.
    `);
    await AllureReporter.addLabels({
      tag: ['clan-management', 'role', 'role-color', 'drag-and-drop', 'role-priority'],
    });

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const unique = Date.now().toString(36).slice(-6);
    const roleAName = `color-a-${unique}`;
    const roleBName = `color-b-${unique}`;
    const clanFactory = new ClanFactory();

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

    await AllureReporter.step('User A and User B become friends', async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await AllureReporter.step(CREATE_CLAN_STEP_NAME, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement4, pageA);
    });

    try {
      await AllureReporter.step('User A invites User B to the clan', async () => {
        await clanPageA.clickButtonInvitePeopleFromMenu();
        const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
        await clanPageB.joinClanByUrlInvite(inviteUrl);
      });

      let roleAColor = '';
      let roleBColor = '';
      await AllureReporter.step('Create higher-priority Role A, then Role B', async () => {
        expect(await clanPageA.openRoleSettingsPage()).toBe(true);
        roleAColor = (await clanPageA.addNewRoleWithColorOnClan(roleAName, 1)) ?? '';
        expect(await clanPageA.openRoleSettingsPage()).toBe(true);
        roleBColor = (await clanPageA.addNewRoleWithColorOnClan(roleBName, 0)) ?? '';
        expect(roleAColor).not.toBe('');
        expect(roleBColor).not.toBe('');
        expect(roleAColor).not.toBe(roleBColor);
      });

      await AllureReporter.step('Assign Role A and Role B to User B', async () => {
        await clanPageA.addRoleForUserByUsername(userNameB, roleAName);
        await clanPageA.addRoleForUserByUsername(userNameB, roleBName);
      });

      await AllureReporter.step("Verify User B displays Role A's color", async () => {
        await clanPageA.verifyUserHasRoleOnMemberSettings(userNameB, roleAName, true, roleAColor);
      });

      await AllureReporter.step('Drag Role B above Role A', async () => {
        await clanPageA.reorderRolesByDragAndDrop(roleBName, roleAName);
      });

      await AllureReporter.step("Verify User B displays Role B's color", async () => {
        await clanPageA.openMemberListSetting();
        await clanPageA.verifyUserHasRoleOnMemberSettings(userNameB, roleBName, true, roleBColor);
      });

      await AllureReporter.attachScreenshot(pageA, 'Member color follows highest reordered role');
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });
});
