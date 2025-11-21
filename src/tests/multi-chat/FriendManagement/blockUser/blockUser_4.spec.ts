import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { expect, test } from '@/fixtures/dual.fixture';
import { ClanInviteFriendModal } from '@/pages/Clan/ClanInviteFriendModal';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ClanInviteModal } from '@/pages/Modal/ClanInviteModal';
import { ForwardMessageModal } from '@/pages/Modal/ForwarMessageModal';
import { ROUTES } from '@/selectors';
import { ThreadStatus } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { OnboardingHelpers } from '@/utils/onboardingHelpers';
import generateRandomString from '@/utils/randomString';

test.describe('Friend Management - Block User', () => {
  const accountA = AccountCredentials['accountKien8'];
  const accountB = AccountCredentials['accountKien9'];
  const userNameA = accountA.email.split('@')[0];
  const userNameB = accountB.email.split('@')[0];
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
        await dual.pageB.waitForTimeout(200);
        const credentials = await AuthHelper.setupAuthWithEmailPassword(dual.pageB, accountB);
        await AuthHelper.prepareBeforeTest(
          dual.pageB,
          joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS),
          credentials
        );
      },
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

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
    await test.step('Establish friendship between users', async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageB.acceptFirstFriendRequest();
      await friendPageA.assertAllFriend(userNameB);
    });
  });
  test.afterEach(async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await Promise.allSettled([
      friendPageA.unblockFriend(userNameB),
      friendPageB.unblockFriend(userNameA),
    ]);
    await dual.parallel({
      A: async () => {
        await AuthHelper.logout(dual.pageA);
      },
      B: async () => {
        await AuthHelper.logout(dual.pageB);
      },
    });
  });

  test('Should not show blocked user in clan channel forward message list', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanFactory = new ClanFactory();
    const clanMenuPanelA = new ClanMenuPanel(pageA);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);

    await test.step('User A sends a message in clan channel', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.blockUser, pageA);
      const helpers = new OnboardingHelpers(pageA);
      const { sent } = await helpers.sendTestMessage();
      expect(sent).toBe(true);
    });
    let inviteLink: string = '';
    await test.step('User A invite User B to clan', async () => {
      await clanMenuPanelA.openInvitePeopleModal();
      const clanInviteFriendModalA = new ClanInviteFriendModal(pageA);
      inviteLink = await clanInviteFriendModalA.getInviteLink();
      expect(inviteLink).not.toBe('');
    });

    await test.step('User A blocks User B', async () => {
      await friendPageA.blockFriend(userNameB);
    });

    await test.step('User B joins the clan', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await friendPageB.page.goto(inviteLink, {
        waitUntil: 'domcontentloaded',
      });
      const clanInviteModalB = new ClanInviteModal(pageB);
      await clanInviteModalB.acceptInvite();
    });

    await test.step('User B should not shown in forward message list', async () => {
      const firstMessageA = await messagePageA.getFirstMessage();
      await messagePageA.forwardMessage(firstMessageA);
      const forwardMessageModalA = new ForwardMessageModal(pageA);
      const isUserBShown = await forwardMessageModalA.isUserShownInList(userNameB);
      expect(isUserBShown).toBeFalsy();
      await pageA.reload({
        waitUntil: 'domcontentloaded',
      });
    });

    await test.step('User A should not shown in forward message list', async () => {
      const firstMessage = await messagePageB.getFirstMessage();
      await messagePageB.forwardMessage(firstMessage);
      const forwardMessageModalB = new ForwardMessageModal(pageB);
      const isUserBShown = await forwardMessageModalB.isUserShownInList(userNameA);
      expect(isUserBShown).toBeFalsy();
    });

    await clanFactory.cleanupClan(pageA);
  });

  test('Should not show blocked user in thread forward message list', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanFactory = new ClanFactory();
    const clanMenuPanelA = new ClanMenuPanel(pageA);
    const messageHelpersA = new MessageTestHelpers(pageA);
    const forwardMessageModalA = new ForwardMessageModal(pageA);
    const forwardMessageModalB = new ForwardMessageModal(pageB);
    const threadName = `${ThreadStatus.PUBLIC.toLowerCase()}-thread-${generateRandomString(10)}`;
    const baseChannelMessage = `Thread base message ${Date.now()}`;
    const threadMessage = `Thread message ${Date.now()}`;

    let inviteLink: string = '';

    await AllureReporter.addDescription(`
      **Test Objective:** Ensure blocked friends are excluded from the forward suggestion list inside a thread. 
      
      **Test Steps:**
      1. User A creates a clan and generates an invite link
      2. User A blocks User B
      3. User B joins via invite
      4. User A sends a channel message and starts a thread
      5. Both users open the thread
      6. User A posts a message inside the thread
      7. Each user opens the forward modal for that thread message
      
      **Expected Result:** The blocked user never appears in the forward suggestion list.
    `);

    await test.step('Setup clan for thread test', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.blockUser, pageA);
    });

    await test.step('User A invite User B to clan', async () => {
      await clanMenuPanelA.openInvitePeopleModal();
      const clanInviteFriendModalA = new ClanInviteFriendModal(pageA);
      inviteLink = await clanInviteFriendModalA.getInviteLink();
      expect(inviteLink).not.toBe('');
    });

    await test.step('User A blocks User B', async () => {
      await friendPageA.blockFriend(userNameB);
      await friendPageA.assertBlockFriend(userNameB);
    });

    await test.step('User B joins the clan', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await friendPageB.page.goto(inviteLink, {
        waitUntil: 'domcontentloaded',
      });
      const clanInviteModalB = new ClanInviteModal(pageB);
      await clanInviteModalB.acceptInvite();
    });

    await test.step('User A sends channel message and creates thread', async () => {
      await messageHelpersA.sendTextMessage(baseChannelMessage);
      const latestMessage = await messageHelpersA.findLastMessage();
      await expect(latestMessage).toBeVisible({ timeout: 10000 });
      await pageA.waitForTimeout(2000);
      await messageHelpersA.createThread(latestMessage, threadName);
      await pageA.waitForTimeout(1000);
      await messageHelpersA.sendMessageInThread(threadMessage, true);
      await pageA.waitForTimeout(1000);
    });

    await test.step('Both users open the new thread', async () => {
      const clanPageA = new ClanPage(pageA);
      const clanPageB = new ClanPage(pageB);
      await clanPageA.openThread(threadName);
      await pageA.waitForTimeout(1000);
      await clanPageB.openThread(threadName);
    });

    await test.step('User A posts a message in the thread', async () => {
      await messageHelpersA.sendTextMessage(threadMessage);
    });

    await test.step('User B should not shown in thread forward message list for User A', async () => {
      const messagePageA = new MessagePage(pageA);
      const targetMessage = await messagePageA.getFirstMessage();
      await messagePageA.forwardMessage(targetMessage);
      const isUserBShown = await forwardMessageModalA.isUserShownInList(userNameB);
      expect(isUserBShown).toBeFalsy();
      await pageA.reload({
        waitUntil: 'domcontentloaded',
      });
    });

    await test.step('User A should not shown in thread forward message list for User B', async () => {
      const messagePageB = new MessagePage(pageB);
      const targetMessage = await messagePageB.getFirstMessage();
      await messagePageB.forwardMessage(targetMessage);
      const isUserAShown = await forwardMessageModalB.isUserShownInList(userNameA);
      expect(isUserAShown).toBeFalsy();
      await pageB.reload({
        waitUntil: 'domcontentloaded',
      });
    });

    await clanFactory.cleanupClan(pageA);
  });

  test('Should not show blocked user in DM forward message list', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);
    const forwardMessageModalA = new ForwardMessageModal(pageA);
    const forwardMessageModalB = new ForwardMessageModal(pageB);
    const messageText = `Forward message ${Date.now()}`;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that blocked users are excluded from the DM forward message suggestion list. 
      
      **Test Steps:**
      1. Users A and B open a direct message
      2. User A sends a message in the DM
      3. User A blocks User B from the DM
      4. User A opens the forward message modal
      5. User B opens the forward message modal
      
      **Expected Result:** Neither user should see the other in the forward message suggestion list once the block is active.
    `);

    await test.step('Create DM between User A and User B', async () => {
      await friendPageA.createDM(userNameB);
      await friendPageB.createDM(userNameA);
    });

    await test.step('User A sends message in DM', async () => {
      await messagePageA.sendMessageWhenInDM(messageText);
      const sentMessage = await messagePageA.getMessageByText(messageText);
      await sentMessage.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Verify message is visible for User B', async () => {
      const receivedMessage = await messagePageB.getMessageByText(messageText);
      await receivedMessage.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('User A blocks User B from DM', async () => {
      await friendPageA.blockFriendFromDM(userNameB);
      await friendPageA.page.waitForTimeout(1000);
    });

    await test.step('User B should not shown in DM forward message list for User A', async () => {
      const targetMessage = await messagePageA.getMessageByText(messageText);
      await targetMessage.waitFor({ state: 'visible', timeout: 10000 });
      await messagePageA.forwardMessage(targetMessage);
      const isUserBShown = await forwardMessageModalA.isUserShownInList(userNameB);
      expect(isUserBShown).toBeFalsy();
      await pageA.reload({
        waitUntil: 'domcontentloaded',
      });
    });

    await test.step('User A should not shown in DM forward message list for User B', async () => {
      const targetMessage = await messagePageB.getMessageByText(messageText);
      await targetMessage.waitFor({ state: 'visible', timeout: 10000 });
      await messagePageB.forwardMessage(targetMessage);
      const isUserAShown = await forwardMessageModalB.isUserShownInList(userNameA);
      expect(isUserAShown).toBeFalsy();
      await pageB.reload({
        waitUntil: 'domcontentloaded',
      });
    });
  });
  test('Should not show blocked user in topic forward message list', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63492',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanFactory = new ClanFactory();
    const clanMenuPanelA = new ClanMenuPanel(pageA);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);
    const messageHelpersA = new MessageTestHelpers(pageA);
    const messageHelpersB = new MessageTestHelpers(pageB);
    const forwardMessageModalA = new ForwardMessageModal(pageA);
    const forwardMessageModalB = new ForwardMessageModal(pageB);
    const topicMessage = `Topic forward message ${Date.now()}`;
    let inviteLink = '';
    let baseMessage = '';

    await AllureReporter.addDescription(`
      **Test Objective:** Confirm that blocked friends are excluded from the topic forward message suggestion list.
      
      **Test Steps:**
      1. User A creates a clan and generates an invite link
      2. User A blocks User B
      3. User B joins the clan via invite
      4. User A sends a message and starts a topic discussion
      5. Both users open the topic and User A posts a message inside it
      6. User A opens the forward modal for the topic message
      7. User B opens the forward modal for the same topic message
      
      **Expected Result:** Each user should not see the blocked counterpart in the forward suggestion list.
    `);

    await test.step('Setup clan for topic test', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.blockUser, pageA);
    });

    await test.step('User A generates invite link for clan', async () => {
      await clanMenuPanelA.openInvitePeopleModal();
      const clanInviteFriendModalA = new ClanInviteFriendModal(pageA);
      inviteLink = await clanInviteFriendModalA.getInviteLink();
      expect(inviteLink).not.toBe('');
    });

    await test.step('User A blocks User B', async () => {
      await friendPageA.blockFriend(userNameB);
      await friendPageA.assertBlockFriend(userNameB);
    });

    await test.step('User B joins the clan via invite link', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await friendPageB.page.goto(inviteLink, {
        waitUntil: 'domcontentloaded',
      });
      const clanInviteModalB = new ClanInviteModal(pageB);
      await clanInviteModalB.acceptInvite();
    });

    await test.step('User A sends message and creates topic discussion', async () => {
      const onboardingHelpersA = new OnboardingHelpers(pageA);
      const { sent, message } = await onboardingHelpersA.sendTestMessage();
      expect(sent).toBe(true);
      baseMessage = message;
      await messageHelpersA.createTopicToInitMessage(baseMessage);
    });

    await test.step('Verify base message visible for User B', async () => {
      const messageLocatorB = await messagePageB.getMessageByText(baseMessage);
      await messageLocatorB.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Both users open the topic discussion', async () => {
      const viewTopicButtonA = await messagePageA.getLastViewTopicButton();
      await expect(viewTopicButtonA).toBeVisible({ timeout: 5000 });
      await viewTopicButtonA.click();
      await pageA.waitForTimeout(1000);
      const topicInputA = await messagePageA.getTopicInput();
      await expect(topicInputA).toBeVisible({ timeout: 2000 });

      const viewTopicButtonB = await messagePageB.getLastViewTopicButton();
      await pageB.reload({
        waitUntil: 'domcontentloaded',
      });
      await expect(viewTopicButtonB).toBeVisible({ timeout: 10000 });
      await viewTopicButtonB.click();
      const topicInputB = await messagePageB.getTopicInput();
      await expect(topicInputB).toBeVisible({ timeout: 5000 });
    });

    await test.step('User A sends message inside topic', async () => {
      await messageHelpersA.sendMessageInThread(topicMessage);
      const topicMessageLocatorA = messageHelpersA.getTopicMessageItemByText(topicMessage);
      await expect(topicMessageLocatorA).toBeVisible({ timeout: 10000 });
      const topicMessageLocatorB = messageHelpersB.getTopicMessageItemByText(topicMessage);
      await expect(topicMessageLocatorB).toBeVisible({ timeout: 10000 });
    });

    await test.step('User B should not shown in topic forward message list for User A', async () => {
      const topicMessageLocatorA = messageHelpersA.getTopicMessageItemByText(topicMessage);
      await messageHelpersA.openForwardModal(topicMessageLocatorA);
      const isUserBShown = await forwardMessageModalA.isUserShownInList(userNameB);
      expect(isUserBShown).toBeFalsy();
      await pageA.reload({
        waitUntil: 'domcontentloaded',
      });
    });

    await test.step('User A should not shown in topic forward message list for User B', async () => {
      const topicInputB = await messagePageB.getTopicInput();
      const topicInputVisible = await topicInputB.isVisible();
      if (!topicInputVisible) {
        const viewTopicButtonB = await messagePageB.getLastViewTopicButton();
        await viewTopicButtonB.click();
        const topicInputB = await messagePageB.getTopicInput();
        await expect(topicInputB).toBeVisible({ timeout: 5000 });
      }
      const topicMessageLocatorB = messageHelpersB.getTopicMessageItemByText(topicMessage);
      await expect(topicMessageLocatorB).toBeVisible({ timeout: 10000 });
      await messageHelpersB.openForwardModal(topicMessageLocatorB);
      const isUserAShown = await forwardMessageModalB.isUserShownInList(userNameA);
      expect(isUserAShown).toBeFalsy();
      await pageB.reload({
        waitUntil: 'domcontentloaded',
      });
    });

    await clanFactory.cleanupClan(pageA);
  });
});
