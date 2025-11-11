import { ClanFactory } from '@/data/factories/ClanFactory';
import { MessagePage } from '@/pages/MessagePage';
import { TypeMessage } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { test as base, expect, Page } from '@playwright/test';
import { randomInt } from 'crypto';
import { AccountCredentials, WEBSITE_CONFIGS } from '../../../config/environment';
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

test.describe('Channel Message - Module 3', () => {
  let messageHelpers: MessageTestHelpers;
  const credentials = AccountCredentials.account3;
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage3,
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

  test('Delete message', async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63393',
    });

    const messagePage = new MessagePage(pageWithClipboard);

    const messageToDelete = `Message to delete ${Date.now()}`;
    await messagePage.sendMessageWhenInDM(messageToDelete);
    const targetMessage = await messagePage.getLastMessageWithProfileName(messageToDelete);

    await messagePage.deleteLastMessage();
    await pageWithClipboard.waitForTimeout(1000);
    expect(targetMessage).toHaveCount(0);
    expect(targetMessage).not.toBeAttached();
  });

  test('Edit message', async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63394',
    });

    const messagePage = new MessagePage(pageWithClipboard);

    const originalMessage = `Original message ${Date.now()}`;
    await messagePage.sendMessageWhenInDM(originalMessage);

    const oldMessage = await messagePage.getLastMessageWithProfileName(originalMessage);

    const editedContent = `Edited message ${Date.now()}`;
    const newMessage = await messagePage.editMessage(oldMessage, editedContent);

    expect(newMessage).toHaveCount(1);
    expect(newMessage).toBeVisible();
    expect(newMessage).toHaveText(editedContent);
  });

  test('Forward message - select target and send', async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63395',
    });

    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const messageToForward = `Message to forward ${Date.now()}`;
    await messageHelpers.sendTextMessage(messageToForward);

    expect(true).toBeTruthy();
  });

  test('Forward message to general channel', async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63395',
    });

    messageHelpers = new MessageTestHelpers(pageWithClipboard);

    const messageToForward = `Message to forward to general ${Date.now()}`;
    const targetMessage = await messageHelpers.sendTextMessageAndGetItem(messageToForward);

    await messageHelpers.forwardMessage(targetMessage, 'general');

    await pageWithClipboard.waitForTimeout(1500);
  });

  test('Pin message and verify in pinned modal', async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63852',
    });

    messageHelpers = new MessageTestHelpers(pageWithClipboard);
    const messagePage = new MessagePage(pageWithClipboard);

    const indentityMessage = (Date.now() + randomInt(10)).toString();
    const messageToPinText = `Message to pin ${indentityMessage}`;
    await AllureReporter.step('Send a message and pin it', async () => {
      await messageHelpers.sendTextMessage(messageToPinText);
      await messagePage.messages.last().waitFor({ state: 'visible', timeout: 10000 });
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
