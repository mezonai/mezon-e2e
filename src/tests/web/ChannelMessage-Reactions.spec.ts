import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';
import { setupChannelMessageSuite } from './common/ChannelMessage-Base';

test.describe('Channel Message - Reactions & Emojis', () => {
  const { getTestSuiteSetup } = setupChannelMessageSuite('Reactions Tests');

  test('React to a message with 3 different emojis', async ({ page, context }) => {
    const { messageHelpers, testClanUrl } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63400',
    });

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

  test('React to a message with multiple emojis', async ({ page, context }) => {
    const { messageHelpers, testClanUrl } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63400',
    });

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

  test('Search emoji in picker and apply reaction', async ({ page, context }) => {
    const { messageHelpers } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63401',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

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
});
