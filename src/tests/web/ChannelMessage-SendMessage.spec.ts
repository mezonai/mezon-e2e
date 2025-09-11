import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';
import { LINK_TEST_URLS } from '../../utils/messageHelpers';
import { setupChannelMessageSuite } from './common/ChannelMessage-Base';

test.describe('Channel Message - Send Message Features', () => {
  const { getTestSuiteSetup } = setupChannelMessageSuite('Send Message Tests');

  test('Send Message With Markdown', async ({ page, context }) => {
    const { messageHelpers } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63404',
    });

    const markdownMessage = `\`\`\`Test markdown message with code block ${Date.now()}\`\`\``;
    await messageHelpers.sendTextMessage(markdownMessage);

    const isMarkdownRendered = await messageHelpers.verifyMarkdownMessage(markdownMessage);
    expect(isMarkdownRendered).toBeTruthy();

    await page.waitForTimeout(2000);
  });

  test('Send Message with Emoji', async ({ page, context }) => {
    const { messageHelpers, testClanUrl } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63405',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

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
    const { messageHelpers, testClanUrl } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63406',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const longMessage = await messageHelpers.generateLongMessage(3000);
    const fileConverted = await messageHelpers.sendLongMessageAndCheckFileConversion(longMessage);

    expect(fileConverted).toBeTruthy();

    await page.waitForTimeout(2000);
  });

  test('Send message with hashtag', async ({ page, context }) => {
    const { messageHelpers, testClanUrl } = getTestSuiteSetup();

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
    const { messageHelpers, testClanUrl } = getTestSuiteSetup();

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await messageHelpers.sendMessageWithMultipleLinks(LINK_TEST_URLS);

    await page.waitForTimeout(2000);
  });

  test('Send message with buzz (Ctrl+G)', async ({ page, context }) => {
    const { messageHelpers, testClanUrl } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63407',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const buzzMessage = `Buzz message test ${Date.now()}`;

    await messageHelpers.sendBuzzMessage(buzzMessage);

    await page.waitForTimeout(2000);
  });
});
