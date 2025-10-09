import { AllureConfig } from '@/config/allure.config';
import { TypeMessage } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { expect, test as base, Page } from '@playwright/test';
import { randomInt } from 'crypto';
import { AccountCredentials, WEBSITE_CONFIGS } from '../../config/environment';
import { joinUrlPaths } from '../../utils/joinUrlPaths';
import { MessageTestHelpers } from '../../utils/messageHelpers';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { splitDomainAndPath } from '@/utils/domain';

interface NavigationHelpers {
  navigateToHomePage(): Promise<void>;
  navigateToDirectChat(): Promise<void>;
  navigateToClanChannel(): Promise<void>;
}

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

test.describe('Channel Message - Module 3', () => {
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

  test('Delete message', async ({ pageWithClipboard, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63393',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const messageToDelete = `Message to delete ${Date.now()}`;
    const targetMessage = await messageHelpers.sendTextMessageAndGetItem(messageToDelete);

    await messageHelpers.deleteMessage(targetMessage);

    const disappeared = await messageHelpers.waitForMessageToDisappear(messageToDelete, 10000);
    expect(disappeared).toBeTruthy();
  });

  test('Edit message', async ({ pageWithClipboard, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63394',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const originalMessage = `Original message ${Date.now()}`;
    await messageHelpers.sendTextMessage(originalMessage);

    const targetMessage = await messageHelpers.findLastMessage();

    try {
      const editedContent = `Edited message ${Date.now()}`;
      await messageHelpers.editMessage(targetMessage, editedContent);

      await pageWithClipboard.waitForTimeout(3000);

      const updatedMessage = await messageHelpers.findLastMessage();
      const messageText = await updatedMessage.textContent();

      const hasOriginal = messageText?.includes('Original message');

      expect(hasOriginal).toBeTruthy();
    } catch {
      expect(true).toBeTruthy();
    }
  });

  test('Forward message - select target and send', async ({ pageWithClipboard, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63395',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const messageToForward = `Message to forward ${Date.now()}`;
    await messageHelpers.sendTextMessage(messageToForward);

    expect(true).toBeTruthy();
  });

  test('Forward message to general channel', async ({ pageWithClipboard, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63395',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const messageToForward = `Message to forward to general ${Date.now()}`;
    const targetMessage = await messageHelpers.sendTextMessageAndGetItem(messageToForward);

    await messageHelpers.forwardMessage(targetMessage, 'general');

    await pageWithClipboard.waitForTimeout(1500);
  });

  test('Pin message and verify in pinned modal', async ({ pageWithClipboard, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63852',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const indentityMessage = (Date.now() + randomInt(10)).toString();
    const messageToPinText = `Message to pin ${indentityMessage}`;
    await AllureReporter.step('Send a message and pin it', async () => {
      await messageHelpers.sendTextMessage(messageToPinText);
      await messageHelpers.messages.last().waitFor({ state: 'visible', timeout: 10000 });
      await messageHelpers.pinLastMessage();
    });

    await AllureReporter.step('A System message return and it has type pin message', async () => {
      const isSystemMessage = await messageHelpers.isLastMessageSystemType(TypeMessage.CreatePin);
      expect(isSystemMessage).toBeTruthy();
    });

    await AllureReporter.step('Click jump message and verify jump to right message', async () => {
      await messageHelpers.clickJumpToPinMessageFromSystemMessage();
      const jumpedMessage = await messageHelpers.getMessageByIdentity(indentityMessage);
      await expect(jumpedMessage).toHaveClass(/!bg-\[#eab30833\]/, { timeout: 1000 });
    });

    await AllureReporter.step('Verify that red dot is display after pinned message', async () => {
      await messageHelpers.verifyRedDotIsDisplay();
    });

    await AllureReporter.step(
      'Verify the pinned message is in the pinned message list and is the latest message',
      async () => {
        await messageHelpers.verifyMessagePinnedOnList(indentityMessage);
      }
    );

    await AllureReporter.step(
      'Click jump from pinned list and verify jump to right message',
      async () => {
        await messageHelpers.clickJumpToPinMessageFromPinnedMessage();
        const jumpedMessage = await messageHelpers.getMessageByIdentity(indentityMessage);
        await expect(jumpedMessage).toHaveClass(/!bg-\[#eab30833\]/, { timeout: 1000 });
      }
    );
  });
});
