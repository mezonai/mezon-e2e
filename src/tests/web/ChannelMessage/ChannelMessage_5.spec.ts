import { ClanFactory } from '@/data/factories/ClanFactory';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { test as base, expect, Page } from '@playwright/test';
import { AccountCredentials, WEBSITE_CONFIGS } from '../../../config/environment';
import { LINK_TEST_URLS, MessageTestHelpers } from '../../../utils/messageHelpers';

const test = base.extend<{
  pageWithClipboard: Page;
}>({
  pageWithClipboard: async ({ browser }, use) => {
    const context = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write'],
      baseURL: WEBSITE_CONFIGS.MEZON.baseURL,
    });
    const pageWithClipboard = await context.newPage();
    await use(pageWithClipboard);
    await context.close();
  },
});

test.describe('Channel Message - Module 5', () => {
  let messageHelpers: MessageTestHelpers;
  const credentials = AccountCredentials.account5;
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage5,
      credentials,
    });
  });

  test.beforeEach(async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63366',
    });
    await TestSuiteHelper.setupBeforeEach({
      page: pageWithClipboard,
      clanFactory,
      credentials,
    });
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({
      browser,
      clanFactory,
      credentials,
    });
  });

  test.afterEach(async ({ pageWithClipboard }) => {
    await AuthHelper.logout(pageWithClipboard);
  });

  test('Send Message With Markdown', async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63404',
    });

    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const markdownMessage = `\`\`\`Test markdown message with code block ${Date.now()}\`\`\``;
    await messageHelpers.sendTextMessage(markdownMessage);

    const isMarkdownRendered = await messageHelpers.verifyMarkdownMessage(markdownMessage);
    expect(isMarkdownRendered).toBeTruthy();

    await pageWithClipboard.waitForTimeout(2000);
  });

  test('Send Message with Emoji', async ({ pageWithClipboard, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63405',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const baseMessage = `Test message with emoji ${Date.now()}`;
    const emojiQuery = ':smile';

    await messageHelpers.sendMessageWithEmojiPicker(baseMessage, emojiQuery);

    const hasEmoji = await messageHelpers.verifyLastMessageHasEmoji();
    expect(hasEmoji).toBeTruthy();

    await pageWithClipboard.waitForTimeout(2000);
  });

  test('Send text too large for convert to file txt', async ({ pageWithClipboard, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63406',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const longMessage = await messageHelpers.generateLongMessage(3000);
    const fileConverted = await messageHelpers.sendLongMessageAndCheckFileConversion(longMessage);

    expect(fileConverted).toBeTruthy();

    await pageWithClipboard.waitForTimeout(2000);
  });

  test('Send message with hashtag', async ({ pageWithClipboard }) => {
    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const baseMessage = `Hashtag test ${Date.now()}`;
    await messageHelpers.sendMessageWithHashtag(baseMessage, '', 'general');

    const hasHashtag = await messageHelpers.verifyLastMessageHasHashtag('general');
    expect(hasHashtag).toBeTruthy();

    await pageWithClipboard.waitForTimeout(1500);
  });

  test('Send message with multiple links', async ({ pageWithClipboard, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    await messageHelpers.sendMessageWithMultipleLinks(LINK_TEST_URLS);

    await pageWithClipboard.waitForTimeout(2000);
  });

  test('Send message with buzz (Ctrl+G)', async ({ pageWithClipboard, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63407',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const buzzMessage = `Buzz message test ${Date.now()}`;

    await messageHelpers.sendBuzzMessage(buzzMessage);

    await pageWithClipboard.waitForTimeout(2000);
  });
});
