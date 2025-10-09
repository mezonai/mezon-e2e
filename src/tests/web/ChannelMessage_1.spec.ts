import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { expect, test as base, Page } from '@playwright/test';
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

test.describe('Channel Message - Module 1', () => {
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

  test('Click into an image in the message and copy from detail', async ({ page }) => {
    const messageHelper = new MessageTestHelpers(page);
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

  test('Copy message text and send it', async ({ pageWithClipboard }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63390',
    });

    const messageHelper = new MessageTestHelpers(pageWithClipboard);

    const testMessage = `Test message ${Date.now()}`;
    await messageHelper.sendTextMessage(testMessage);

    const targetMessage = await messageHelper.findLastMessage();

    const copiedText = await messageHelper.copyText(targetMessage);
    expect(copiedText).toBeTruthy();
    expect(copiedText.trim().length).toBeGreaterThan(0);
    expect(copiedText).toContain('Test message');

    const pastedText = copiedText || 'Pasted message from clipboard';
    await messageHelper.sendTextMessage(pastedText);

    await expect(pageWithClipboard.locator(`text="${pastedText}"`).first()).toBeVisible();
  });

  test('Create topic discussion thread from message', async ({ pageWithClipboard }) => {
    const messageHelper = new MessageTestHelpers(pageWithClipboard);
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

  test('Create thread from message and send reply', async ({ pageWithClipboard, context }) => {
    const messageHelper = new MessageTestHelpers(pageWithClipboard);
    await AllureReporter.addWorkItemLinks({
      tms: '63392',
    });

    await pageWithClipboard.goto(clanPath);
    await pageWithClipboard.waitForLoadState('networkidle');
    await pageWithClipboard.waitForTimeout(3000);
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
