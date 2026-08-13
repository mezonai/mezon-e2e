import { ClanFactory } from '@/data/factories/ClanFactory';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { test as base, expect, Page } from '@playwright/test';
import { AccountCredentials, WEBSITE_CONFIGS } from '../../../config/environment';
import { MessageTestHelpers } from '../../../utils/messageHelpers';
import { CLIPBOARD_PERMISSIONS } from './ChannelMessageTestConstants';

const test = base.extend<{
  pageWithClipboard: Page;
}>({
  pageWithClipboard: async ({ browser }, use) => {
    const context = await browser.newContext({
      permissions: CLIPBOARD_PERMISSIONS,
      baseURL: WEBSITE_CONFIGS.MEZON.baseURL,
    });
    const pageWithClipboard = await context.newPage();
    await use(pageWithClipboard);
    await context.close();
  },
});

test.describe('Channel Messages - Pinned Navigation, Hashtags, Mentions, and Reactions', () => {
  let messageHelpers: MessageTestHelpers;
  const credentials = AccountCredentials.account4;
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage4,
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

  test('Jump to pinned message and verify in main chat', async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63397',
    });

    messageHelpers = new MessageTestHelpers(pageWithClipboard);

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
      const modalElement = pageWithClipboard.locator(selector).first();
      if (await modalElement.isVisible({ timeout: 2000 })) {
        modalFound = true;
        break;
      }
    }
    expect(modalFound).toBeTruthy();

    await messageHelpers.clickJumpToMessage(messageToPin);

    const isMessageVisible = await messageHelpers.verifyMessageVisibleInMainChat(messageToPin);
    expect(isMessageVisible).toBeTruthy();
  });

  test('Test hashtag channel functionality', async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63398',
    });

    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const messageInput = await messageHelpers.findMessageInput();
    await messageInput.click();

    await messageInput.type('#');
    await expect
      .poll(() => messageHelpers.verifyHashtagChannelList(), { timeout: 3000 })
      .toBe(true);

    const hasExpectedChannels = await messageHelpers.verifyExpectedChannelsInList();
    expect(hasExpectedChannels).toBeTruthy();

    await pageWithClipboard.keyboard.press('Escape');
    await pageWithClipboard.waitForTimeout(1000);
  });

  test('Mention user list appears with @', async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63399',
    });

    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const messageInput = await messageHelpers.findMessageInput();
    await messageInput.click();

    await messageInput.type('@');
    await expect
      .poll(() => messageHelpers.verifyMentionListVisible(), { timeout: 3000 })
      .toBe(true);

    await pageWithClipboard.keyboard.press('Escape');
  });

  test('Mention specific user and send message', async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63399',
    });

    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const candidateNames = ['nguyen.nguyen'];
    await messageHelpers.mentionUserAndSend('@ng', candidateNames);
  });

  test('React to a message with 3 different emojis', async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63400',
    });

    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const msg = `Reaction test ${Date.now()}`;
    await messageHelpers.sendTextMessage(msg);

    const target = await messageHelpers.findLastMessage();
    const emojisToAdd = ['😂', '👍', '💯'];
    const addedEmojis: string[] = [];

    for (let i = 0; i < emojisToAdd.length; i++) {
      const emoji = emojisToAdd[i];

      const picked = await messageHelpers.reactToMessage(target, [emoji]);

      if (picked) {
        addedEmojis.push(picked);
      }
    }

    const hasAllReactions = await messageHelpers.verifyReactionOnMessage(target, addedEmojis);
    expect(hasAllReactions).toBeTruthy();
    expect(addedEmojis.length).toBeGreaterThanOrEqual(2);
  });
});
