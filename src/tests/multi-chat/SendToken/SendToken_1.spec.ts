import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { test } from '@/fixtures/dual.fixture';
import { FriendPage } from '@/pages/FriendPage';
import { SendTokenModal } from '@/pages/Modal/SendTokenModal';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect } from '@playwright/test';

test.describe('Send Token - Short Profile & Send Modal', () => {
  const accountA = AccountCredentials['account7'];
  const accountB = AccountCredentials['account2-4'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const ACCEPT_REQUEST_STEP_NAME = 'User B accepts the friend request';
  const RECEIVED_REQUEST_TOAST = `${userNameA} wants to add you as a friend`;
  const SEND_TOKEN_TAG = 'send-token';
  const OPEN_SEND_MODAL_STEP_NAME = 'User A opens Send Tokens modal';
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

  test('Verify that short profile displays balance when clicking footer profile avatar', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA } = dual;
    const sendTokenModalA = new SendTokenModal(pageA);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that short profile displays balance when clicking footer profile avatar

      **Test Steps:**
      1. User A logs in
      2. User A clicks on footer profile avatar
      3. Verify short profile is displayed with balance information

      **Expected Result:** Short profile displays balance information
    `);

    await AllureReporter.addLabels({
      tag: [SEND_TOKEN_TAG, 'short-profile'],
    });

    await AllureReporter.step('User A clicks on footer profile avatar', async () => {
      await sendTokenModalA.openShortProfileFromFooter();
    });

    await AllureReporter.step('Verify balance is displayed in short profile', async () => {
      const balance = await sendTokenModalA.getBalanceFromShortProfile();
      expect(balance).toBeGreaterThanOrEqual(0);
    });

    await AllureReporter.step('Close short profile', async () => {
      await sendTokenModalA.closeShortProfile();
    });
  });

  test('Verify that Transfer Funds opens the Send Tokens modal', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA } = dual;
    const sendTokenModalA = new SendTokenModal(pageA);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that Transfer Funds opens the Send Tokens modal

      **Test Steps:**
      1. User A clicks on footer profile avatar
      2. User A clicks Transfer Funds in short profile
      3. Verify Send Tokens modal is displayed

      **Expected Result:** Send Tokens modal is displayed with search user, amount and note fields
    `);

    await AllureReporter.addLabels({
      tag: [SEND_TOKEN_TAG, 'send-modal'],
    });

    await AllureReporter.step('User A opens short profile from footer avatar', async () => {
      await sendTokenModalA.openShortProfileFromFooter();
    });

    await AllureReporter.step('User A clicks Transfer Funds', async () => {
      await sendTokenModalA.openSendTokenModalFromShortProfile();
    });

    await AllureReporter.step(
      'Verify Send Tokens modal displays search user, amount and note fields',
      async () => {
        await sendTokenModalA.verifySendTokenModalVisible();
      }
    );

    await AllureReporter.step('Close Send Tokens modal with Cancel button', async () => {
      await sendTokenModalA.clickCancel();
    });
  });

  test('Verify that Send Tokens button is disabled when required fields are empty', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA } = dual;
    const sendTokenModalA = new SendTokenModal(pageA);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that Send Tokens button is disabled when required fields are empty

      **Test Steps:**
      1. User A opens Send Tokens modal
      2. Verify Send Tokens button is disabled without recipient and amount

      **Expected Result:** Send Tokens button is disabled when required fields are empty
    `);

    await AllureReporter.addLabels({
      tag: [SEND_TOKEN_TAG, 'validation'],
    });

    await AllureReporter.step(OPEN_SEND_MODAL_STEP_NAME, async () => {
      await sendTokenModalA.openShortProfileFromFooter();
      await sendTokenModalA.openSendTokenModalFromShortProfile();
    });

    await AllureReporter.step(
      'Verify Send Tokens button is disabled without recipient and amount',
      async () => {
        const isDisabled = await sendTokenModalA.isSendButtonDisabled();
        expect(isDisabled).toBe(true);
      }
    );

    await AllureReporter.step('Close Send Tokens modal', async () => {
      await sendTokenModalA.clickCancel();
    });
  });

  test('Verify that user can search and select recipient in Send Tokens modal', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA } = dual;
    const sendTokenModalA = new SendTokenModal(pageA);
    const note = `e2e search recipient ${Date.now()}`;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can search and select recipient in Send Tokens modal

      **Test Steps:**
      1. User A opens Send Tokens modal
      2. User A searches for User B by username
      3. User A selects User B from the suggestion list
      4. User A fills amount and note
      5. Verify Send Tokens button becomes enabled

      **Expected Result:** User can search and select recipient, Send Tokens button becomes enabled
    `);

    await AllureReporter.addLabels({
      tag: [SEND_TOKEN_TAG, 'search-user'],
    });

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      const friendPageA = new FriendPage(pageA);
      const friendPageB = new FriendPage(dual.pageB);
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
      const friendPageA = new FriendPage(pageA);
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
    });

    await AllureReporter.step(ACCEPT_REQUEST_STEP_NAME, async () => {
      const friendPageB = new FriendPage(dual.pageB);
      await friendPageB.verifyReceivedRequestToast(`${RECEIVED_REQUEST_TOAST}`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step(OPEN_SEND_MODAL_STEP_NAME, async () => {
      await sendTokenModalA.openShortProfileFromFooter();
      await sendTokenModalA.openSendTokenModalFromShortProfile();
    });

    await AllureReporter.step(`User A searches and selects recipient: ${userNameB}`, async () => {
      await sendTokenModalA.searchAndSelectUser(userNameB);
    });

    await AllureReporter.step('User A fills amount and note', async () => {
      await sendTokenModalA.fillAmount('10000');
      await sendTokenModalA.fillNote(note);
    });

    await AllureReporter.step('Verify Send Tokens button becomes enabled', async () => {
      const isDisabled = await sendTokenModalA.isSendButtonDisabled();
      expect(isDisabled).toBe(false);
    });

    await AllureReporter.step('Close Send Tokens modal', async () => {
      await sendTokenModalA.clickCancel();
    });
  });

  test('Verify that Cancel button closes the Send Tokens modal', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA } = dual;
    const sendTokenModalA = new SendTokenModal(pageA);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that Cancel button closes the Send Tokens modal

      **Test Steps:**
      1. User A opens Send Tokens modal
      2. User A clicks Cancel button
      3. Verify Send Tokens modal is closed

      **Expected Result:** Cancel button closes the Send Tokens modal
    `);

    await AllureReporter.addLabels({
      tag: [SEND_TOKEN_TAG, 'cancel'],
    });

    await AllureReporter.step(OPEN_SEND_MODAL_STEP_NAME, async () => {
      await sendTokenModalA.openShortProfileFromFooter();
      await sendTokenModalA.openSendTokenModalFromShortProfile();
    });

    await AllureReporter.step('User A clicks Cancel button', async () => {
      await sendTokenModalA.clickCancel();
    });
  });
});
