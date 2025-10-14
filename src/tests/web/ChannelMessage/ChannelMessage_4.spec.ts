import { ClanFactory } from '@/data/factories/ClanFactory';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
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

test.describe('Channel Message - Module 4', () => {
  let messageHelpers: MessageTestHelpers;
  let clanPath: string;

  const clanFactory = new ClanFactory();

  test.beforeEach(async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63366',
    });
    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      pageWithClipboard,
      AccountCredentials.account2
    );

    if (!clanPath) {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelManagement, pageWithClipboard);
      clanPath = splitDomainAndPath(clanFactory.getClanUrl()).path;

      clanFactory.setClanUrl(joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, clanPath));
    }
    await AuthHelper.prepareBeforeTest(pageWithClipboard, clanFactory.getClanUrl(), credentials);

    await AllureReporter.addParameter('clanName', clanFactory.getClanName());
  });

  test('Jump to pinned message and verify in main chat', async ({ pageWithClipboard, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63397',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

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

    await pageWithClipboard.waitForTimeout(2000);
  });

  test('Test hashtag channel functionality', async ({ pageWithClipboard, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63398',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const messageInput = await messageHelpers.findMessageInput();
    await messageInput.click();
    await pageWithClipboard.waitForTimeout(500);

    await messageInput.type('#');
    await pageWithClipboard.waitForTimeout(2000);

    const channelListVisible = await messageHelpers.verifyHashtagChannelList();
    expect(channelListVisible).toBeTruthy();

    const hasExpectedChannels = await messageHelpers.verifyExpectedChannelsInList();
    expect(hasExpectedChannels).toBeTruthy();

    await pageWithClipboard.keyboard.press('Escape');
    await pageWithClipboard.waitForTimeout(1000);
  });

  test('Mention user list appears with @', async ({ pageWithClipboard, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63399',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const messageInput = await messageHelpers.findMessageInput();
    await messageInput.click();
    await pageWithClipboard.waitForTimeout(300);

    await messageInput.type('@');
    await pageWithClipboard.waitForTimeout(1500);

    const mentionVisible = await messageHelpers.verifyMentionListVisible();
    expect(mentionVisible).toBeTruthy();

    await pageWithClipboard.keyboard.press('Escape');
    await pageWithClipboard.waitForTimeout(500);
  });

  test('Mention specific user and send message', async ({ pageWithClipboard, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63399',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const candidateNames = ['nguyen.nguyen'];
    await messageHelpers.mentionUserAndSend('@ng', candidateNames);
  });

  test('React to a message with 3 different emojis', async ({ pageWithClipboard, context }) => {
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
});
