import { ClanFactory } from '@/data/factories/ClanFactory';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { test as base, expect, Page } from '@playwright/test';
import { AccountCredentials, WEBSITE_CONFIGS } from '../../../config/environment';
import { joinUrlPaths } from '../../../utils/joinUrlPaths';
import { MessageTestHelpers } from '../../../utils/messageHelpers';

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

test.describe('Channel Message - Module 2', () => {
  let messageHelpers: MessageTestHelpers;
  const credentials = AccountCredentials.account2;
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage2,
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

  test('React to a message with multiple emojis', async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63400',
    });

    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const msg = `Reaction test ${Date.now()}`;
    await messageHelpers.sendTextMessage(msg);
    await pageWithClipboard.waitForTimeout(1000);

    const target = await messageHelpers.findLastMessage();
    const emojisToAdd = ['😂', '👍', '💯'];
    const addedEmojis: string[] = [];

    for (let i = 0; i < emojisToAdd.length; i++) {
      const emoji = emojisToAdd[i];

      const picked = await messageHelpers.reactToMessage(target, [emoji]);
      await pageWithClipboard.waitForTimeout(2000);

      if (picked) {
        addedEmojis.push(picked);
      }

      await pageWithClipboard.waitForTimeout(500);
    }

    await pageWithClipboard.waitForTimeout(2000);

    const hasAllReactions = await messageHelpers.verifyReactionOnMessage(target, addedEmojis);
    expect(hasAllReactions).toBeTruthy();
    expect(addedEmojis.length).toBeGreaterThanOrEqual(2);
  });

  test('Reply to a message and send', async ({ pageWithClipboard, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const original = `Reply base ${Date.now()}`;
    const target = await messageHelpers.sendTextMessageAndGetItem(original);
    const replyText = `Reply content ${Date.now()}`;
    await messageHelpers.replyToMessage(target, replyText);
    await pageWithClipboard.waitForTimeout(1000);
    const ok = await messageHelpers.verifyLastMessageIsReplyTo(original, replyText);
    const visible = await messageHelpers.isMessageVisible(replyText);
    expect(ok || visible).toBeTruthy();
  });

  test('Search emoji in picker and apply reaction', async ({ pageWithClipboard, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63401',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const msg = `Emoji search test ${Date.now()}`;
    await messageHelpers.sendTextMessage(msg);
    await pageWithClipboard.waitForTimeout(800);

    const target = await messageHelpers.findLastMessage();
    const picked = await messageHelpers.searchAndPickEmojiFromPicker(target, ':smile:');
    await pageWithClipboard.waitForTimeout(1200);

    const hasReaction = await messageHelpers.verifyReactionOnMessage(
      target,
      picked ? [picked] : ['😀', '😊', '🙂']
    );
    expect(hasReaction).toBeTruthy();
  });

  test('Create topic discussion and send emoji message', async ({ pageWithClipboard, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63391',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const originalMsg = `Topic starter ${Date.now()}`;
    const target = await messageHelpers.sendTextMessageAndGetItem(originalMsg);
    await pageWithClipboard.waitForTimeout(800);

    await messageHelpers.openTopicDiscussion(target);
    await pageWithClipboard.waitForTimeout(2000);

    const emojiMsg = '😀🎉👍';
    await messageHelpers.sendMessageInThread(emojiMsg);
    await pageWithClipboard.waitForTimeout(3000);

    const topicMessages = await messageHelpers.getMessagesFromTopicDrawer();
    expect(emojiMsg).toEqual(topicMessages[topicMessages.length - 1].content);
  });
  test('Send message from short profile in clan channel', async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63403',
    });
    const clanWithFriendAddedUrl = joinUrlPaths(
      WEBSITE_CONFIGS.MEZON.baseURL,
      'chat/clans/1786228934740807680/channels/1786228934753390593'
    );
    const addedFriendUsername = 'nguyen.nguyen';
    await pageWithClipboard.goto(clanWithFriendAddedUrl, { waitUntil: 'domcontentloaded' });
    await pageWithClipboard.waitForLoadState('networkidle');
    messageHelpers = new MessageTestHelpers(pageWithClipboard);
    await messageHelpers.clickMembersButton();
    await messageHelpers.clickMemberInList(addedFriendUsername);
    const testMessage = `Send Message From Short Profile ${Date.now()}`;
    await messageHelpers.sendMessageFromShortProfile(testMessage);
    await pageWithClipboard.waitForTimeout(2000);
    const messageHelper = new MessageTestHelpers(pageWithClipboard);
    const lastMessage = await messageHelper.getLastMessageInChat();
    expect(lastMessage).toContain(testMessage);
  });
});
