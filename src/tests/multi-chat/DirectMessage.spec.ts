import { AccountCredentials, MEZON_DEV, WEBSITE_CONFIGS } from '@/config/environment';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect } from '@playwright/test';
import { test } from '../../fixtures/dual.fixture';

test.describe('Direct Message', () => {
  const accountA = AccountCredentials['account2-3'];
  const accountB = AccountCredentials['account2-4'];
  const accountC = AccountCredentials['account2-5'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const unique = Date.now().toString(36).slice(-6);
  const nameGroupChat = `groupchat-${unique}`.slice(0, 20);

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

    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];
    const userNameC = accountC.email.split('@')[0];

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
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
      const avtHashDMB = await messagePageB.getAvatarHashOnDMList(nameGroupChat);
      expect(avtHashDMB).toBe(profileHash);
    });

    await AllureReporter.step(
      'Verify group avatar is updated with user B on group chat header',
      async () => {
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

    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];
    const userNameC = accountC.email.split('@')[0];

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
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
        await messagePageB.openGroupFromName(nameGroupChat);
        await messagePageB.openForwardMessageModal();
        const avtHashOnForwardPopup = await messagePageB.getAvatarHashOnForwardPopup(nameGroupChat);
        expect(avtHashOnForwardPopup).toBe(profileHash);
        await messagePageB.cancelForwardMessageButton.click();
      }
    );

    await AllureReporter.step(
      'Verify group avatar is updated with user B when search popup (ctrl+k)',
      async () => {
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
});
