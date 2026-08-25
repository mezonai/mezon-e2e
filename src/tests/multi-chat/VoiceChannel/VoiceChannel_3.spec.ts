import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { test } from '@/fixtures/dual.fixture';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { SendTokenModal } from '@/pages/Modal/SendTokenModal';
import { ROUTES } from '@/selectors';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect, Page } from '@playwright/test';
import { CHANNEL_MESSAGE_STEPS } from '../ChannelMessage/ChannelMessageTestConstants';

test.describe('Voice Channel - Send Flower', () => {
  const accountA = AccountCredentials['account1'];
  const accountB = AccountCredentials['account2'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const ACCEPT_REQUEST_STEP_NAME = 'User B accepts the friend request';
  const SEND_TOKEN_TAG = 'send-flower';
  const MIN_BALANCE_TO_SEND_FLOWER = 50000;
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const RECEIVED_REQUEST_TOAST = `${userNameA} wants to add you as a friend`;
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);

  async function readBalance(page: Page): Promise<number> {
    const sendTokenModal = new SendTokenModal(page);
    await sendTokenModal.openShortProfileFromFooter();
    const balance = await sendTokenModal.getBalanceFromShortProfile();
    await sendTokenModal.closeShortProfile();
    return balance;
  }

  async function setupFriendship(friendPageA: FriendPage, friendPageB: FriendPage): Promise<void> {
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
      await friendPageB.verifyReceivedRequestToast(RECEIVED_REQUEST_TOAST);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step(CHANNEL_MESSAGE_STEPS.verifyMutualFriends, async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });
  }

  async function setupClanWithVoiceChannelAndJoin(
    clanPageA: ClanPage,
    clanPageB: ClanPage
  ): Promise<{ clanFactory: ClanFactory; channelName: string }> {
    const clanFactory = new ClanFactory();

    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, clanPageA.page);
    });

    const channelName = `voice-${Date.now().toString(36)}-${test.info().parallelIndex}`;

    await AllureReporter.step(`Create new voice channel: ${channelName}`, async () => {
      await clanPageA.createNewChannel(ChannelType.VOICE, channelName);
      const isNewChannelPresent = await clanPageA.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('User A invites User B to clan and User B accepts it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Both users join the voice channel', async () => {
      const isJoinedVoiceChannelA = await clanPageA.joinVoiceChannel(channelName);
      expect(isJoinedVoiceChannelA).toBe(true);

      const isJoinedVoiceChannelB = await clanPageB.joinVoiceChannel(channelName);
      expect(isJoinedVoiceChannelB).toBe(true);
    });

    return { clanFactory, channelName };
  }

  async function chooseFlowerSenderByBalance(
    pageA: Page,
    pageB: Page
  ): Promise<{ senderPage: Page; senderName: string; receiverName: string; balance: number }> {
    const balanceA = await readBalance(pageA);
    const balanceB = await readBalance(pageB);

    const senderIsA = balanceA >= balanceB;

    return {
      senderPage: senderIsA ? pageA : pageB,
      senderName: senderIsA ? userNameA : userNameB,
      receiverName: senderIsA ? userNameB : userNameA,
      balance: senderIsA ? balanceA : balanceB,
    };
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

  test('Verify that account with more than 50k tokens can be chosen to send flower', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA, pageB } = dual;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that account with more than 50k tokens can be chosen to send flower

      **Test Steps:**
      1. User A and User B become friends
      2. Get balance of both users from short profile
      3. Choose the user with higher balance as flower sender
      4. Verify chosen sender has more than 50k tokens

      **Expected Result:** Chosen flower sender has more than 50k tokens
    `);

    await AllureReporter.addLabels({
      tag: [SEND_TOKEN_TAG, 'balance-check'],
    });

    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await setupFriendship(friendPageA, friendPageB);

    const flowerSender = await chooseFlowerSenderByBalance(pageA, pageB);

    await AllureReporter.step(
      `Verify chosen sender (${flowerSender.senderName}) has more than 50k tokens`,
      async () => {
        expect(flowerSender.balance).toBeGreaterThan(MIN_BALANCE_TO_SEND_FLOWER);
      }
    );
  });

  test('Verify that Send Flower option is visible when right-clicking on user avatar in voice room', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA, pageB } = dual;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that Send Flower option is visible when right-clicking on user avatar in voice room

      **Test Steps:**
      1. User A and User B become friends
      2. User A creates clan and voice channel, invites User B
      3. Both users join the voice channel
      4. Sender right-clicks on receiver avatar in voice room
      5. Verify Send Flower option is visible in context menu

      **Expected Result:** Send Flower option is visible when right-clicking on user avatar in voice room
    `);

    await AllureReporter.addLabels({
      tag: [SEND_TOKEN_TAG, 'context-menu'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await setupFriendship(friendPageA, friendPageB);

    const { clanFactory } = await setupClanWithVoiceChannelAndJoin(clanPageA, clanPageB);

    const flowerSender = await chooseFlowerSenderByBalance(pageA, pageB);
    expect(flowerSender.balance).toBeGreaterThan(MIN_BALANCE_TO_SEND_FLOWER);

    const senderClanPage = flowerSender.senderName === userNameA ? clanPageA : clanPageB;

    await AllureReporter.step(
      `Sender (${flowerSender.senderName}) right-clicks on receiver (${flowerSender.receiverName}) avatar in voice room`,
      async () => {
        await senderClanPage.openUserContextInVoiceRoom(flowerSender.receiverName);
      }
    );

    await AllureReporter.step('Verify Send Flower option is visible in context menu', async () => {
      const isVisible = await senderClanPage.isSendFlowerOptionVisible();
      expect(isVisible).toBe(true);
    });

    await test.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that user can send flower to another user in voice channel', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
    });

    const { pageA, pageB } = dual;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can send flower to another user in voice channel

      **Test Steps:**
      1. User A and User B become friends
      2. User A creates clan and voice channel, invites User B
      3. Both users join the voice channel
      4. Sender (balance > 50k) right-clicks on receiver avatar and clicks Send Flower
      5. Verify sender balance decreases after sending flower

      **Expected Result:** Flower is sent successfully and sender balance decreases
    `);

    await AllureReporter.addLabels({
      tag: [SEND_TOKEN_TAG, 'send-flower'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await setupFriendship(friendPageA, friendPageB);

    const { clanFactory } = await setupClanWithVoiceChannelAndJoin(clanPageA, clanPageB);

    const flowerSender = await chooseFlowerSenderByBalance(pageA, pageB);
    expect(flowerSender.balance).toBeGreaterThan(MIN_BALANCE_TO_SEND_FLOWER);

    const senderClanPage = flowerSender.senderName === userNameA ? clanPageA : clanPageB;

    await AllureReporter.step(
      `Sender (${flowerSender.senderName}) sends flower to receiver (${flowerSender.receiverName})`,
      async () => {
        await senderClanPage.openUserContextInVoiceRoom(flowerSender.receiverName);
        const isClicked = await senderClanPage.clickSendFlower();
        expect(isClicked).toBe(true);
      }
    );

    await AllureReporter.step('Verify sender balance decreases after sending flower', async () => {
      await expect
        .poll(async () => readBalance(flowerSender.senderPage), { timeout: 20000 })
        .toBeLessThan(flowerSender.balance);
    });

    await test.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
