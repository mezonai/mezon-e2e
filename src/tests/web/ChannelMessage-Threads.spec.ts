import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';
import { setupChannelMessageSuite } from './common/ChannelMessage-Base';

test.describe('Channel Message - Threads & Topics', () => {
  const { getTestSuiteSetup } = setupChannelMessageSuite('Threads Tests');

  test('Create topic discussion thread from message', async ({ page }) => {
    const { messageHelpers } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63391',
    });

    const initialMessageCount = await messageHelpers.countMessages();

    const originalMessage = `Original message ${Date.now()}`;
    await messageHelpers.sendTextMessage(originalMessage);

    const targetMessage = await messageHelpers.findLastMessage();

    await messageHelpers.openTopicDiscussion(targetMessage);

    const threadMessage = `Thread reply ${Date.now()}`;
    await messageHelpers.sendMessageInThread(threadMessage);

    const finalMessageCount = await messageHelpers.countMessages();
    expect(finalMessageCount).toBeGreaterThanOrEqual(initialMessageCount + 1);
  });

  test('Create thread from message and send reply', async ({ page, context }) => {
    const { messageHelpers, testClanUrl } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63392',
    });

    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const initialMessageCount = await messageHelpers.countMessages();

    const originalMessage = `Thread starter message ${Date.now()}`;
    await messageHelpers.sendTextMessage(originalMessage);

    const targetMessage = await messageHelpers.findLastMessage();

    const threadName = `My Test Thread ${Date.now()}`;
    await messageHelpers.createThread(targetMessage, threadName);

    const threadReply = `Thread reply ${Date.now()}`;
    await messageHelpers.sendMessageInThread(threadReply, true);

    const finalMessageCount = await messageHelpers.countMessages();
    expect(finalMessageCount).toBeGreaterThanOrEqual(initialMessageCount + 1);
  });

  test('Create topic discussion and send emoji message', async ({ page, context }) => {
    const { messageHelpers } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63391',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

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
});
