import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { expect, test } from '@/fixtures/dual.fixture';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

test.describe('Direct Message - Realtime Message Edit and Deletion Synchronization', () => {
  const accountA = AccountCredentials.accountKien9;
  const accountB = AccountCredentials.accountKien10;
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

  test('TC01: Verify realtime direct message editing syncs to recipient without reload', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;

    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when User A edits a sent direct message, User B immediately observes the updated content in realtime without page reload.

      **Test Steps:**
      1. Establish mutual friendship between User A and User B
      2. Both users open their direct message chat
      3. User A sends an initial message
      4. User B verifies receipt of the initial message
      5. User A edits the message to new text
      6. User B verifies the message text updates in realtime
    `);

    await AllureReporter.addLabels({
      tag: ['direct-message', 'message-edit-sync', 'multi-user'],
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

    const unique = Date.now().toString(36);
    const initialText = `Original DM ${unique}`;
    const editedText = `Updated DM ${unique}`;

    await AllureReporter.step('User A sends initial DM and User B receives it', async () => {
      await messageHelperA.sendTextMessage(initialText);
      const msgItemB = messageHelperB.getMessageItemLocator().filter({ hasText: initialText });
      await expect(msgItemB.last()).toBeVisible({ timeout: 15000 });
    });

    await AllureReporter.step(
      'User A edits the message and User B sees update in realtime',
      async () => {
        const msgItemA = messageHelperA
          .getMessageItemLocator()
          .filter({ hasText: initialText })
          .last();
        await messagePageA.editMessage(msgItemA, editedText);

        const editedMsgB = messageHelperB.getMessageItemLocator().filter({ hasText: editedText });
        await expect(editedMsgB.last()).toBeVisible({ timeout: 15000 });
      }
    );
  });

  test('TC02: Verify realtime direct message deletion removes message for recipient without reload', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;

    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when User A deletes a sent direct message, User B immediately observes the message removed in realtime without page reload.

      **Test Steps:**
      1. Establish mutual friendship between User A and User B
      2. Both users open their direct message chat
      3. User A sends a message intended for deletion
      4. User B verifies receipt of the message
      5. User A deletes the message via context menu
      6. User B verifies the message is removed from the chat history in realtime
    `);

    await AllureReporter.addLabels({
      tag: ['direct-message', 'message-delete-sync', 'multi-user'],
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

    const unique = Date.now().toString(36);
    const messageToDelete = `Delete me in DM ${unique}`;

    await AllureReporter.step('User A sends a message and User B receives it', async () => {
      await messageHelperA.sendTextMessage(messageToDelete);
      const msgItemB = messageHelperB.getMessageItemLocator().filter({ hasText: messageToDelete });
      await expect(msgItemB.last()).toBeVisible({ timeout: 15000 });
    });

    await AllureReporter.step(
      'User A deletes the message and User B sees it removed in realtime',
      async () => {
        const msgItemA = messageHelperA
          .getMessageItemLocator()
          .filter({ hasText: messageToDelete })
          .last();
        await expect(msgItemA).toBeVisible({ timeout: 5000 });
        await messagePageA.deleteLastMessage();

        const deletedMsgB = messageHelperB
          .getMessageItemLocator()
          .filter({ hasText: messageToDelete });
        await expect(deletedMsgB).toHaveCount(0, { timeout: 15000 });
      }
    );
  });
});
