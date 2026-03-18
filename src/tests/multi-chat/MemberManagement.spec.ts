import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { test } from '../../fixtures/dual.fixture';

test.describe('Member Management', () => {
  const accountA = AccountCredentials['account2-1'];
  const accountB = AccountCredentials['account2-2'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);

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

    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.memberManagement, pageA);
    });

    await AllureReporter.step(
      'User A send a fisrt message to user B and move to created clan and add a new role',
      async () => {
        await clanPageA.openRoleSettingsPage();
        await clanPageA.addNewRoleOnClan(roleName);
      }
    );

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
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

    await AllureReporter.step('Cleanup clan', async () => {
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

    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.memberManagement, pageA);
    });

    await AllureReporter.step('User A add a new role', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.addNewRoleOnClan(roleName);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
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

    await AllureReporter.step('Cleanup clan', async () => {
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

    await AllureReporter.step('User A creates a clan', async () => {
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

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
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
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
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
        await friendPageB.createDM(userNameA);
        await clanPageB.joinClanByUrlInvite(url);
        await pageB.reload();
        await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
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

    await AllureReporter.step('Cleanup clan', async () => {
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

    await AllureReporter.step('User A creates a clan', async () => {
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

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
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
        await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
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
        await friendPageB.createDM(userNameA);
        await clanPageB.joinClanByUrlInvite(url);
        await pageB.reload();
        await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await clanPageB.verifyRoleColorVisibleOnNameOfChatbox(roleStyle, userNameB, false);
      }
    );

    await AllureReporter.step(
      'verify the role color still not visible in username of member management',
      async () => {
        await clanPageA.verifyUserHasRoleOnMemberSettings(userNameB, roleName, false, roleStyle);
      }
    );

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
