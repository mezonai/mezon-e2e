import { AccountCredentials, MEZON_DEV, WEBSITE_CONFIGS } from '@/config/environment';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import {
  getUsernamesFromEmails,
  setupDualUsersInParallel,
  setupDualUsersSequentially,
} from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { expect } from '@playwright/test';
import { test } from '../../../fixtures/dual.fixture';

test.describe('Direct Message', () => {
  const accountA = AccountCredentials['accountKien1'];
  const accountB = AccountCredentials['accountKien5'];
  const accountC = AccountCredentials['accountKien6'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  let nameGroupChat: string;
  const [userNameA, userNameB, userNameC] = getUsernamesFromEmails([
    accountA.email,
    accountB.email,
    accountC.email,
  ]);
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
    // const { pageA, pageB } = dual;
    // const messagePageA = new MessagePage(pageA);
    // const messagePageB = new MessagePage(pageB);
    await dual.parallel({
      A: async page => {
        // await messagePageA.leaveGroupByName(nameGroupChat);
        await AuthHelper.logout(page);
      },
      B: async page => {
        // await messagePageB.leaveGroupByName(nameGroupChat);
        await AuthHelper.logout(page);
      },
    });
  });

  test('Verify that group avatar is updated with other users on DM lists and chat header', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63506',
    });
    const { pageA, pageB } = dual;
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    let profileHash: string | null = null;

    await AllureReporter.addDescription(`
        **Test Objective:** Verify that group avatar is updated with other users.
        
        **Test Steps:**
        1. Clean up any existing friend relationships between users
        2. User A sends a friend request to User B and user C
        3. User B receives and accepts the friend request
        4. Verify both users see each other in their friends list
        5. User A create a group
        6. User A update avatar for group
        
        **Expected Result:** Group avatar is updated with user B.
      `);

    const unique = Date.now().toString(36).slice(-6);
    nameGroupChat = `groupchat-${unique}`.slice(0, 20);

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
      await friendPageA.cleanupFriendRelationships(userNameC);
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
      await friendPageA.sendFriendRequestToUser(userNameC);
      await friendPageA.verifySentRequestToast();
    });

    await AllureReporter.step('User A create a group and update new avatar', async () => {
      await messagePageA.createGroup();
      await dual.pageA.waitForTimeout(1000);
      await messagePageA.updateNameGroupChatDM(nameGroupChat);
      await dual.pageA.waitForTimeout(1000);

      await dual.pageA.goto(joinUrlPaths(MEZON_DEV || '', ROUTES.DIRECT_FRIENDS));
      await dual.pageA.waitForTimeout(10000);
      await dual.pageA.reload();

      await messagePageA.openGroupFromName(nameGroupChat);
      await messagePageA.updateAvatarForGroup(nameGroupChat);

      const avtHashA = await messagePageA.getAvatarHashOnDMList(nameGroupChat);
      profileHash = avtHashA;
    });

    await AllureReporter.step('Verify group avatar is updated with user B on DM list', async () => {
      await pageB.reload();
      const avtHashDMB = await messagePageB.getAvatarHashOnDMList(nameGroupChat);
      expect(avtHashDMB).toBe(profileHash);
    });

    await AllureReporter.step(
      'Verify group avatar is updated with user B on group chat header',
      async () => {
        await dual.pageB.reload();
        await messagePageB.openGroupFromName(nameGroupChat);
        const avtHashHeaderB = await messagePageB.getAvatarHashOnHeaderChat();
        expect(avtHashHeaderB).toBe(profileHash);
      }
    );
  });

  test('Verify that group avatar is updated with other users on forward message and search popup (ctrl+k)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63506',
    });
    const { pageA, pageB } = dual;
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    let profileHash: string | null = null;

    await AllureReporter.addDescription(`
        **Test Objective:** Verify that group avatar is updated with other users on forward message and search popup (ctrl+k).
        
        **Test Steps:**
        1. Clean up any existing friend relationships between users
        2. User A sends a friend request to User B and user C
        3. User B receives and accepts the friend request
        4. Verify both users see each other in their friends list
        5. User A create a group and send a message
        6. User A update avatar for group
        7. User B open forward message modal
        8. User B open search popup (ctrl+k)
        
        **Expected Result:** Group avatar is updated with user B on forward message and search popup (ctrl+k).
      `);

    const unique = Date.now().toString(36).slice(-6);
    nameGroupChat = `groupchat-${unique}`.slice(0, 20);

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
      await friendPageA.cleanupFriendRelationships(userNameC);
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
      await friendPageA.sendFriendRequestToUser(userNameC);
      await friendPageA.verifySentRequestToast();
    });

    await AllureReporter.step(
      'User A create a group, send a message and update new avatar',
      async () => {
        await messagePageA.createGroup();
        await dual.pageA.waitForTimeout(1000);

        await messagePageA.sendMessageWhenInDM('This is a message to forward');
        await dual.pageA.waitForTimeout(1000);

        await messagePageA.updateNameGroupChatDM(nameGroupChat);
        await dual.pageA.waitForTimeout(1000);

        await dual.pageA.goto(joinUrlPaths(MEZON_DEV || '', ROUTES.DIRECT_FRIENDS));
        await dual.pageA.waitForTimeout(10000);
        await dual.pageA.reload();

        await messagePageA.openGroupFromName(nameGroupChat);
        await messagePageA.updateAvatarForGroup(nameGroupChat);
        await dual.pageA.waitForTimeout(5000);

        const avtHashA = await messagePageA.getAvatarHashOnDMList(nameGroupChat);
        profileHash = avtHashA;
      }
    );

    await AllureReporter.step(
      'Verify group avatar is updated with user B on forward message modal',
      async () => {
        await dual.pageB.reload();
        await messagePageB.openGroupFromName(nameGroupChat);
        await messagePageB.openForwardMessageModal();
        const avtHashOnForwardPopup = await messagePageB.getAvatarHashOnForwardPopup(nameGroupChat);
        expect(avtHashOnForwardPopup).toBe(profileHash);
        await dual.pageB.keyboard.press('Escape');
      }
    );

    await AllureReporter.step(
      'Verify group avatar is updated with user B when search popup (ctrl+k)',
      async () => {
        await dual.pageB.reload();
        await messagePageB.openSearchModalbyPressCtrlK();
        const avtHashOnSearchModalB = await messagePageB.getAvatarHashOnSearchModal(nameGroupChat);
        expect(avtHashOnSearchModalB).toBe(profileHash);
        await dual.pageB.keyboard.press('Escape');
      }
    );

    await AllureReporter.step(
      'Verify group avatar is updated with user B when search popup by click search button',
      async () => {
        await messagePageB.openSearchModalbyClickSearchButton();
        const avtHashOnSearchModalB = await messagePageB.getAvatarHashOnSearchModal(nameGroupChat);
        expect(avtHashOnSearchModalB).toBe(profileHash);
        await dual.pageB.keyboard.press('Escape');
      }
    );
  });

  test('Verify that last user can leave group', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63506',
    });
    const { pageA, pageB } = dual;
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
        **Test Objective:** Verify that last user can leave group
        
        **Test Steps:**
        1. Clean up any existing friend relationships between users
        2. User A sends a friend request to User B and user C
        3. User B receives and accepts the friend request
        4. Verify both users see each other in their friends list
        5. User A create a group and rename it
        6. User A remove user C from group
        7. User A leave group
        8. User B leave group
        
        **Expected Result:** Last user can leave group
      `);

    const unique = Date.now().toString(36).slice(-6);
    nameGroupChat = `groupchat-${unique}`.slice(0, 20);

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
      await friendPageA.cleanupFriendRelationships(userNameC);
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
      await friendPageA.sendFriendRequestToUser(userNameC);
      await friendPageA.verifySentRequestToast();
    });

    await AllureReporter.step('User A create a group and update name', async () => {
      await messagePageA.createGroup();
      await dual.pageA.waitForTimeout(1000);

      await messagePageA.updateNameGroupChatDM(nameGroupChat);
      await dual.pageA.waitForTimeout(1000);
    });

    await AllureReporter.step('User A remove user C from group chat', async () => {
      await messagePageA.removeUserFromGroup(userNameC);
    });

    await AllureReporter.step('User A leave group', async () => {
      await messagePageA.leaveGroupByName(nameGroupChat);
    });

    await AllureReporter.step('User B leave group', async () => {
      await dual.pageB.reload();
      await messagePageB.leaveGroupByName(nameGroupChat);
    });
  });

  test('Verify that user can add member has just been removed from group', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64801',
      github_issue: '10160',
    });
    const { pageA, pageB } = dual;
    const messagePageA = new MessagePage(pageA);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
        **Test Objective:** Verify that user can add member has just been removed from group
        
        **Test Steps:**
        1. Clean up any existing friend relationships between users
        2. User A sends a friend request to User B and user C
        3. User A create a group contains user B and user C
        4. User A remove user B from group chat
        5. User A add user B back to group chat and verify user B is in group
        6. User A remove user B from group chat and add user B back to group chat
        7. Verify user B is in group

        **Expected Result:** User can add member has just been removed from group
      `);

    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];
    const userNameC = accountC.email.split('@')[0];

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
      await friendPageA.cleanupFriendRelationships(userNameC);
    });

    await AllureReporter.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
      await friendPageA.sendFriendRequestToUser(userNameC);
      await friendPageA.verifySentRequestToast();
    });

    await AllureReporter.step('User A create a group contains user B', async () => {
      await messagePageA.openSelectFriendsModal();
      await messagePageA.pickFriendByName(userNameB);
      await messagePageA.pickFriendByName(userNameC);
      await messagePageA.submitCreate();
    });

    await AllureReporter.step('Remove user B from group chat and add user B back', async () => {
      await messagePageA.removeUserFromGroup(userNameB);
      await messagePageA.addUserToGroup(userNameB);
      await messagePageA.verifyUserInMemberGroup(userNameB);
    });

    await AllureReporter.step(
      'Remove user B from group chat and verify can add user B back',
      async () => {
        await messagePageA.showMemberGroup();
        await messagePageA.removeUserFromGroup(userNameB);
        await messagePageA.addUserToGroup(userNameB);
        await messagePageA.verifyUserInMemberGroup(userNameB);
      }
    );
  });

  test('Verify that user can mark as unread on DM', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64802',
      github_issue: '10161',
    });
    const { pageA, pageB } = dual;
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messageHelperB = new MessageTestHelpers(pageB);

    await AllureReporter.addDescription(`
        **Test Objective:** Verify that user can mark as unread on DM
        **Test Steps:**
        1. Clean up any existing friend relationships between users
        2. User A sends a friend request to User B
        3. User B receives and accepts the friend request
        4. Verify both users see each other in their friends list
        5. User A create a DM with User B
        6. User A send message to User B
        7. User B mark the DM as unread 
        **Expected Result:** User can mark as unread on DM
      `);

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
      await friendPageB.sendFriendRequestToUser(userNameC);
      await friendPageB.verifySentRequestToast();
    });
    await AllureReporter.step('User A create a DM with User B and send message', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
      await messagePageA.sendMessageWhenInDM('Hello from User A to User B');
    });
    await AllureReporter.step('User B mark the message as unread', async () => {
      await messagePageB.markMessageAsUnread(userNameA);
      await friendPageB.gotoFriendsPage();
      await messageHelperB.verifyUserOnDMHasHighlight(userNameA);
    });
  });
});
