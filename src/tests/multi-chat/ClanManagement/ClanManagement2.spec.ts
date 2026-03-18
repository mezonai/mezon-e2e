import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { test } from '@/fixtures/dual.fixture';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';

test.describe('Clan Management 2', () => {
  const accountA = AccountCredentials['account2-3'];
  const accountB = AccountCredentials['account2-4'];
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

  test('Verify that I can create thread after add role with create thread permissions', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64954',
      github_issue: '9685',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that I can create thread after add role with create thread permissions.

      **Test Steps:**
      1. Invite User B to clan
      2. Add new role with create thread permissions to User B
      3. Login User B and verify create thread permissions
      **Expected Result:** I can create thread after add role with create thread permissions.
    `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const roleName = `role-${Date.now().toString(36).slice(-8)}`;
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
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement2, pageA);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step(
      'Verify that user B cannot create thread before add role',
      async () => {
        await pageB.reload();
        await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await clanPageB.openThreadModalFromHeader();
        await clanPageB.verifyCreateThreadButtonIsOpen(false);
      }
    );

    await AllureReporter.step('Add new role with create thread permissions to User B', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.createRoleWithPermission(roleName, 'Manage Threads');
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    });

    await AllureReporter.step('Verify that user B can create thread after add role', async () => {
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageB.openThreadModalFromHeader();
      await clanPageB.verifyCreateThreadButtonIsOpen();
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that I can delete any message after add role with delete message permissions', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64954',
      github_issue: '9685',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that I can delete any message after add role with delete message permissions.

      **Test Steps:**
      1. Invite User B to clan
      2. Add new role with delete message permissions to User B
      3. Login User B and verify delete message permissions
      **Expected Result:** I can delete any message after add role with delete message permissions.
    `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const roleName = `role-${Date.now().toString(36).slice(-8)}`;
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);

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
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement2, pageA);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    const messageToDelete = `Message to delete ${Date.now()}`;

    await AllureReporter.step('User A send message mention user B', async () => {
      await messageHelperA.sendTextMessage(messageToDelete);
    });

    await AllureReporter.step(
      'Verify that user B cannot delete other message before add role',
      async () => {
        await pageB.reload();
        await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await messageHelperB.verifyUserCanDeleteMessage(userNameA, false);
      }
    );

    await AllureReporter.step(
      'Add new role with delete message permissions to User B',
      async () => {
        await clanPageA.openRoleSettingsPage();
        await clanPageA.createRoleWithPermission(roleName, 'Delete Messages');
        await clanPageA.addRoleForUserByUsername(userNameB, roleName);
      }
    );

    await AllureReporter.step(
      'Verify that user B can delete other message after add role',
      async () => {
        await pageB.reload();
        await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await messageHelperB.verifyUserCanDeleteMessage(userNameA);
      }
    );

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that user can transfer owenship to another member', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64610',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can transfer owenship to another member.
      Steps:
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. User A transfer ownership to user B
    `);
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
    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement2, pageA);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });
    await AllureReporter.step('User A transfer ownership to user B', async () => {
      await clanPageA.openMemberListSetting();
      await clanPageA.openMemberActionsMenu(userNameB);
      await clanPageA.clickTransferClanOwnershipButton();
      await clanPageA.confirmTransferOwnership();
    });

    await AllureReporter.step('Verify user B is the owner of clan', async () => {
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageB.openMemberList();
      const memberItem = await clanPageB.getMemberFromMemberList(userNameB);
      await clanPageB.verifyOwnerIconIsVisibleInMemberList(memberItem);
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageB);
    });
  });

  test('Verify that the person to whom ownership is transferred has full admin privileges.', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64610',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that the person to whom ownership is transferred has full admin privileges.
      Steps:
      1. User A create clan
      2. User A invite user B
      3. User B accept invite
      4. User A transfer ownership to user B
    `);
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
    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement2, pageA);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });
    await AllureReporter.step('User A transfer ownership to user B', async () => {
      await clanPageA.openMemberListSetting();
      await clanPageA.openMemberActionsMenu(userNameB);
      await clanPageA.clickTransferClanOwnershipButton();
      await clanPageA.confirmTransferOwnership();
    });

    await AllureReporter.step('Verify user B is has full admin privileges', async () => {
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageB.openMemberList();
      const memberItem = await clanPageB.getMemberFromMemberList(userNameB);
      await clanPageB.verifyOwnerIconIsVisibleInMemberList(memberItem);
      await clanPageB.verifyOwnerCanKickMembers(userNameA);
      await clanPageB.verifyOwnerCannotLeaveClan();
      await clanPageB.verifyOwnerCanDeleteClan();
      await clanPageB.closeSettingsClan();
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageB);
    });
  });

  test('Verify that member since in clan reflect correct when user join clan', async ({ dual }) => {
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
    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement2, pageA);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    const timeJoin = new Date();
    await AllureReporter.step(
      'Verify that member since on short profile of user B display correct',
      async () => {
        await pageB.reload();
        await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await clanPageB.openMemberList();
        const memberItem = await clanPageB.getMemberItemIn2ndSideBarbyUsername(userNameB);
        await memberItem.click();
        await profilePageB.verifyMemberSinceInShortProfile(timeJoin);
      }
    );

    await AllureReporter.step(
      'Verify that member since on member management tab display correct',
      async () => {
        await clanPageB.openMemberListSetting();
        await profilePageB.verifyMemberSinceJoinClanInMemberManagement(timeJoin);
      }
    );

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that member since in clan reflect correct when user join mezon', async ({
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
    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement2, pageA);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });
    let memberSince: string | Date;
    await AllureReporter.step(
      'Verify that member since on short profile of user B display correct',
      async () => {
        await pageB.reload();
        await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
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
});
