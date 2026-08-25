import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { test } from '@/fixtures/dual.fixture';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { SendTokenModal } from '@/pages/Modal/SendTokenModal';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { expect, Page } from '@playwright/test';

test.describe('Send Token - Transfer Flow', () => {
  const accountA = AccountCredentials['account4'];
  const accountB = AccountCredentials['account2-3'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const ACCEPT_REQUEST_STEP_NAME = 'User B accepts the friend request';
  const RECEIVED_REQUEST_TOAST = `${userNameA} wants to add you as a friend`;
  const CHOOSE_SENDER_STEP_NAME = 'Choose sender by balance and send tokens';
  const SEND_TOKEN_TAG = 'send-token';
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);

  const formatThousandSeparator = (amount: number, separator: string): string =>
    amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  async function readBalance(page: Page): Promise<number> {
    const sendTokenModal = new SendTokenModal(page);
    await sendTokenModal.openShortProfileFromFooter();
    const balance = await sendTokenModal.getBalanceFromShortProfile();
    await sendTokenModal.closeShortProfile();
    return balance;
  }

  async function chooseSenderByBalance(
    pageA: Page,
    pageB: Page
  ): Promise<{ senderPage: Page; senderName: string; receiverName: string; amount: number }> {
    const balanceA = await readBalance(pageA);
    const balanceB = await readBalance(pageB);

    const senderIsA = balanceA >= balanceB;
    const senderBalance = senderIsA ? balanceA : balanceB;
    const amount = Math.min(10000, senderBalance);

    test.skip(
      amount <= 0,
      `Cannot send tokens: both wallets are empty (A: ${balanceA} đồng, B: ${balanceB} đồng)`
    );

    return {
      senderPage: senderIsA ? pageA : pageB,
      senderName: senderIsA ? userNameA : userNameB,
      receiverName: senderIsA ? userNameB : userNameA,
      amount,
    };
  }

  async function sendTokens(
    senderPage: Page,
    receiverName: string,
    amount: number,
    note: string
  ): Promise<void> {
    const sendTokenModal = new SendTokenModal(senderPage);
    await sendTokenModal.openShortProfileFromFooter();
    await sendTokenModal.openSendTokenModalFromShortProfile();
    await sendTokenModal.searchAndSelectUser(receiverName);
    await sendTokenModal.fillAmount(amount.toString());
    await sendTokenModal.fillNote(note);
    await sendTokenModal.clickSend();
  }

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

  test('Verify that user with higher or equal balance can be chosen as sender and send tokens successfully', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA, pageB } = dual;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user with higher or equal balance can be chosen as sender and send tokens successfully

      **Test Steps:**
      1. User A and User B become friends
      2. Get balance of both users from short profile
      3. Choose the user with higher or equal balance as sender
      4. Sender sends tokens to receiver
      5. Verify Send Tokens modal is closed after sending

      **Expected Result:** User with higher or equal balance is chosen as sender and tokens are sent successfully
    `);

    await AllureReporter.addLabels({
      tag: [SEND_TOKEN_TAG, 'transfer'],
    });

    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

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

    await AllureReporter.step(ACCEPT_REQUEST_STEP_NAME, async () => {
      await friendPageB.verifyReceivedRequestToast(`${RECEIVED_REQUEST_TOAST}`);
      await friendPageB.acceptFirstFriendRequest();
    });

    const transferInfo = await chooseSenderByBalance(pageA, pageB);

    await AllureReporter.step(
      `Choose sender (${transferInfo.senderName}) with higher or equal balance`,
      async () => {
        expect(transferInfo.amount).toBeGreaterThan(0);
      }
    );

    await AllureReporter.step(
      `Sender (${transferInfo.senderName}) sends ${transferInfo.amount} tokens to ${transferInfo.receiverName}`,
      async () => {
        const note = `e2e transfer ${Date.now()}`;
        await sendTokens(
          transferInfo.senderPage,
          transferInfo.receiverName,
          transferInfo.amount,
          note
        );
      }
    );

    await AllureReporter.step('Verify Send Tokens modal is closed after sending', async () => {
      const sendTokenModal = new SendTokenModal(transferInfo.senderPage);
      await sendTokenModal.verifySendTokenModalHidden();
    });
  });

  test('Verify that send token card appears in DM after sending successfully', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA, pageB } = dual;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that send token card appears in DM after sending successfully

      **Test Steps:**
      1. User A and User B become friends
      2. Choose sender by balance and send tokens
      3. Receiver opens DM with sender
      4. Verify send token card is displayed with correct amount and note

      **Expected Result:** Send token card appears in DM with correct information
    `);

    await AllureReporter.addLabels({
      tag: [SEND_TOKEN_TAG, 'dm-card'],
    });

    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

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

    await AllureReporter.step(ACCEPT_REQUEST_STEP_NAME, async () => {
      await friendPageB.verifyReceivedRequestToast(`${RECEIVED_REQUEST_TOAST}`);
      await friendPageB.acceptFirstFriendRequest();
    });

    const transferInfo = await AllureReporter.step(CHOOSE_SENDER_STEP_NAME, async () => {
      const info = await chooseSenderByBalance(pageA, pageB);
      const note = `e2e dm card ${Date.now()}`;
      await sendTokens(info.senderPage, info.receiverName, info.amount, note);
      return { ...info, note };
    });

    await AllureReporter.step('Receiver opens DM with sender', async () => {
      const messagePageReceiver = new MessagePage(
        transferInfo.senderName === userNameA ? pageB : pageA
      );
      const messageHelperReceiver = new MessageTestHelpers(
        transferInfo.senderName === userNameA ? pageB : pageA
      );
      await messagePageReceiver.openSearchModalbyPressCtrlK();
      await messageHelperReceiver.openDMByNameOnsearchModal(transferInfo.senderName);
    });

    await AllureReporter.step('Verify send token card is displayed in DM', async () => {
      const receiverPage = transferInfo.senderName === userNameA ? pageB : pageA;
      const sendTokenModalReceiver = new SendTokenModal(receiverPage);
      await sendTokenModalReceiver.verifySendTokenCardInDM(transferInfo.note);
    });
  });

  test('Verify that sent transaction appears in Transaction History with correct amount and status', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA, pageB } = dual;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that sent transaction appears in Transaction History with correct amount and status

      **Test Steps:**
      1. User A and User B become friends
      2. Choose sender by balance and send tokens
      3. Sender opens short profile and clicks Transaction History
      4. Verify latest transaction shows deducted amount with Sent status

      **Expected Result:** Sent transaction appears in Transaction History with correct amount and Sent status
    `);

    await AllureReporter.addLabels({
      tag: [SEND_TOKEN_TAG, 'transaction-history'],
    });

    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

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

    await AllureReporter.step(ACCEPT_REQUEST_STEP_NAME, async () => {
      await friendPageB.verifyReceivedRequestToast(`${RECEIVED_REQUEST_TOAST}`);
      await friendPageB.acceptFirstFriendRequest();
    });

    const transferInfo = await AllureReporter.step(CHOOSE_SENDER_STEP_NAME, async () => {
      const info = await chooseSenderByBalance(pageA, pageB);
      await sendTokens(info.senderPage, info.receiverName, info.amount, `e2e sent ${Date.now()}`);
      return info;
    });

    await AllureReporter.step('Sender opens Transaction History from short profile', async () => {
      const sendTokenModalSender = new SendTokenModal(transferInfo.senderPage);
      await sendTokenModalSender.openTransactionHistoryFromShortProfile();
    });

    await AllureReporter.step(
      'Verify latest transaction shows deducted amount with Sent status',
      async () => {
        const sendTokenModalSender = new SendTokenModal(transferInfo.senderPage);
        const expectedAmountText = `- ${formatThousandSeparator(transferInfo.amount, '.')} Đồng`;
        await sendTokenModalSender.verifyTransactionByAmount(expectedAmountText, 'Sent');
        await sendTokenModalSender.closeTransactionModal();
      }
    );
  });

  test('Verify that received transaction appears in Transaction History of receiver', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA, pageB } = dual;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that received transaction appears in Transaction History of receiver

      **Test Steps:**
      1. User A and User B become friends
      2. Choose sender by balance and send tokens
      3. Receiver opens short profile and clicks Transaction History
      4. Verify latest transaction shows added amount with Received status

      **Expected Result:** Received transaction appears in Transaction History of receiver with correct amount and Received status
    `);

    await AllureReporter.addLabels({
      tag: [SEND_TOKEN_TAG, 'transaction-history'],
    });

    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

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

    await AllureReporter.step(ACCEPT_REQUEST_STEP_NAME, async () => {
      await friendPageB.verifyReceivedRequestToast(`${RECEIVED_REQUEST_TOAST}`);
      await friendPageB.acceptFirstFriendRequest();
    });

    const transferInfo = await AllureReporter.step(CHOOSE_SENDER_STEP_NAME, async () => {
      const info = await chooseSenderByBalance(pageA, pageB);
      await sendTokens(
        info.senderPage,
        info.receiverName,
        info.amount,
        `e2e received ${Date.now()}`
      );
      return info;
    });

    await AllureReporter.step('Receiver opens Transaction History from short profile', async () => {
      const receiverPage = transferInfo.senderName === userNameA ? pageB : pageA;
      const sendTokenModalReceiver = new SendTokenModal(receiverPage);
      await sendTokenModalReceiver.openShortProfileFromFooter();
      await sendTokenModalReceiver.openTransactionHistoryFromShortProfile();
    });

    await AllureReporter.step(
      'Verify latest transaction shows added amount with Received status',
      async () => {
        const receiverPage = transferInfo.senderName === userNameA ? pageB : pageA;
        const sendTokenModalReceiver = new SendTokenModal(receiverPage);
        const expectedAmountText = `+ ${formatThousandSeparator(transferInfo.amount, '.')} Đồng`;
        await sendTokenModalReceiver.verifyTransactionByAmount(expectedAmountText, 'Received');
      }
    );
  });

  test('Verify that transaction detail shows correct sender, receiver, amount and note', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA, pageB } = dual;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that transaction detail shows correct sender, receiver, amount and note

      **Test Steps:**
      1. User A and User B become friends
      2. Choose sender by balance and send tokens with a note
      3. Sender opens Transaction History and expands the transaction detail
      4. Verify Sender, Receiver, Amount and Note information

      **Expected Result:** Transaction detail shows correct sender, receiver, amount and note
    `);

    await AllureReporter.addLabels({
      tag: [SEND_TOKEN_TAG, 'transaction-detail'],
    });

    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

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

    await AllureReporter.step(ACCEPT_REQUEST_STEP_NAME, async () => {
      await friendPageB.verifyReceivedRequestToast(`${RECEIVED_REQUEST_TOAST}`);
      await friendPageB.acceptFirstFriendRequest();
    });

    const transferInfo = await AllureReporter.step(
      'Choose sender by balance and send tokens with note',
      async () => {
        const info = await chooseSenderByBalance(pageA, pageB);
        const note = `e2e detail ${Date.now()}`;
        await sendTokens(info.senderPage, info.receiverName, info.amount, note);
        return { ...info, note };
      }
    );

    await AllureReporter.step(
      'Sender opens Transaction History and expands transaction detail',
      async () => {
        const sendTokenModalSender = new SendTokenModal(transferInfo.senderPage);
        await sendTokenModalSender.openTransactionHistoryFromShortProfile();

        const expectedAmountText = `- ${formatThousandSeparator(transferInfo.amount, '.')} Đồng`;
        const item = await sendTokenModalSender.verifyTransactionByAmount(
          expectedAmountText,
          'Sent'
        );
        await sendTokenModalSender.openTransactionDetail(item);

        const senderValue = await sendTokenModalSender.getTransactionDetailValue(item, 'Sender');
        const receiverValue = await sendTokenModalSender.getTransactionDetailValue(
          item,
          'Receiver'
        );
        const amountValue = await sendTokenModalSender.getTransactionDetailValue(item, 'Amount');
        const noteValue = await sendTokenModalSender.getTransactionDetailValue(item, 'Note');

        expect(senderValue).toBe(transferInfo.senderName);
        expect(receiverValue).toBe(transferInfo.receiverName);
        expect(amountValue).toBe(`${formatThousandSeparator(transferInfo.amount, '.')} Đồng`);
        expect(noteValue).toBe(transferInfo.note);
        await sendTokenModalSender.closeTransactionModal();
      }
    );
  });
});
