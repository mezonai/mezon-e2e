import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { SendTokenModal } from '@/pages/Modal/SendTokenModal';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures/dual.fixture';

test.describe('Send Token - Give A Coffee On Channel Message', () => {
  const accountA = AccountCredentials['account5'];
  const accountB = AccountCredentials['account6'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const ACCEPT_REQUEST_STEP_NAME = 'User B accepts the friend request';
  const CREATE_CLAN_STEP_NAME = 'User A creates a clan and invites User B';
  const CHOOSE_GIVER_STEP_NAME = 'Choose coffee giver by balance and give a coffee';
  const SEND_TOKEN_TAG = 'send-token';
  const GIVE_COFFEE_TAG = 'give-coffee';
  const COFFEE_AMOUNT = 10_000;
  const GIVE_COFFEE_DETAIL = 'Give coffee action';
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

  async function chooseGiverByBalance(
    pageA: Page,
    pageB: Page
  ): Promise<{
    giverPage: Page;
    giverName: string;
    receiverPage: Page;
    receiverName: string;
    giverBalance: number;
  }> {
    const balanceA = await readBalance(pageA);
    const balanceB = await readBalance(pageB);

    const giverIsA = balanceA >= balanceB;
    const giverBalance = giverIsA ? balanceA : balanceB;

    test.skip(
      giverBalance <= 0,
      `Cannot give coffee: both wallets are empty (A: ${balanceA} đồng, B: ${balanceB} đồng)`
    );

    return {
      giverPage: giverIsA ? pageA : pageB,
      giverName: giverIsA ? userNameA : userNameB,
      receiverPage: giverIsA ? pageB : pageA,
      receiverName: giverIsA ? userNameB : userNameA,
      giverBalance: giverIsA ? balanceA : balanceB,
    };
  }

  async function verifySendTokenCardAndHistory(
    page: Page,
    expectedAmountPrefix: '+' | '-',
    expectedStatus: string
  ): Promise<void> {
    const sendTokenModal = new SendTokenModal(page);
    await sendTokenModal.verifySendTokenCardInDM(GIVE_COFFEE_DETAIL);
    await sendTokenModal.openTransactionHistoryFromMessageCard();

    const expectedAmountText = `${expectedAmountPrefix} ${formatThousandSeparator(
      COFFEE_AMOUNT,
      '.'
    )} Đồng`;
    await sendTokenModal.verifyTransactionByAmount(expectedAmountText, expectedStatus);
    await sendTokenModal.closeTransactionModal();
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

  test('Verify that user with more coffee can give a coffee on channel message and send token card appears in DM with reaction icon', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const helperA = new MessageTestHelpers(pageA);
    const helperB = new MessageTestHelpers(pageB);
    const clanFactory = new ClanFactory();

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user with more coffee gives a coffee on the other user's channel message, a reaction icon appears on the message and a send token card appears in DM

      **Test Steps:**
      1. User A and User B become friends
      2. User A creates a clan and invites User B
      3. User A and User B send messages back and forth in the channel
      4. Check balance of both users, user with more coffee performs Give A Coffee on the other user's message
      5. Verify reaction icon appears on the message
      6. Both users open DM and verify send token card with transaction history

      **Expected Result:** Coffee is given successfully, reaction icon appears on the message and send token card with correct information appears in DM
    `);

    await AllureReporter.addLabels({
      tag: [SEND_TOKEN_TAG, GIVE_COFFEE_TAG],
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

    await AllureReporter.step(ACCEPT_REQUEST_STEP_NAME, async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await AllureReporter.step(CREATE_CLAN_STEP_NAME, async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage2, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    const timestamp = Date.now();
    const messageFromA = `Give coffee test message from ${userNameA} ${timestamp}`;
    const messageFromB = `Give coffee test message from ${userNameB} ${timestamp}`;

    await AllureReporter.step('User A sends a message on the channel', async () => {
      await helperA.sendTextMessage(messageFromA);
    });

    await AllureReporter.step('User B replies with a message on the channel', async () => {
      await helperB.sendTextMessage(messageFromB);
    });

    const coffeeInfo = await AllureReporter.step(CHOOSE_GIVER_STEP_NAME, async () => {
      const info = await chooseGiverByBalance(pageA, pageB);
      expect(info.giverBalance).toBeGreaterThanOrEqual(COFFEE_AMOUNT);

      const giverHelper = info.giverPage === pageA ? helperA : helperB;
      const targetMessageText = info.giverName === userNameA ? messageFromB : messageFromA;
      const targetMessage = giverHelper.getMessageItemLocator(targetMessageText).last();

      await AllureReporter.step(
        `${info.giverName} performs Give A Coffee on the message of ${info.receiverName}`,
        async () => {
          await giverHelper.giveCoffeeToMessage(targetMessage);
        }
      );

      return { ...info, targetMessageText };
    });

    await AllureReporter.step('Verify reaction icon appears on the message', async () => {
      const giverHelper = coffeeInfo.giverPage === pageA ? helperA : helperB;
      const receiverHelper = coffeeInfo.receiverPage === pageA ? helperA : helperB;

      const targetOnGiverPage = giverHelper
        .getMessageItemLocator(coffeeInfo.targetMessageText)
        .last();
      await giverHelper.verifyCoffeeReactionOnMessage(targetOnGiverPage);

      const targetOnReceiverPage = receiverHelper
        .getMessageItemLocator(coffeeInfo.targetMessageText)
        .last();
      await receiverHelper.verifyCoffeeReactionOnMessage(targetOnReceiverPage);
    });

    await AllureReporter.step(
      `${coffeeInfo.giverName} opens DM with ${coffeeInfo.receiverName}`,
      async () => {
        const giverHelper = coffeeInfo.giverPage === pageA ? helperA : helperB;
        const messagePageGiver = new MessagePage(coffeeInfo.giverPage);
        await messagePageGiver.openSearchModalbyPressCtrlK();
        await giverHelper.openDMByNameOnsearchModal(coffeeInfo.receiverName);
      }
    );

    await AllureReporter.step(
      'Verify send token card and Sent transaction history are displayed in DM of giver',
      async () => {
        await verifySendTokenCardAndHistory(coffeeInfo.giverPage, '-', 'Sent');
      }
    );

    await AllureReporter.step(
      `${coffeeInfo.receiverName} opens DM with ${coffeeInfo.giverName}`,
      async () => {
        const receiverHelper = coffeeInfo.receiverPage === pageA ? helperA : helperB;
        const messagePageReceiver = new MessagePage(coffeeInfo.receiverPage);
        await messagePageReceiver.openSearchModalbyPressCtrlK();
        await receiverHelper.openDMByNameOnsearchModal(coffeeInfo.giverName);
      }
    );

    await AllureReporter.step(
      'Verify send token card and Received transaction history are displayed in DM of receiver',
      async () => {
        await verifySendTokenCardAndHistory(coffeeInfo.receiverPage, '+', 'Received');
      }
    );

    await AllureReporter.step('Clean up clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
