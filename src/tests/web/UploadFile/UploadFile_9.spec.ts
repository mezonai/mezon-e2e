import path from 'path';
import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { MessagePage } from '@/pages/MessagePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { FileSizeTestHelpers } from '@/utils/uploadFileHelpers';
import { expect, test } from '@playwright/test';

const SELECTED_FILE_SELECTOR = '[data-e2e="mention-selected_file"]';

test.describe('Upload File - Composer Attachment Lifecycle & Shared Files', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account9;
  let fileSizeHelpers: FileSizeTestHelpers;
  let messagePage: MessagePage;
  let messageHelper: MessageTestHelpers;

  const clanConfig = ClanSetupHelper.createConfig({
    clanNamePrefix: 'UploadLifeClan',
    suiteName: 'Upload File - Module 9',
  });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await clanFactory.setupClan(clanConfig, page);
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    const auth = await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), auth);
    fileSizeHelpers = new FileSizeTestHelpers(page);
    messagePage = new MessagePage(page);
    messageHelper = new MessageTestHelpers(page);
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const auth = await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), auth);
    await clanFactory.cleanupClan(page);
    await fileSizeHelpers.cleanupFiles();
    await AuthHelper.logout(page);
    await context.close();
  });

  test('TC01: Cancel file attachment in composer before sending', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can cancel a pending file attachment before sending.

      **Test Steps:**
      1. Attach a file into the channel message composer
      2. Verify the pending attachment preview is displayed
      3. Cancel the attachment via Escape or remove button
      4. Verify the attachment preview disappears
      5. Send a plain text message and verify no attachment is sent
    `);

    const fileName = `cancel-attachment-${Date.now().toString(36)}`;
    const filePath = await fileSizeHelpers.createFileWithSize(fileName, 12 * 1024, 'png');

    await AllureReporter.step('Attach file into message composer', async () => {
      await fileSizeHelpers.uploadFileDefault(filePath);
      await expect(page.locator(SELECTED_FILE_SELECTOR)).toBeVisible({ timeout: 10000 });
      await expect(page.locator('button[title="Remove Attachment"]')).toBeVisible({
        timeout: 5000,
      });
    });

    await AllureReporter.step('Cancel attachment via remove button', async () => {
      const removeBtn = page.locator('button[title="Remove Attachment"]');
      await removeBtn.click();
      await expect(removeBtn).toBeHidden({ timeout: 5000 });
    });

    await AllureReporter.step(
      'Send plain text message and verify no attachment is present',
      async () => {
        const plainText = `No attachment message ${Date.now().toString(36)}`;
        const messageInput = await messageHelper.findMessageInput();
        await messageInput.fill(plainText);
        await messageInput.press('Enter');

        const lastMessage = messageHelper.getMessageItemLocator().last();
        await expect(lastMessage).toBeVisible({ timeout: 10000 });
        await expect(lastMessage).toContainText(plainText);
        await expect(lastMessage.locator('img[alt*="cancel-attachment"]')).toHaveCount(0);
      }
    );
  });

  test('TC02: Upload file attachment with caption text and verify in channel message', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify uploading a file attachment together with caption text sends both successfully.

      **Test Steps:**
      1. Attach a file into the message composer
      2. Fill caption text in the message input
      3. Press Enter to send
      4. Verify the sent message contains both the caption text and the uploaded file
    `);

    const baseName = `caption-upload-${Date.now().toString(36)}`;
    const filePath = await fileSizeHelpers.createFileWithSize(baseName, 16 * 1024, 'png');
    const diskFileName = path.basename(filePath);
    const captionText = `Caption with upload ${Date.now().toString(36)}`;

    await AllureReporter.step('Attach file and enter caption text', async () => {
      await fileSizeHelpers.uploadFileDefault(filePath);
      const selectedFile = page.locator(SELECTED_FILE_SELECTOR);
      await expect(selectedFile).toBeVisible({ timeout: 10000 });

      const messageInput = await messageHelper.findMessageInput();
      await messageInput.fill(captionText);
      await messageInput.press('Enter');
    });

    await AllureReporter.step(
      'Verify message rendered with caption text and image attachment',
      async () => {
        const messages = messageHelper.getMessageItemLocator();
        const lastMessage = messages.last();
        await expect(lastMessage).toBeVisible({ timeout: 15000 });
        await expect(lastMessage).toContainText(captionText);

        const fileAttachment = lastMessage
          .locator(`img, a[href*="${diskFileName}"], [data-e2e*="file"]`)
          .first();
        await expect(fileAttachment).toBeVisible({ timeout: 10000 });
      }
    );
  });

  test('TC03: Verify uploaded file appears in Channel Shared Files panel', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that files sent in a channel are indexed and visible in the Shared Files tab.

      **Test Steps:**
      1. Upload and send a document file (.txt or .png) in the channel
      2. Open the Shared Files gallery panel from channel header
      3. Verify the file exists in the shared files list
    `);

    const baseName = `gallery-doc-${Date.now().toString(36)}`;
    const filePath = await fileSizeHelpers.createFileWithSize(baseName, 8 * 1024, 'txt');
    const diskFileName = path.basename(filePath);

    await AllureReporter.step('Upload and send attachment', async () => {
      await fileSizeHelpers.uploadFileDefault(filePath);
      await expect(page.locator(SELECTED_FILE_SELECTOR)).toBeVisible({ timeout: 10000 });

      const messageInput = await messageHelper.findMessageInput();
      await messageInput.press('Enter');

      const lastMessage = messageHelper.getMessageItemLocator().last();
      await expect(lastMessage).toBeVisible({ timeout: 15000 });
    });

    await AllureReporter.step('Open Shared Files and verify file exists', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await messagePage.openSharedFiles();
      await messagePage.verifySharedFileExists(diskFileName);
    });
  });
});
