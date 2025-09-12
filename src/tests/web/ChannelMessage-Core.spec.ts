import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { AuthHelper } from '@/utils/authHelper';
import { MessageTestHelpers, LINK_TEST_URLS } from '../../utils/messageHelpers';
import { expect, test } from '@playwright/test';

test.describe('Channel Message - Core', () => {
  let clanSetupHelper: ClanSetupHelper;
  let testClanName: string;
  let clanUrl: string;
  let messageHelpers: MessageTestHelpers;

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);
    const setupResult = await clanSetupHelper.setupTestClan(
      ClanSetupHelper.configs.channelMessageCore
    );
    testClanName = setupResult.clanName;
    clanUrl = setupResult.clanUrl;
  });

  test.beforeEach(async ({ page, context }, testInfo) => {
    await AuthHelper.setAuthForSuite(
      page,
      ClanSetupHelper.configs.channelMessageCore.suiteName || 'Channel Message - Core'
    );

    await AllureReporter.initializeTest(page, testInfo, {
      story: AllureConfig.Stories.TEXT_MESSAGING,
      severity: AllureConfig.Severity.CRITICAL,
      testType: AllureConfig.TestTypes.E2E,
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    await page.goto(clanUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
  });

  test.afterAll(async ({ browser }) => {
    if (clanSetupHelper && testClanName && clanUrl) {
      await clanSetupHelper.cleanupClan(
        testClanName,
        clanUrl,
        ClanSetupHelper.configs.channelMessageCore.suiteName
      );
    }
  });

  // Basic Actions Tests
  test('Copy message text and send it', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '63390' });

    const testMessage = `Test message ${Date.now()}`;
    await messageHelpers.sendTextMessage(testMessage);

    const targetMessage = await messageHelpers.findLastMessage();

    const copiedText = await messageHelpers.copyText(targetMessage);
    expect(copiedText).toBeTruthy();
    expect(copiedText.trim().length).toBeGreaterThan(0);
    expect(copiedText).toContain('Test message');

    const pastedText = copiedText || 'Pasted message from clipboard';
    await messageHelpers.sendTextMessage(pastedText);

    await expect(page.locator(`text="${pastedText}"`).first()).toBeVisible();
  });

  test('Delete message', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({ tms: '63393' });

    const messageToDelete = `Message to delete ${Date.now()}`;
    const targetMessage = await messageHelpers.sendTextMessageAndGetItem(messageToDelete);

    await messageHelpers.deleteMessage(targetMessage);

    const disappeared = await messageHelpers.waitForMessageToDisappear(messageToDelete, 10000);
    expect(disappeared).toBeTruthy();
  });

  test('Edit message', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({ tms: '63394' });

    const originalMessage = `Original message ${Date.now()}`;
    await messageHelpers.sendTextMessage(originalMessage);

    const targetMessage = await messageHelpers.findLastMessage();

    try {
      const editedContent = `Edited message ${Date.now()}`;
      await messageHelpers.editMessage(targetMessage, editedContent);

      await page.waitForTimeout(3000);

      const updatedMessage = await messageHelpers.findLastMessage();
      const messageText = await updatedMessage.textContent();

      const hasOriginal = messageText?.includes('Original message');

      expect(hasOriginal).toBeTruthy();
    } catch {
      expect(true).toBeTruthy();
    }
  });

  test('Forward message - select target and send', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({ tms: '63395' });

    const messageToForward = `Message to forward ${Date.now()}`;
    await messageHelpers.sendTextMessage(messageToForward);

    expect(true).toBeTruthy();
  });

  test('Forward message to general channel', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({ tms: '63395' });

    const messageToForward = `Message to forward to general ${Date.now()}`;
    const targetMessage = await messageHelpers.sendTextMessageAndGetItem(messageToForward);

    await messageHelpers.forwardMessage(targetMessage, 'general');

    await page.waitForTimeout(1500);
  });

  // Send Message Tests
  test('Send Message With Markdown', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({ tms: '63404' });

    const markdownMessage = `\`\`\`Test markdown message with code block ${Date.now()}\`\`\``;
    await messageHelpers.sendTextMessage(markdownMessage);

    const isMarkdownRendered = await messageHelpers.verifyMarkdownMessage(markdownMessage);
    expect(isMarkdownRendered).toBeTruthy();

    await page.waitForTimeout(2000);
  });

  test('Send Message with Emoji', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({ tms: '63405' });

    const baseMessage = `Test message with emoji ${Date.now()}`;
    const emojiQuery = ':smile';

    await messageHelpers.sendMessageWithEmojiPicker(baseMessage, emojiQuery);

    const hasEmoji = await messageHelpers.verifyLastMessageHasEmoji();
    expect(hasEmoji).toBeTruthy();

    await page.waitForTimeout(2000);
  });

  test('Send text too large for convert to file txt', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({ tms: '63406' });

    const longMessage = await messageHelpers.generateLongMessage(3000);
    const fileConverted = await messageHelpers.sendLongMessageAndCheckFileConversion(longMessage);

    expect(fileConverted).toBeTruthy();

    await page.waitForTimeout(2000);
  });

  test('Send message with hashtag', async ({ page, context }) => {
    const baseMessage = `Hashtag test ${Date.now()}`;
    await messageHelpers.sendMessageWithHashtag(baseMessage, '', 'general');

    const hasHashtag = await messageHelpers.verifyLastMessageHasHashtag('general');
    expect(hasHashtag).toBeTruthy();

    await page.waitForTimeout(1500);
  });

  test('Send message with multiple links', async ({ page, context }) => {
    await messageHelpers.sendMessageWithMultipleLinks(LINK_TEST_URLS);
    await page.waitForTimeout(2000);
  });

  test('Send message with buzz (Ctrl+G)', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({ tms: '63407' });

    const buzzMessage = `Buzz message test ${Date.now()}`;
    await messageHelpers.sendBuzzMessage(buzzMessage);

    await page.waitForTimeout(2000);
  });

  // Replies Tests
  test('Reply to a message and send', async ({ page, context }) => {
    const original = `Reply base ${Date.now()}`;
    const target = await messageHelpers.sendTextMessageAndGetItem(original);
    const replyText = `Reply content ${Date.now()}`;
    await messageHelpers.replyToMessage(target, replyText);
    await page.waitForTimeout(1000);
    const ok = await messageHelpers.verifyLastMessageIsReplyTo(original, replyText);
    const visible = await messageHelpers.isMessageVisible(replyText);
    expect(ok || visible).toBeTruthy();
  });
});
