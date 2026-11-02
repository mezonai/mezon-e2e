import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import {
  getUsernamesFromEmails,
  setupDualUser,
  setupDualUsersInParallel,
  setupDualUsersSequentially,
} from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { expect, test } from '../../../fixtures/dual.fixture';
import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

test.describe('Member Management - Role Assignment and Cache Refresh', () => {
  const accountA = AccountCredentials['account2-1'];
  const accountB = AccountCredentials['account2-2'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
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
    await Promise.all([AuthHelper.logout(dual.pageA), AuthHelper.logout(dual.pageB)]);
  });

  test('Member list search, name sorting, and page-size selection work together', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;
    const clanFactory = new ClanFactory();
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    let clanCreated = false;

    try {
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
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);

      await clanFactory.setupClan(ClanSetupHelper.configs.memberManagement, pageA);
      clanCreated = true;
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      await clanPageA.openMemberListSetting();
      const memberRows = clanPageA.selector.member.settings.userContainer;
      const usernames = clanPageA.selector.member.settings.username;
      const search = pageA.getByPlaceholder('Search by clannick, display name or username');

      await expect(memberRows).toHaveCount(2, { timeout: 10000 });
      await search.fill(userNameB);
      await expect(memberRows).toHaveCount(1);
      await expect(clanPageA.selector.member.getSettingsRow(userNameB)).toBeVisible();
      await search.clear();
      await expect(memberRows).toHaveCount(2);

      const nameHeader = pageA.getByText('Name', { exact: true });
      await nameHeader.click();
      const ascendingUsernames = (await usernames.allTextContents()).map(value => value.trim());
      expect(ascendingUsernames).toHaveLength(2);

      await nameHeader.click();
      const descendingUsernames = (await usernames.allTextContents()).map(value => value.trim());
      expect(descendingUsernames).toEqual([...ascendingUsernames].reverse());

      // The fixture has only two members, so exercise page-size changes without claiming a page transition.
      await pageA.getByText('10', { exact: true }).last().click();
      await pageA.getByText('50', { exact: true }).last().click();
      await expect(pageA.getByText('50', { exact: true }).last()).toBeVisible();
    } finally {
      if (clanCreated) {
        await clanFactory.cleanupClan(pageA);
      }
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
    }
  });
  test('Member list pagination displays members on the next page', async ({ dual }) => {
    test.setTimeout(30 * 60 * 1000);

    const { pageA } = dual;
    let pageB = dual.pageB;
    const clanFactory = new ClanFactory();
    const clanPageA = new ClanPage(pageA);
    let clanCreated = false;

    // The owner and account2-2 are already authenticated by the dual fixture.
    // Nine additional accounts make eleven clan members, enough to require page 2 at size 10.
    const extraAccountKeys = [
      'account1',
      'account2-3',
      'account2-4',
      'account2-5',
      'account3',
      'account4',
      'account5',
      'account6',
      'account7',
    ] as const;

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.memberManagement, pageA);
      clanCreated = true;
      const clanUrl = pageA.url();
      const clanId = clanUrl.match(/\/chat\/clans\/([^/]+)/)?.[1];
      expect(clanId, 'Expected the created clan URL to contain its clan ID').toBeTruthy();

      const addMemberByInvite = async (memberPage: typeof pageA, username: string) => {
        const ownerFriendPage = new FriendPage(pageA);
        const memberFriendPage = new FriendPage(memberPage);
        const memberClanPage = new ClanPage(memberPage);

        await Promise.allSettled([
          ownerFriendPage.unblockFriend(username),
          memberFriendPage.unblockFriend(userNameA),
        ]);
        await FriendHelper.cleanupMutualFriendRelationships(
          ownerFriendPage,
          memberFriendPage,
          userNameA,
          username
        );

        try {
          await ownerFriendPage.sendFriendRequestToUser(username);
          await ownerFriendPage.verifySentRequestToast();
          await memberFriendPage.verifyReceivedRequestToast(
            `${userNameA} wants to add you as a friend`
          );
          await memberFriendPage.acceptFirstFriendRequest();
          await ownerFriendPage.assertAllFriend(username);
          await memberFriendPage.assertAllFriend(userNameA);
          await Promise.all([
            ownerFriendPage.createDM(username),
            memberFriendPage.createDM(userNameA),
          ]);

          await pageA.goto(clanUrl, { waitUntil: 'domcontentloaded' });
          await clanPageA.clickButtonInvitePeopleFromMenu();
          const inviteUrl = await clanPageA.inviteUserToClanByUsername(username);
          await memberClanPage.joinClanByUrlInvite(inviteUrl);
        } finally {
          await FriendHelper.cleanupMutualFriendRelationships(
            ownerFriendPage,
            memberFriendPage,
            userNameA,
            username
          );
        }
      };

      await addMemberByInvite(pageB, userNameB);

      for (const accountKey of extraAccountKeys) {
        await AuthHelper.logout(pageB, false);
        await pageB.close();
        pageB = await dual.contextB.newPage();
        dual.pageB = pageB;
        await setupDualUser(pageB, AccountCredentials[accountKey], directFriendsUrl);
        const username = getUsernamesFromEmails([AccountCredentials[accountKey].email])[0];
        await addMemberByInvite(pageB, username);
      }

      await pageA.goto(clanUrl, { waitUntil: 'domcontentloaded' });
      await expect(clanPageA.selector.buttons.clanName).toBeVisible({ timeout: 15000 });
      await clanPageA.openMemberListSetting();

      const memberRows = clanPageA.selector.member.settings.userContainer;
      await expect(memberRows).toHaveCount(10, { timeout: 30000 });
      await pageA.getByRole('button', { name: '2', exact: true }).click();
      await expect(memberRows).toHaveCount(1);

      const memberOnSecondPage = (
        await clanPageA.selector.member.settings.username.innerText()
      ).trim();
      expect(memberOnSecondPage).toBeTruthy();

      await pageA.getByRole('button', { name: '1', exact: true }).click();
      await expect(memberRows).toHaveCount(10);
      await pageA
        .getByPlaceholder('Search by clannick, display name or username')
        .fill(memberOnSecondPage);
      await expect(memberRows).toHaveCount(1);
      await expect(memberRows.first()).toContainText(memberOnSecondPage);
    } finally {
      if (clanCreated) {
        await clanFactory.cleanupClan(pageA);
      }
    }
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
    const unique = Date.now().toString(36).slice(-6);
    const roleName = `Role-${unique}`.slice(0, 20);

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

    await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.memberManagement, pageA);
    });

    await AllureReporter.step('User A move to created clan and add a new role', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.addNewRoleOnClan(roleName);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Add role for user B and verify user B has new role', async () => {
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
      await clanPageA.verifyUserHasRoleOnMemberSettings(userNameB, roleName);
    });

    await AllureReporter.step('User B verify that it has new role and leave clan', async () => {
      // await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageB.openMemberListSetting();
      await clanPageB.verifyUserHasRoleOnMemberSettings(userNameB, roleName);
      await clanPageB.leaveClan();
    });

    await AllureReporter.step(
      'User A invite user B to clan again and verify the role still not visible',
      async () => {
        await clanPageA.clickButtonInvitePeopleFromMenu();
        const url = await clanPageA.inviteUserToClanByUsername(userNameB);
        const messagePageB = new MessagePage(pageB);
        const messageHelperB = new MessageTestHelpers(pageB);
        await messagePageB.openSearchModalbyPressCtrlK();
        await messageHelperB.openDMByNameOnsearchModal(userNameA);
        await clanPageB.joinClanByUrlInvite(url);
        await clanPageA.verifyUserHasRoleOnMemberSettings(userNameB, roleName, false);
      }
    );

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that user can add role in short profile and it is visible after added', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63514',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
        **Test Objective:** Verify that user can add role in short profile and it is visible after added.
        
        **Test Steps:**
        1. Clean up any existing friend relationships between users
        2. User A sends a friend request to User B
        3. User B receives and accepts the friend request
        4. Verify both users see each other in their friends list
        5. User A create a clan and add a role
        6. User A invite user B to clan
        7. User B accept invite
        8. User A add role to user B from short profile
        
        **Expected Result:** User can add role in short profile and it is visible after added
      `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const unique = Date.now().toString(36).slice(-6);
    const roleName = `Role-${unique}`.slice(0, 20);

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

    await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.memberManagement, pageA);
    });

    await AllureReporter.step('User A add a new role', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.addNewRoleOnClan(roleName);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Add role for user B from short profile', async () => {
      await clanPageA.openMemberList();
      const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameB);
      await memberItem.click();
      await clanPageA.openPopoverRole();
      await clanPageA.addRoleFromShortProfile();
    });

    await AllureReporter.step('Verify that user B has role on short profile', async () => {
      await clanPageA.verifyRoleVisibleInShortProfile(roleName);
    });

    await AllureReporter.step('Verify that user B has role on member settings page', async () => {
      await clanPageA.openMemberListSetting();
      await clanPageA.verifyUserHasRoleOnMemberSettings(userNameB, roleName);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that role color not cache on member list and role not visible on short profile when user leave and join clan again', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63514',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
        **Test Objective:** Verify that role color not cache on member list and role not visible on short profile when user leave and join clan again.
        
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
        
        **Expected Result:** Role color not cache on member list and role not visible on short profile when user leave and join clan again
      `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const unique = Date.now().toString(36).slice(-6);
    const roleName = `Role-${unique}`.slice(0, 20);
    let roleStyle: any;

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

    await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.memberManagement, pageA);
    });

    await AllureReporter.step(
      'User A send a fisrt message to user B and move to created clan and add a new role',
      async () => {
        await clanPageA.openRoleSettingsPage();
        const style = await clanPageA.addNewRoleWithColorOnClan(roleName);
        roleStyle = style;
      }
    );

    await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Add role for user B from short profile', async () => {
      await clanPageA.openMemberList();
      const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameB);
      await memberItem.click();
      await clanPageA.openPopoverRole();
      await clanPageA.addRoleFromShortProfile();
    });

    await AllureReporter.step('Verify that user B has role on short profile', async () => {
      await clanPageA.verifyRoleVisibleInShortProfile(roleName, roleStyle);
      await dual.pageA.keyboard.press('Escape');
      const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameB);
      await clanPageA.verifyRoleColorIsVisibleOnUsernameIn2ndSideBar(memberItem, roleStyle);
    });

    await AllureReporter.step('User B verify that it has new role and leave clan', async () => {
      await pageB.reload();
      // await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageB.openMemberList();
      const memberItem = await clanPageB.getMemberItemIn2ndSideBarbyUsername(userNameB);
      await clanPageB.verifyRoleColorIsVisibleOnUsernameIn2ndSideBar(memberItem, roleStyle);
      await clanPageB.leaveClan();
    });

    await AllureReporter.step(
      'User A invite user B to clan again and verify the role color still not visible in username of members list',
      async () => {
        await clanPageA.clickButtonInvitePeopleFromMenu();
        const url = await clanPageA.inviteUserToClanByUsername(userNameB);
        const messagePageB = new MessagePage(pageB);
        const messageHelperB = new MessageTestHelpers(pageB);
        await messagePageB.openSearchModalbyPressCtrlK();
        await messageHelperB.openDMByNameOnsearchModal(userNameA);
        await clanPageB.joinClanByUrlInvite(url);
        await pageB.reload();
        // await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        const memberItem = await clanPageB.getMemberItemIn2ndSideBarbyUsername(userNameB);
        await clanPageB.verifyRoleColorIsVisibleOnUsernameIn2ndSideBar(
          memberItem,
          roleStyle,
          false
        );
      }
    );

    await AllureReporter.step('verify the role still not visible in short profile', async () => {
      const memberItem = await clanPageB.getMemberItemIn2ndSideBarbyUsername(userNameB);
      await memberItem.click();
      await clanPageB.verifyRoleVisibleInShortProfile(roleName, roleStyle, false);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that role color not cache on member management and role color not cache on username of chat box when user leave and join clan again', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63514',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
        **Test Objective:** Verify that role color not cache on member management and role color not cache on username of chat box when user leave and join clan again
        
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
        
        **Expected Result:** Role color not cache on member management and role color not cache on username of chat box when user leave and join clan again
      `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const unique = Date.now().toString(36).slice(-6);
    const roleName = `Role-${unique}`.slice(0, 20);
    let roleStyle: any;

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

    await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.memberManagement, pageA);
    });

    await AllureReporter.step(
      'User A move to created clan and add a new role with color',
      async () => {
        await clanPageA.openRoleSettingsPage();
        const style = await clanPageA.addNewRoleWithColorOnClan(roleName);
        roleStyle = style;
      }
    );

    await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Add role for user B and verify user B has new role', async () => {
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
      await clanPageA.verifyUserHasRoleOnMemberSettings(userNameB, roleName, true, roleStyle);
    });

    await AllureReporter.step(
      'User B send a message, verify role color visible on username of chatbox and leave clan',
      async () => {
        await pageB.reload();
        // await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await clanPageB.sendFirstMessage('This is message');
        await clanPageB.verifyRoleColorVisibleOnNameOfChatbox(roleStyle, userNameB);
        await clanPageB.leaveClan();
      }
    );

    await AllureReporter.step(
      'User A invite user B to clan again and verify the role color still not visible in username of chatbox',
      async () => {
        await clanPageA.clickButtonInvitePeopleFromMenu();
        const url = await clanPageA.inviteUserToClanByUsername(userNameB);
        const messagePageB = new MessagePage(pageB);
        const messageHelperB = new MessageTestHelpers(pageB);
        await messagePageB.openSearchModalbyPressCtrlK();
        await messageHelperB.openDMByNameOnsearchModal(userNameA);
        await clanPageB.joinClanByUrlInvite(url);
        await pageB.reload();
        // await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await clanPageB.verifyRoleColorVisibleOnNameOfChatbox(roleStyle, userNameB, false);
      }
    );

    await AllureReporter.step(
      'verify the role color still not visible in username of member management',
      async () => {
        await clanPageA.verifyUserHasRoleOnMemberSettings(userNameB, roleName, false, roleStyle);
      }
    );

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
