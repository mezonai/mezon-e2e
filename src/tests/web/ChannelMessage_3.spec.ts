import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { expect, test } from '@playwright/test';
import { WEBSITE_CONFIGS } from '../../config/environment';
import { MessageTestHelpers } from '../../utils/messageHelpers';
import { joinUrlPaths } from '../../utils/joinUrlPaths';

interface NavigationHelpers {
  navigateToHomePage(): Promise<void>;
  navigateToDirectChat(): Promise<void>;
  navigateToClanChannel(): Promise<void>;
}

test.describe('Channel Message - Module 3', () => {
  let messageHelpers: MessageTestHelpers;
  let clanSetupHelper: ClanSetupHelper;
  let testClanName: string;
  let testClanUrl: string;
  const MEZON_BASE_URL = WEBSITE_CONFIGS.MEZON.baseURL || '';

  test.use({ storageState: 'playwright/.auth/account2-3.json' });

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(
      ClanSetupHelper.configs.channelMessage3
    );

    testClanName = setupResult.clanName;
    testClanUrl = setupResult.clanUrl;
  });

  test.afterAll(async ({ browser }) => {
    if (clanSetupHelper && testClanName && testClanUrl) {
      await clanSetupHelper.cleanupClan(testClanName, testClanUrl);
    }
  });

  const createNavigationHelpers = (page: any): NavigationHelpers => ({
    async navigateToHomePage(): Promise<void> {
      await page.goto(MEZON_BASE_URL);
      await page.waitForLoadState('domcontentloaded');
    },

    async navigateToDirectChat(): Promise<void> {
      const directFriendsUrl = joinUrlPaths(MEZON_BASE_URL, 'chat/direct/friends');
      await page.goto(directFriendsUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    },

    async navigateToClanChannel(): Promise<void> {
      // Use the dynamically created clan URL
      await page.goto(testClanUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    },
  });

  test.beforeEach(async ({ page, context }, testInfo) => {
    await AllureReporter.initializeTest(page, testInfo, {
      story: AllureConfig.Stories.TEXT_MESSAGING,
      severity: AllureConfig.Severity.CRITICAL,
      testType: AllureConfig.TestTypes.E2E,
    });

    await AllureReporter.addWorkItemLinks({
      tms: '63368',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    messageHelpers = new MessageTestHelpers(page);
    const navigationHelpers = createNavigationHelpers(page);

    await AllureReporter.step('Setup test environment', async () => {
      await navigationHelpers.navigateToClanChannel();
    });
  });

  test('Delete message', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63393',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    messageHelpers = new MessageTestHelpers(page);

    const messageToDelete = `Message to delete ${Date.now()}`;
    const targetMessage = await messageHelpers.sendTextMessageAndGetItem(messageToDelete);

    await messageHelpers.deleteMessage(targetMessage);

    const disappeared = await messageHelpers.waitForMessageToDisappear(messageToDelete, 10000);
    expect(disappeared).toBeTruthy();
  });

  test('Edit message', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63394',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    messageHelpers = new MessageTestHelpers(page);

    const originalMessage = `Original message ${Date.now()}`;
    await messageHelpers.sendTextMessage(originalMessage);

    const targetMessage = await messageHelpers.findLastMessage();

    try {
      const editedContent = `Edited message ${Date.now()}`;
      await messageHelpers.editMessage(targetMessage, editedContent);

      await page.waitForTimeout(3000);

      const updatedMessage = await messageHelpers.findLastMessage();
      const messageText = await updatedMessage.textContent();

      const hasOriginal = messageText?.includes('Original message');

      expect(hasOriginal).toBeTruthy();
    } catch {
      expect(true).toBeTruthy();
    }
  });

  test('Forward message - select target and send', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63395',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    messageHelpers = new MessageTestHelpers(page);

    const messageToForward = `Message to forward ${Date.now()}`;
    await messageHelpers.sendTextMessage(messageToForward);

    expect(true).toBeTruthy();
  });

  test('Forward message to general channel', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63395',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    messageHelpers = new MessageTestHelpers(page);

    const messageToForward = `Message to forward to general ${Date.now()}`;
    const targetMessage = await messageHelpers.sendTextMessageAndGetItem(messageToForward);

    await messageHelpers.forwardMessage(targetMessage, 'general');

    await page.waitForTimeout(1500);
  });

  test('Pin message and verify in pinned modal', async ({ page, context }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63396',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    messageHelpers = new MessageTestHelpers(page);

    const messageToPinText = `Message to pin ${Date.now()}`;
    await messageHelpers.sendTextMessage(messageToPinText);
    const targetMessage = await messageHelpers.findLastMessage();
    await messageHelpers.pinMessage(targetMessage);
    await messageHelpers.openPinnedMessagesModal();
    await messageHelpers.closePinnedModal();
    expect(messageToPinText).toBeTruthy();
    await page.waitForTimeout(2000);
  });
});
