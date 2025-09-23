import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { expect, test } from '@playwright/test';
import { WEBSITE_CONFIGS } from '../../config/environment';
import { joinUrlPaths } from '../../utils/joinUrlPaths';

import { MessageTestHelpers } from '../../utils/messageHelpers';

interface NavigationHelpers {
  navigateToHomePage(): Promise<void>;
  navigateToDirectChat(): Promise<void>;
  navigateToClanChannel(): Promise<void>;
}

test.describe('Channel Message - Module 1', () => {
  let messageHelpers: MessageTestHelpers;
  let clanSetupHelper: ClanSetupHelper;
  let testClanName: string;
  let testClanUrl: string;
  const MEZON_BASE_URL = WEBSITE_CONFIGS.MEZON.baseURL || '';

  test.use({ storageState: 'playwright/.auth/account2-1.json' });

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(
      ClanSetupHelper.configs.channelMessage1
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

  test('Click into an image in the message and copy from detail', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63389',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
        **Test Objective:** Verify that users can click into an image in a message and copy it from the detail view.
        
        **Test Steps:**
        1. Find an image in a message
        2. Click into the image to open detail view
        3. Copy the image from detail view
        4. Close modal and paste the image
        5. Send the pasted image
        
        **Expected Result:** Image should be successfully copied and pasted as a new message.
      `);

    await AllureReporter.addLabels({
      tag: ['image-handling', 'copy-paste', 'media'],
    });

    const initialImageCount = await AllureReporter.step('Count initial images', async () => {
      return await messageHelpers.countImages();
    });

    if (initialImageCount === 0) {
      await AllureReporter.attachScreenshot(page, 'No Images Available for Test');
      return;
    }

    const targetImage = await AllureReporter.step('Find target image', async () => {
      return await messageHelpers.findImage();
    });

    const { imageToRightClick } = await AllureReporter.step(
      'Click image and handle modal',
      async () => {
        return await messageHelpers.clickImageAndHandleModal(targetImage);
      }
    );

    await AllureReporter.step('Copy image from detail view', async () => {
      await messageHelpers.copyImage(imageToRightClick);
    });

    await AllureReporter.step('Close modal', async () => {
      await messageHelpers.closeModal();
    });

    await AllureReporter.step('Paste and send image', async () => {
      await messageHelpers.pasteAndSendImage();
    });

    await AllureReporter.step('Verify pasted image is visible', async () => {
      await expect(page.locator('img[src*="blob:"]').last()).toBeVisible();
    });

    await AllureReporter.attachScreenshot(page, 'Image Copy Test Completed');
  });

  test('Copy image from context menu outside the message', async ({ page }) => {
    const initialImageCount = await messageHelpers.countImages();
    if (initialImageCount === 0) {
      return;
    }
    const targetImage = await messageHelpers.findImage();
    await messageHelpers.copyImage(targetImage);
    await messageHelpers.pasteAndSendImage();
    await expect(page.locator('img[src*="blob:"]').last()).toBeVisible();
  });

  test('Copy message text and send it', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63390',
    });

    const testMessage = `Test message ${Date.now()}`;
    await messageHelpers.sendTextMessage(testMessage);

    const targetMessage = await messageHelpers.findLastMessage();

    const copiedText = await messageHelpers.copyText(targetMessage);
    expect(copiedText).toBeTruthy();
    expect(copiedText.trim().length).toBeGreaterThan(0);
    expect(copiedText).toContain('Test message');

    const pastedText = copiedText || 'Pasted message from clipboard';
    await messageHelpers.sendTextMessage(pastedText);

    await expect(page.locator(`text="${pastedText}"`).first()).toBeVisible();
  });

  test('Create topic discussion thread from message', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63391',
    });

    messageHelpers = new MessageTestHelpers(page);

    const originalMessage = `Original message ${Date.now()}`;
    await messageHelpers.sendTextMessage(originalMessage);

    const targetMessage = await messageHelpers.findLastMessage();

    await messageHelpers.openTopicDiscussion(targetMessage);

    await expect(messageHelpers.verifyFirstTopicMessage(originalMessage)).toBeTruthy();
    await expect(messageHelpers.verifyTopicInputEmpty()).toBeTruthy();

    const threadMessage = `Thread reply ${Date.now()}`;
    await messageHelpers.sendMessageInThread(threadMessage);
    await page.waitForTimeout(2000);
    await expect(messageHelpers.verifyFirstTopicMessage(originalMessage)).toBeTruthy();
    await expect(messageHelpers.verifyLastTopicMessage(threadMessage)).toBeTruthy();
  });

  test('Create thread from message and send reply', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63392',
      github_issue: '9657'
    });

    messageHelpers = new MessageTestHelpers(page);
    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const originalMessage = `Thread starter message ${Date.now()}`;
    await messageHelpers.sendTextMessage(originalMessage);

    const targetMessage = await messageHelpers.findLastMessage();

    const threadName = `My Test Thread ${Date.now()}`;
    await messageHelpers.createThread(targetMessage);

    await expect(messageHelpers.verifyFirstThreadMessage(originalMessage)).toBeTruthy();
    await expect(messageHelpers.verifyThreadInputEmpty()).toBeTruthy();

    await messageHelpers.fillThreadName(threadName);

    const threadReply = `Thread reply ${Date.now()}`;
    await messageHelpers.sendMessageInThread(threadReply, true);

    await expect(messageHelpers.verifyFirstThreadMessage(threadReply)).toBeTruthy();
  });
});
