import { expect, test } from '@playwright/test';
import { setupChannelMessageSuite } from './common/ChannelMessage-Base';

test.describe('Channel Message - Replies', () => {
  const { getTestSuiteSetup } = setupChannelMessageSuite('Replies Tests');

  test('Reply to a message and send', async ({ page, context }) => {
    const { messageHelpers } = getTestSuiteSetup();

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

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
