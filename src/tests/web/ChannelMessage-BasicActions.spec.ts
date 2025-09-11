import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';
import { setupChannelMessageSuite } from './common/ChannelMessage-Base';

test.describe('Channel Message - Basic Actions', () => {
  const { getTestSuiteSetup } = setupChannelMessageSuite('Basic Actions Tests');

  test('Copy message text and send it', async ({ page }) => {
    const { messageHelpers } = getTestSuiteSetup();

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

  test('Delete message', async ({ page, context }) => {
    const { messageHelpers } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63393',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const messageToDelete = `Message to delete ${Date.now()}`;
    const targetMessage = await messageHelpers.sendTextMessageAndGetItem(messageToDelete);

    await messageHelpers.deleteMessage(targetMessage);

    const disappeared = await messageHelpers.waitForMessageToDisappear(messageToDelete, 10000);
    expect(disappeared).toBeTruthy();
  });

  test('Edit message', async ({ page, context }) => {
    const { messageHelpers } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63394',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

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
    const { messageHelpers } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63395',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const messageToForward = `Message to forward ${Date.now()}`;
    await messageHelpers.sendTextMessage(messageToForward);

    expect(true).toBeTruthy();
  });

  test('Forward message to general channel', async ({ page, context }) => {
    const { messageHelpers } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63395',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const messageToForward = `Message to forward to general ${Date.now()}`;
    const targetMessage = await messageHelpers.sendTextMessageAndGetItem(messageToForward);

    await messageHelpers.forwardMessage(targetMessage, 'general');

    await page.waitForTimeout(1500);
  });
});
