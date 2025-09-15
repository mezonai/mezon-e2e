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
  clickUserInChatList(username: string): Promise<void>;
  navigateToClanChannel(): Promise<void>;
}

test.describe('Channel Message - Module 2', () => {
  let messageHelpers: MessageTestHelpers;
  let clanSetupHelper: ClanSetupHelper;
  let testClanName: string;
  let testClanUrl: string;

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(ClanSetupHelper.configs.messageTests);

    testClanName = setupResult.clanName;
    testClanUrl = setupResult.clanUrl;
  });

  test.afterAll(async ({ browser }) => {
    if (clanSetupHelper) {
      await clanSetupHelper.cleanupAllClans();
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

    async clickUserInChatList(username: string): Promise<void> {
      const userSelectors = [
        `text=${username}`,
        `[data-testid*="${username}"]`,
        `div:has-text("${username}")`,
        `.user-item:has-text("${username}")`,
        `.direct-message:has-text("${username}")`,
      ];

      for (const selector of userSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 5000 })) {
          await element.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          return;
        }
      }

      await page.goto(DIRECT_CHAT_URL);
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
    await AuthHelper.setAuthForSuite(
      page,
      ClanSetupHelper.configs.messageTests.suiteName || 'Channel Message Tests'
    );

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

  test('React to a message with multiple emojis', async ({ page, context }) => {
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

  test('Reply to a message and send', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    const original = `Reply base ${Date.now()}`;
    const target = await messageHelpers.sendTextMessageAndGetItem(original);
    const replyText = `Reply content ${Date.now()}`;
    await messageHelpers.replyToMessage(target, replyText);
    await page.waitForTimeout(1000);
    const ok = await messageHelpers.verifyLastMessageIsReplyTo(original, replyText);
    const visible = await messageHelpers.isMessageVisible(replyText);
    expect(ok || visible).toBeTruthy();
  });

  test('Search emoji in picker and apply reaction', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63401',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    const msg = `Emoji search test ${Date.now()}`;
    await messageHelpers.sendTextMessage(msg);
    await page.waitForTimeout(800);

    const target = await messageHelpers.findLastMessage();
    const picked = await messageHelpers.searchAndPickEmojiFromPicker(target, ':smile:');
    await page.waitForTimeout(1200);

    const hasReaction = await messageHelpers.verifyReactionOnMessage(
      target,
      picked ? [picked] : ['😀', '😊', '🙂']
    );
    expect(hasReaction).toBeTruthy();
  });

  test('Create topic discussion and send emoji message', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63391',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    const originalMsg = `Topic starter ${Date.now()}`;
    const target = await messageHelpers.sendTextMessageAndGetItem(originalMsg);
    await page.waitForTimeout(800);

    await messageHelpers.openTopicDiscussion(target);
    await page.waitForTimeout(2000);

    const emojiMsg = '😀🎉👍';
    await messageHelpers.sendMessageInThread(emojiMsg);
    await page.waitForTimeout(3000);

    const topicMessages = await messageHelpers.getMessagesFromTopicDrawer();
    expect(emojiMsg).toEqual(topicMessages[topicMessages.length - 1].content);
  });
  test.skip('Send message from short profile in clan channel', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63403',
    });

    messageHelpers = new MessageTestHelpers(page);

    await messageHelpers.clickMembersButton();
    await messageHelpers.clickMemberInList('nguyen.nguyen');

    const testMessage = `Test message from Case 12 short profile 11${Date.now()}`;
    await messageHelpers.sendMessageFromShortProfile(testMessage);

    await page.waitForTimeout(2000);
  });
});
