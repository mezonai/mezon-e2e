import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import test, { expect } from '@playwright/test';
import { AccountCredentials } from '../../../config/environment';

import { ClanFactory } from '@/data/factories/ClanFactory';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { MessageTestHelpers } from '../../../utils/messageHelpers';

test.describe('Channel Message - Module 1', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials['account2-1'];
  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.threadManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63366',
    });
    await TestSuiteHelper.setupBeforeEach({
      page,
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

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test('Click into an image in the message and copy from detail', async ({ page }) => {
    const messageHelper = new MessageTestHelpers(page);
    await AllureReporter.addWorkItemLinks({
      tms: '63389',
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
      return await messageHelper.countImages();
    });

    if (initialImageCount === 0) {
      await AllureReporter.attachScreenshot(page, 'No Images Available for Test');
      return;
    }

    const targetImage = await AllureReporter.step('Find target image', async () => {
      return await messageHelper.findImage();
    });

    const { imageToRightClick } = await AllureReporter.step(
      'Click image and handle modal',
      async () => {
        return await messageHelper.clickImageAndHandleModal(targetImage);
      }
    );

    await AllureReporter.step('Copy image from detail view', async () => {
      await messageHelper.copyImage(imageToRightClick);
    });

    await AllureReporter.step('Close modal', async () => {
      await messageHelper.closeModal();
    });

    await AllureReporter.step('Paste and send image', async () => {
      await messageHelper.pasteAndSendImage();
    });

    await AllureReporter.step('Verify pasted image is visible', async () => {
      await expect(page.locator('img[src*="blob:"]').last()).toBeVisible();
    });

    await AllureReporter.attachScreenshot(page, 'Image Copy Test Completed');
  });

  test('Copy image from context menu outside the message', async ({ page }) => {
    const messageHelper = new MessageTestHelpers(page);
    const initialImageCount = await messageHelper.countImages();
    if (initialImageCount === 0) {
      return;
    }
    const targetImage = await messageHelper.findImage();
    await messageHelper.copyImage(targetImage);
    await messageHelper.pasteAndSendImage();
    await expect(page.locator('img[src*="blob:"]').last()).toBeVisible();
  });

  test('Copy message text and send it', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63390',
    });

    const messageHelper = new MessageTestHelpers(page);

    const testMessage = `Test message ${Date.now()}`;
    await messageHelper.sendTextMessage(testMessage);

    const targetMessage = await messageHelper.findLastMessage();

    const copiedText = await messageHelper.copyText(targetMessage);
    expect(copiedText).toBeTruthy();
    expect(copiedText.trim().length).toBeGreaterThan(0);
    expect(copiedText).toEqual(testMessage);

    await messageHelper.sendTextMessage(copiedText);

    const pastedMessage = await messageHelper.findLastMessage();

    await expect(pastedMessage).toHaveText(copiedText);
    await expect(pastedMessage).toBeVisible();
  });

  test('Create topic discussion thread from message', async ({ page }) => {
    const messageHelper = new MessageTestHelpers(page);
    await AllureReporter.addWorkItemLinks({
      tms: '63391',
    });

    const initialMessageCount = await messageHelper.countMessages();

    const originalMessage = `Original message ${Date.now()}`;
    await messageHelper.sendTextMessage(originalMessage);

    const targetMessage = await messageHelper.findLastMessage();

    await messageHelper.openTopicDiscussion(targetMessage);

    const threadMessage = `Thread reply ${Date.now()}`;
    await messageHelper.sendMessageInThread(threadMessage);

    const finalMessageCount = await messageHelper.countMessages();
    expect(finalMessageCount).toBeGreaterThanOrEqual(initialMessageCount + 1);
  });

  test('Create thread from message and send reply', async ({ page }) => {
    const messageHelper = new MessageTestHelpers(page);
    await AllureReporter.addWorkItemLinks({
      tms: '63392',
    });

    const initialMessageCount = await messageHelper.countMessages();

    const originalMessage = `Thread starter message ${Date.now()}`;
    await messageHelper.sendTextMessage(originalMessage);

    const targetMessage = await messageHelper.findLastMessage();

    const threadName = `My Test Thread ${Date.now()}`;
    await messageHelper.createThread(targetMessage, threadName);

    const threadReply = `Thread reply ${Date.now()}`;
    await messageHelper.sendMessageInThread(threadReply, true);

    const finalMessageCount = await messageHelper.countMessages();
    expect(finalMessageCount).toBeGreaterThanOrEqual(initialMessageCount + 1);
  });
});
