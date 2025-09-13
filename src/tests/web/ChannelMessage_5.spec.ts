import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { expect, test } from '@playwright/test';
import { WEBSITE_CONFIGS } from '../../config/environment';
import { joinUrlPaths } from '../../utils/joinUrlPaths';
import { LINK_TEST_URLS, MessageTestHelpers } from '../../utils/messageHelpers';

const MEZON_BASE_URL = WEBSITE_CONFIGS.MEZON.baseURL || '';
const DIRECT_CHAT_URL = joinUrlPaths(MEZON_BASE_URL, 'chat/direct/message/1955879210568388608/3');

interface NavigationHelpers {
  navigateToHomePage(): Promise<void>;
  navigateToDirectChat(): Promise<void>;
  navigateToClanChannel(): Promise<void>;
}

test.describe('Channel Message - Module 5', () => {
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

  test('Send Message With Markdown', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63404',
    });

    messageHelpers = new MessageTestHelpers(page);

    const markdownMessage = `\`\`\`Test markdown message with code block ${Date.now()}\`\`\``;
    await messageHelpers.sendTextMessage(markdownMessage);

    const isMarkdownRendered = await messageHelpers.verifyMarkdownMessage(markdownMessage);
    expect(isMarkdownRendered).toBeTruthy();

    await page.waitForTimeout(2000);
  });

  test('Send Message with Emoji', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63405',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const baseMessage = `Test message with emoji ${Date.now()}`;
    const emojiQuery = ':smile';

    await messageHelpers.sendMessageWithEmojiPicker(baseMessage, emojiQuery);

    const hasEmoji = await messageHelpers.verifyLastMessageHasEmoji();
    expect(hasEmoji).toBeTruthy();

    await page.waitForTimeout(2000);
  });

  test('Send text too large for convert to file txt', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63406',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const longMessage = await messageHelpers.generateLongMessage(3000);
    const fileConverted = await messageHelpers.sendLongMessageAndCheckFileConversion(longMessage);

    expect(fileConverted).toBeTruthy();

    await page.waitForTimeout(2000);
  });

  test('Send message with hashtag', async ({ page, context }) => {
    messageHelpers = new MessageTestHelpers(page);

    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const baseMessage = `Hashtag test ${Date.now()}`;
    await messageHelpers.sendMessageWithHashtag(baseMessage, '', 'general');

    const hasHashtag = await messageHelpers.verifyLastMessageHasHashtag('general');
    expect(hasHashtag).toBeTruthy();

    await page.waitForTimeout(1500);
  });

  test('Send message with multiple links', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await messageHelpers.sendMessageWithMultipleLinks(LINK_TEST_URLS);

    await page.waitForTimeout(2000);
  });

  test('Send message with buzz (Ctrl+G)', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63407',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const buzzMessage = `Buzz message test ${Date.now()}`;

    await messageHelpers.sendBuzzMessage(buzzMessage);

    await page.waitForTimeout(2000);
  });
});
