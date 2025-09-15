import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { AuthHelper } from '@/utils/authHelper';
import { MessageTestHelpers } from '../../utils/messageHelpers';
import { expect, test } from '@playwright/test';

test.describe('Channel Message - Media', () => {
  let clanSetupHelper: ClanSetupHelper;
  let testClanName: string;
  let clanUrl: string;
  let messageHelpers: MessageTestHelpers;
  test.use({ storageState: 'playwright/.auth/account2-media.json' });

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);
    const setupResult = await clanSetupHelper.setupTestClan(
      ClanSetupHelper.configs.channelMessageMedia
    );
    testClanName = setupResult.clanName;
    clanUrl = setupResult.clanUrl;
  });

  test.beforeEach(async ({ page, context }, testInfo) => {
    // await AuthHelper.setAuthForSuite(
    //   page,
    //   ClanSetupHelper.configs.channelMessageMedia.suiteName || 'Channel Message - Media'
    // );

    await AllureReporter.initializeTest(page, testInfo, {
      story: AllureConfig.Stories.TEXT_MESSAGING,
      severity: AllureConfig.Severity.CRITICAL,
      testType: AllureConfig.TestTypes.E2E,
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    await page.goto(clanUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
  });

  test.afterAll(async ({ browser }) => {
    if (clanSetupHelper && testClanName && clanUrl) {
      await clanSetupHelper.cleanupClan(
        testClanName,
        clanUrl,
        ClanSetupHelper.configs.channelMessageMedia.suiteName
      );
    }
  });

  // Image Functionality Tests
  test('Click into an image in the message and copy from detail', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '63389' });

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

  test('Copy image from context menu - ImageHandling version', async ({ page }) => {
    const initialImageCount = await messageHelpers.countImages();
    if (initialImageCount === 0) {
      return;
    }
    const targetImage = await messageHelpers.findImage();
    await messageHelpers.copyImage(targetImage);
    await messageHelpers.pasteAndSendImage();
    await expect(page.locator('img[src*="blob:"]').last()).toBeVisible();
  });

  // Threads & Topics Tests
  test('Create topic discussion thread from message', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '63391' });

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
    await AllureReporter.addWorkItemLinks({ tms: '63392' });

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
    await AllureReporter.addWorkItemLinks({ tms: '63391' });

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
