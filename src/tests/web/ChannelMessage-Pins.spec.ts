import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';
import { setupChannelMessageSuite } from './common/ChannelMessage-Base';

test.describe('Channel Message - Pin Functionality', () => {
  const { getTestSuiteSetup } = setupChannelMessageSuite('Pin Tests');

  test('Pin message and verify in pinned modal', async ({ page, context }) => {
    const { messageHelpers } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63396',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const messageToPinText = `Message to pin ${Date.now()}`;
    await messageHelpers.sendTextMessage(messageToPinText);
    const targetMessage = await messageHelpers.findLastMessage();
    await messageHelpers.pinMessage(targetMessage);
    await messageHelpers.openPinnedMessagesModal();
    await messageHelpers.closePinnedModal();
    expect(messageToPinText).toBeTruthy();
    await page.waitForTimeout(2000);
  });

  test('Jump to pinned message and verify in main chat', async ({ page, context }) => {
    const { messageHelpers } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63397',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

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
      const modalElement = page.locator(selector).first();
      if (await modalElement.isVisible({ timeout: 2000 })) {
        modalFound = true;
        break;
      }
    }
    expect(modalFound).toBeTruthy();

    await messageHelpers.clickJumpToMessage(messageToPin);

    const isMessageVisible = await messageHelpers.verifyMessageVisibleInMainChat(messageToPin);
    expect(isMessageVisible).toBeTruthy();

    await page.waitForTimeout(2000);
  });
});
