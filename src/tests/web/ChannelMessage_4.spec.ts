import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { expect, test } from '@playwright/test';
import { WEBSITE_CONFIGS } from '../../config/environment';
import { joinUrlPaths } from '../../utils/joinUrlPaths';
import { MessageTestHelpers } from '../../utils/messageHelpers';

const MEZON_BASE_URL = WEBSITE_CONFIGS.MEZON.baseURL || '';
const DIRECT_CHAT_URL = joinUrlPaths(MEZON_BASE_URL, 'chat/direct/message/1955879210568388608/3');

interface NavigationHelpers {
  navigateToHomePage(): Promise<void>;
  navigateToDirectChat(): Promise<void>;
  navigateToClanChannel(): Promise<void>;
}

test.describe('Channel Message - Module 4', () => {
  let messageHelpers: MessageTestHelpers;
  let clanSetupHelper: ClanSetupHelper;
  let testClanName: string;
  let testClanUrl: string;

  test.use({ storageState: 'playwright/.auth/account2-4.json' });

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(
      ClanSetupHelper.configs.channelMessage4
    );

    testClanName = setupResult.clanName;
    testClanUrl = setupResult.clanUrl;
  });

  test.afterAll(async ({ browser }) => {
    if (clanSetupHelper && testClanName && testClanUrl) {
      await clanSetupHelper.cleanupClan(
        testClanName,
        testClanUrl,
        ClanSetupHelper.configs.channelMessage4.suiteName
      );
    }
  });

  const createNavigationHelpers = (page: any): NavigationHelpers => ({
    async navigateToHomePage(): Promise<void> {
      await page.goto(MEZON_BASE_URL);
      await page.waitForLoadState('domcontentloaded');
    },

    async navigateToDirectChat(): Promise<void> {
      const directFriendsUrl = joinUrlPaths(MEZON_BASE_URL, 'chat/direct/friends');
      await page.goto(directFriendsUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    },

    async navigateToClanChannel(): Promise<void> {
      // Use the dynamically created clan URL
      await page.goto(testClanUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    },
  });

  test.beforeEach(async ({ page, context }, testInfo) => {
    await AllureReporter.initializeTest(page, testInfo, {
      story: AllureConfig.Stories.TEXT_MESSAGING,
      severity: AllureConfig.Severity.CRITICAL,
      testType: AllureConfig.TestTypes.E2E,
    });

    await AllureReporter.addWorkItemLinks({
      tms: '63368',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    messageHelpers = new MessageTestHelpers(page);
    const navigationHelpers = createNavigationHelpers(page);

    await AllureReporter.step('Setup test environment', async () => {
      await navigationHelpers.navigateToClanChannel();
    });
  });

  test('Jump to pinned message and verify in main chat', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63397',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    messageHelpers = new MessageTestHelpers(page);

    const messageToPin = `Test jump message ${Date.now()}`;
    await messageHelpers.sendTextMessage(messageToPin);

    const targetMessage = await messageHelpers.findLastMessage();
    await messageHelpers.pinMessage(targetMessage);

    await messageHelpers.openPinnedMessagesModal();

    const modalSelectors = [
      '.group\\/item-pinMess',
      '[class*="group/item-pinMess"]',
      '[role="dialog"]',
    ];

    let modalFound = false;
    for (const selector of modalSelectors) {
      const modalElement = page.locator(selector).first();
      if (await modalElement.isVisible({ timeout: 2000 })) {
        modalFound = true;
        break;
      }
    }
    expect(modalFound).toBeTruthy();

    await messageHelpers.clickJumpToMessage(messageToPin);

    const isMessageVisible = await messageHelpers.verifyMessageVisibleInMainChat(messageToPin);
    expect(isMessageVisible).toBeTruthy();

    await page.waitForTimeout(2000);
  });

  test('Test hashtag channel functionality', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63398',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);
    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const messageInput = await messageHelpers.findMessageInput();
    await messageInput.click();
    await page.waitForTimeout(500);

    await messageInput.type('#');
    await page.waitForTimeout(2000);

    const channelListVisible = await messageHelpers.verifyHashtagChannelList();
    expect(channelListVisible).toBeTruthy();

    const hasExpectedChannels = await messageHelpers.verifyExpectedChannelsInList();
    expect(hasExpectedChannels).toBeTruthy();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  });

  test('Mention user list appears with @', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63399',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);
    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const messageInput = await messageHelpers.findMessageInput();
    await messageInput.click();
    await page.waitForTimeout(300);

    await messageInput.type('@');
    await page.waitForTimeout(1500);

    const mentionVisible = await messageHelpers.verifyMentionListVisible();
    expect(mentionVisible).toBeTruthy();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('Mention specific user and send message', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63399',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);
    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const candidateNames = ['nguyen.nguyen'];
    await messageHelpers.mentionUserAndSend('@ng', candidateNames);
  });

  test('React to a message with 3 different emojis', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63400',
    });

    messageHelpers = new MessageTestHelpers(page);
    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const msg = `Reaction test ${Date.now()}`;
    await messageHelpers.sendTextMessage(msg);
    await page.waitForTimeout(1000);

    const target = await messageHelpers.findLastMessage();
    const emojisToAdd = ['😂', '👍', '💯'];
    const addedEmojis: string[] = [];

    for (let i = 0; i < emojisToAdd.length; i++) {
      const emoji = emojisToAdd[i];

      const picked = await messageHelpers.reactToMessage(target, [emoji]);
      await page.waitForTimeout(2000);

      if (picked) {
        addedEmojis.push(picked);
      }

      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(2000);

    const hasAllReactions = await messageHelpers.verifyReactionOnMessage(target, addedEmojis);
    expect(hasAllReactions).toBeTruthy();
    expect(addedEmojis.length).toBeGreaterThanOrEqual(2);
  });
});
