import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';
import { setupChannelMessageSuite } from './common/ChannelMessage-Base';

test.describe('Channel Message - Image Functionality', () => {
  const { getTestSuiteSetup } = setupChannelMessageSuite('Image Tests');

  test('Click into an image in the message and copy from detail', async ({ page }) => {
    const { messageHelpers } = getTestSuiteSetup();

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
    const { messageHelpers } = getTestSuiteSetup();

    const initialImageCount = await messageHelpers.countImages();
    if (initialImageCount === 0) {
      return;
    }
    const targetImage = await messageHelpers.findImage();
    await messageHelpers.copyImage(targetImage);
    await messageHelpers.pasteAndSendImage();
    await expect(page.locator('img[src*="blob:"]').last()).toBeVisible();
  });
});
