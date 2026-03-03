import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect } from '@playwright/test';
import { test } from '../../../fixtures/dual.fixture';

test.describe('Channel Message 6', () => {
  const accountA = AccountCredentials['accountKien5'];
  const accountB = AccountCredentials['accountKien6'];
  const accountC = AccountCredentials['accountKien7'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const clanFactory = new ClanFactory();
  const [userNameA, userNameB, userNameC] = getUsernamesFromEmails([
    accountA.email,
    accountB.email,
    accountC.email,
  ]);

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage1,
      credentials: accountA,
    });
  });

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

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({
      browser,
      clanFactory,
      credentials: accountA,
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

  test('Verify that user A can share canvas on channel', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const canvasTitle = `canvas title - ${generateRandomString(10)}`;
    const canvasContent = `canvas content - ${generateRandomString(10)}`;

    await AllureReporter.addDescription(`
          **Test Objective:** Verify that user A can share canvas on channel
          
          **Test Steps:**
          1. User A and User B are friends, and User A create a canvas
          2. User A shares the canvas on channel
          3. User B can see the shared canvas on channel
          4. User B clicks on the shared canvas and can view the canvas content
          
          **Expected Result:** User A can share canvas on channel
        `);

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
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Create a canvas', async () => {
      await clanPageA.openCanvasManagementModal();
      await clanPageA.createCanvas();
      await clanPageA.fillCanvasTitle(canvasTitle);
      await clanPageA.fillCanvasContent(canvasContent);
      await clanPageA.saveCanvas();
    });

    await AllureReporter.step('Share the canvas on channel', async () => {
      await clanPageA.openCanvasManagementModal();
      await clanPageA.copyCanvasLink(canvasTitle);
      await clanPageA.openChannelByName('general');
      await messageHelperA.pasteAndSendText();
      await pageA.waitForTimeout(3000);
    });

    await AllureReporter.step('User B can see the shared canvas on channel', async () => {
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageB.openChannelByName('general');
      await messageHelperB.verifyMessageHasCanvasLink(canvasTitle);
    });

    await AllureReporter.step(
      'User B clicks on the shared canvas and can view the canvas content',
      async () => {
        await messageHelperB.clickOnMessageWithCanvasLink(canvasTitle);
        await clanPageB.assertCanvasContent(canvasTitle, canvasContent);
      }
    );
  });

  test('Verify that user can open canvas from direct message when user is member of the clan', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);
    const canvasTitle = `canvas title - ${generateRandomString(10)}`;
    const canvasContent = `canvas content - ${generateRandomString(10)}`;

    await AllureReporter.addDescription(`
          **Test Objective:** Verify that user can open canvas from direct message when user is member of the clan

          **Test Steps:**
          1. User A and User B are friends, and User A create a canvas
          2. User A shares the canvas in direct message with user B
          3. User B clicks on the shared canvas link in direct message
          4. User B can view the canvas content
          **Expected Result:** User B can open canvas from direct message when user is member of the clan
        `);

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
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Create a canvas', async () => {
      await clanPageA.openCanvasManagementModal();
      await clanPageA.createCanvas();
      await clanPageA.fillCanvasTitle(canvasTitle);
      await clanPageA.fillCanvasContent(canvasContent);
      await clanPageA.saveCanvas();
    });
    await AllureReporter.step('Share the canvas in direct message with user B', async () => {
      await clanPageA.openCanvasManagementModal();
      await clanPageA.copyCanvasLink(canvasTitle);
      await messagePageA.openSearchModalbyPressCtrlK();
      await messageHelperA.openDMByNameOnsearchModal(userNameB);
      await pageA.waitForTimeout(1500);
      await messageHelperA.pasteAndSendText();
      await pageA.waitForTimeout(3000);
    });
    await AllureReporter.step(
      'User B clicks on the shared canvas link in direct message and can view the canvas content',
      async () => {
        await pageB.reload();
        await messagePageB.openSearchModalbyPressCtrlK();
        await messageHelperB.openDMByNameOnsearchModal(userNameA);
        await pageB.waitForTimeout(1500);
        await messageHelperB.clickOnMessageWithCanvasLink(canvasTitle);
        await clanPageB.assertCanvasContent(canvasTitle, canvasContent);
      }
    );
  });

  test('Verify that user cannot open canvas from direct message when user is not member of the clan', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
    const clanPageA = new ClanPage(pageA);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);
    const canvasTitle = `canvas title - ${generateRandomString(10)}`;
    const canvasContent = `canvas content - ${generateRandomString(10)}`;

    await AllureReporter.addDescription(`
          **Test Objective:** Verify that user cannot open canvas from direct message when user is not member of the clan

          **Test Steps:**
          1. User A and User B are friends, and User A create a canvas
          2. User A shares the canvas in direct message with user B
          3. User B clicks on the shared canvas link in direct message
          4. User B cannot view the canvas content and sees error message
          **Expected Result:** User B cannot open canvas from direct message when user is not member of the clan
        `);

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
    });

    await AllureReporter.step('Create a canvas', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.openCanvasManagementModal();
      await clanPageA.createCanvas();
      await clanPageA.fillCanvasTitle(canvasTitle);
      await clanPageA.fillCanvasContent(canvasContent);
      await clanPageA.saveCanvas();
    });
    await AllureReporter.step('Share the canvas in direct message with user B', async () => {
      await clanPageA.openCanvasManagementModal();
      await clanPageA.copyCanvasLink(canvasTitle);
      await messagePageA.openSearchModalbyPressCtrlK();
      await messageHelperA.openDMByNameOnsearchModal(userNameB);
      await pageA.waitForTimeout(1500);
      await messageHelperA.pasteAndSendText();
      await pageA.waitForTimeout(3000);
    });
    await AllureReporter.step(
      'User B clicks on the shared canvas link in direct message and cannot view the canvas content',
      async () => {
        await pageB.reload();
        await messagePageB.openSearchModalbyPressCtrlK();
        await messageHelperB.openDMByNameOnsearchModal(userNameA);
        await pageB.waitForTimeout(1500);
        await messageHelperB.clickOnMessageWithCanvasLink(canvasTitle);
        const errorModal = await messageHelperB.isErrorModalVisible();
        expect(errorModal).toBeTruthy();
      }
    );
  });

  test('Verify that user cannot access canvas on private channel when user is not a member', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);
    const canvasTitle = `canvas title - ${generateRandomString(10)}`;
    const canvasContent = `canvas content - ${generateRandomString(10)}`;
    const unique = Date.now().toString(36);
    const channelName = `tc-${unique}`.slice(0, 20);

    await AllureReporter.addDescription(`
          **Test Objective:** Verify that user cannot access canvas on private channel when user is not a member

          **Test Steps:**
          1. User A and User B are friends, and User A create a private channel -> 
          2. User A create a canvas
          2. User A shares the canvas in a public channel with user B
          3. User B clicks on the shared canvas link in channel
          4. User B cannot view the canvas content and sees error message
          **Expected Result:** User cannot access canvas on private channel when user is not a member
        `);

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
    });

    await AllureReporter.step(
      `User A create new private text channel: ${channelName}`,
      async () => {
        await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await clanPageA.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PRIVATE);
        const isNewChannelPresent = await clanPageA.isNewChannelPresent(channelName);
        expect(isNewChannelPresent).toBe(true);
      }
    );

    await AllureReporter.step('Create a canvas', async () => {
      await clanPageA.openCanvasManagementModal();
      await clanPageA.createCanvas();
      await clanPageA.fillCanvasTitle(canvasTitle);
      await clanPageA.fillCanvasContent(canvasContent);
      await clanPageA.saveCanvas();
    });

    await AllureReporter.step('Share the canvas in channel', async () => {
      await clanPageA.openCanvasManagementModal();
      await clanPageA.copyCanvasLink(canvasTitle);
      await clanPageA.openChannelByName('general');
      await messageHelperA.pasteAndSendText();
      await pageA.waitForTimeout(3000);
    });

    await AllureReporter.step(
      'User B clicks on the shared canvas link in channel and cannot view the canvas content',
      async () => {
        await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await clanPageB.openChannelByName('general');
        await messageHelperB.verifyMessageHasCanvasLink(canvasTitle);
        await messageHelperB.clickOnMessageWithCanvasLink(canvasTitle);
        const errorModal = await messageHelperB.isErrorModalVisible();
        expect(errorModal).toBeTruthy();
      }
    );
  });
});
