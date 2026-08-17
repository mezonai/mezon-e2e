import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { FileSizeTestHelpers } from '@/utils/uploadFileHelpers';
import { Page } from '@playwright/test';
import { test } from '../../../fixtures/dual.fixture';
import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

test.describe('Channel Messages - For You Inbox', () => {
  const accountA = AccountCredentials['accountKien1'];
  const accountB = AccountCredentials['accountKien7'];
  const CHANNEL_MESSAGE_TAG = 'channel-message';
  const MULTI_USER_TAG = 'multi-user';
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

  test('Verify friend request notification is displayed first in the For You inbox tab', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;
    const clanFactory = new ClanFactory();
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messageHelperB = new MessageTestHelpers(pageB);

    await AllureReporter.addDescription(`
    **Test Objective:** Verify the first notification in User B's For You inbox contains a new friend request.

    **Test Steps:**
    1. User A sends a friend request to User B and User B accepts it
    2. User A creates a clan and invites User B
    3. User B joins the clan
    4. User B opens Inbox and selects the For You tab
    5. Verify the first item's username, message, and timestamp

    **Expected Result:** The first item displays User A, "wants to add you as a friend", and a timestamp formatted as "Today at HH:mm".
    `);

    await prepareFriendAndClan(friendPageA, friendPageB, clanPageA, clanPageB, clanFactory, pageA);

    await AllureReporter.step('User B verifies the first For You item', async () => {
      await messageHelperB.openHeaderInboxButton();
      await messageHelperB.openForYouTabInInbox();
      await messageHelperB.verifyFirstForYouMessage(userNameA, 'wants to add you as a friend');
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify User B can remove the first notification from the For You inbox tab', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;
    const clanFactory = new ClanFactory();
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messageHelperB = new MessageTestHelpers(pageB);

    await AllureReporter.addDescription(`
    **Test Objective:** Verify User B can remove the first notification from the For You inbox.

    **Test Steps:**
    1. Create a new friend request notification
    2. User A creates a clan, invites User B, and User B joins
    3. User B opens Inbox and selects the For You tab
    4. User B removes the first item

    **Expected Result:** The number of For You items decreases by one.
    `);

    await prepareFriendAndClan(friendPageA, friendPageB, clanPageA, clanPageB, clanFactory, pageA);

    await AllureReporter.step('User B removes the first For You item', async () => {
      await messageHelperB.openHeaderInboxButton();
      await messageHelperB.openForYouTabInInbox();
      await messageHelperB.verifyFirstForYouMessage(userNameA, 'wants to add you as a friend');
      await messageHelperB.removeFirstForYouMessage();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify a message mentioning User B is displayed in User B inbox popover', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;
    const clanFactory = new ClanFactory();
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
    const mentionMessage = `@${userNameB}`;

    await AllureReporter.addDescription(`
    **Test Objective:** Verify a new message mentioning User B is displayed in User B's Inbox popover.

    **Test Steps:**
    1. User A and User B become friends
    2. User A creates a clan and invites User B
    3. User B joins the clan
    4. User A sends a channel message mentioning User B
    5. User B opens the Inbox popover
    6. Verify the mention message is displayed

    **Expected Result:** User A's message mentioning User B appears in User B's Inbox popover.
    `);

    await AllureReporter.addLabels({
      tag: [CHANNEL_MESSAGE_TAG, 'inbox', 'mention', MULTI_USER_TAG],
    });

    await prepareFriendAndClan(friendPageA, friendPageB, clanPageA, clanPageB, clanFactory, pageA);

    await AllureReporter.step('User A sends a message mentioning User B', async () => {
      // await messageHelperA.sendTextMessage(mentionMessage);
      await messageHelperA.mentionUserAndSend(`@${userNameB}`, [userNameB || '']);
    });

    await AllureReporter.step('User B verifies the mention in the Inbox popover', async () => {
      await pageB.reload();
      await messageHelperB.openHeaderInboxButton();
      await messageHelperB.assertMessageInInboxByContent(mentionMessage);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify User B can jump to a mentioned message from the Inbox popover', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const clanFactory = new ClanFactory();
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);
    const mentionMessage = `@${userNameB}`;

    await AllureReporter.addDescription(`
    **Test Objective:** Verify User B can jump to a channel message that mentions them from the Inbox popover.

    **Test Steps:**
    1. User A and User B become friends
    2. User A creates a clan and invites User B
    3. User B joins the clan
    4. User A sends a channel message mentioning User B
    5. User B opens the Inbox popover and verifies the mention
    6. User B hovers over the mention to display the Jump button
    7. User B clicks Jump
    8. Verify the original mentioned message is displayed in the channel

    **Expected Result:** User B is taken to the channel message that mentions them.
    `);

    await AllureReporter.addLabels({
      tag: [CHANNEL_MESSAGE_TAG, 'inbox', 'mention', 'jump', MULTI_USER_TAG],
    });

    await prepareFriendAndClan(friendPageA, friendPageB, clanPageA, clanPageB, clanFactory, pageA);

    await AllureReporter.step('User A sends a message mentioning User B', async () => {
      await messageHelperA.mentionUserAndSend(`@${userNameB}`, [userNameB || '']);
    });

    await AllureReporter.step('User B opens Inbox and verifies the mention', async () => {
      await pageB.reload();
      await messageHelperB.openHeaderInboxButton();
      await messageHelperB.assertMessageInInboxByContent(mentionMessage);
    });

    await AllureReporter.step('User B hovers and jumps to the mentioned message', async () => {
      await messageHelperB.jumpToMentionMessageFromInbox(mentionMessage);
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.cleanupClan, async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify an uploaded attachment is displayed in the channel Files list', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const clanFactory = new ClanFactory();
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messageHelperA = new MessageTestHelpers(pageA);
    const messagePageB = new MessagePage(pageB);
    const fileSizeHelpers = new FileSizeTestHelpers(pageA);
    const fileBaseName = `shared-${Date.now()}`;
    const fileName = `${fileBaseName}.txt`;
    let clanWasCreated = false;

    await AllureReporter.addDescription(`
    **Test Objective:** Verify a channel attachment is listed in the shared Files panel.

    **Test Steps:**
    1. User A and User B join the same clan
    2. User A uploads and sends a text-file attachment
    3. User B opens Gallery > Files
    4. Verify the file item, file name, and shared details are visible

    **Expected Result:** The uploaded file exists in the Files list. The test does not click the item because clicking downloads it.
    `);
    await AllureReporter.addLabels({
      tag: [CHANNEL_MESSAGE_TAG, 'attachment', 'shared-files', MULTI_USER_TAG],
    });

    try {
      await prepareFriendAndClan(
        friendPageA,
        friendPageB,
        clanPageA,
        clanPageB,
        clanFactory,
        pageA
      );
      clanWasCreated = true;

      const filePath = await fileSizeHelpers.createFileWithSize(fileBaseName, 4 * 1024, 'txt');

      await AllureReporter.step(`User A uploads and sends ${fileName}`, async () => {
        await fileSizeHelpers.uploadFileDefault(filePath);
        await pageA.locator('[data-e2e="mention-selected_file"]').waitFor({
          state: 'visible',
          timeout: 5000,
        });
        const messageInput = await messageHelperA.findMessageInput();
        await messageInput.press('Enter');
      });

      await AllureReporter.step('User B verifies the attachment in Gallery > Files', async () => {
        await pageB.reload({ waitUntil: 'domcontentloaded' });
        await messagePageB.openSharedFiles();
        await messagePageB.verifySharedFileExists(fileName, userNameA);
      });

      await AllureReporter.attachScreenshot(pageB, 'Shared attachment exists in Files list');
    } finally {
      await fileSizeHelpers.cleanupFiles();
      if (clanWasCreated) {
        await clanFactory.cleanupClan(pageA);
      }
    }
  });

  async function prepareFriendAndClan(
    friendPageA: FriendPage,
    friendPageB: FriendPage,
    clanPageA: ClanPage,
    clanPageB: ClanPage,
    clanFactory: ClanFactory,
    pageA: Page
  ) {
    await AllureReporter.step('Clean up existing friend relationships', async () => {
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

    await AllureReporter.step('User A sends a friend request and User B accepts it', async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage8, pageA);
    });

    await AllureReporter.step('User A invites User B and User B joins the clan', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await friendPageB.createDM(userNameA);
      await clanPageB.joinClanByUrlInvite(inviteUrl);
    });
  }
});
