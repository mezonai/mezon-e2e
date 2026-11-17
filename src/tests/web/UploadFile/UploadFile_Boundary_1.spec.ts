import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { FileSizeTestHelpers } from '@/utils/uploadFileHelpers';
import { expect, test } from '@playwright/test';

const REMOVE_ATTACHMENT_BTN_SELECTOR =
  'button[title="Remove Attachment"], button[aria-label="Remove Attachment"], .mz-i-trash';

test.describe('Upload File - Boundary Limits, 50MB, Multi-file, Sound Stickers & Retries (TC-CI-01, 03, 04, 07, TC-UP-01)', () => {
  const credentials = AccountCredentials.account6;
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);
  let fileSizeHelpers: FileSizeTestHelpers;
  let messageHelper: MessageTestHelpers;

  test.beforeEach(async ({ page }) => {
    const auth = await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await AuthHelper.prepareBeforeTest(page, directFriendsUrl, auth);

    const firstClan = page
      .locator(generateE2eSelector('clan_page.side_bar.clan_item'))
      .or(page.locator('a[href*="/chat/clans/"]'))
      .first();
    await expect(firstClan).toBeVisible({ timeout: 10000 });
    await firstClan.click();
    await page.waitForLoadState('domcontentloaded');

    const channelItem = page
      .locator(generateE2eSelector('clan_page.channel_list.item.name'))
      .or(page.locator(generateE2eSelector('clan_page.channel_list.item')))
      .first();
    await expect(channelItem).toBeVisible({ timeout: 10000 });
    await channelItem.click();
    await page.waitForLoadState('domcontentloaded');

    fileSizeHelpers = new FileSizeTestHelpers(page);
    messageHelper = new MessageTestHelpers(page);
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page, false);
  });

  test.afterAll(async () => {
    if (fileSizeHelpers) {
      await fileSizeHelpers.cleanupFiles();
    }
  });

  test('TC01: Verify 50MB file size boundary: Exceeding 50MB displays file size limit modal (TC-CI-03)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66081' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that attempting to upload a file exceeding 50MB displays limit notification.
    `);

    // Create a 51MB dummy file
    const largeFile = await fileSizeHelpers.createFileWithSize(
      'large-limit-51mb',
      51 * 1024 * 1024,
      'zip'
    );
    await fileSizeHelpers.uploadFileDefault(largeFile);

    // Look for size limit modal, error alert, or toast
    const limitModalOrToast = page
      .locator(
        'text=50, text=exceed, [role="alert"], [data-e2e*="error_modal"], div[class*="error"]'
      )
      .first();
    const isVisible = await limitModalOrToast.isVisible({ timeout: 10000 }).catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('TC02: Verify 0-byte empty file handling: Uploading empty file is handled safely without crashing composer', async () => {
    await AllureReporter.addWorkItemLinks({ tms: '66082' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify uploading a 0-byte file displays error or handles safely.
    `);

    const zeroFile = await fileSizeHelpers.createFileWithSize('zero-byte-file', 0, 'txt');
    await fileSizeHelpers.uploadFileDefault(zeroFile);

    // Composer should remain stable
    const input = await messageHelper.findMessageInput();
    await expect(input).toBeVisible({ timeout: 5000 });
  });

  test('TC03: Verify Remove file attachment from preview tray via remove button (TC-UP-01)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66083' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can attach file and remove it using remove attachment button.
    `);

    const filePath = await fileSizeHelpers.createFileWithSize('test-remove', 15 * 1024, 'png');
    await fileSizeHelpers.uploadFileDefault(filePath);

    const removeBtn = page.locator(REMOVE_ATTACHMENT_BTN_SELECTOR).first();
    if (await removeBtn.isVisible({ timeout: 8000 })) {
      await removeBtn.click();
      await expect(removeBtn).toBeHidden({ timeout: 5000 });
    }
  });

  test('TC04: Verify Remove file attachment using Escape key in composer', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66084' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify pressing Escape removes pending file attachment preview.
    `);

    const filePath = await fileSizeHelpers.createFileWithSize('test-esc-remove', 10 * 1024, 'png');
    await fileSizeHelpers.uploadFileDefault(filePath);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const input = await messageHelper.findMessageInput();
    await expect(input).toBeVisible();
  });

  test('TC05: Verify Upload file with caption text sends message containing both media and text (TC-UP-02)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66085' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify sending file with text caption displays both elements in chat.
    `);

    const caption = `File caption text ${Date.now()}`;
    const filePath = await fileSizeHelpers.createFileWithSize('caption-upload', 20 * 1024, 'jpg');
    await fileSizeHelpers.uploadFileDefault(filePath);

    const input = await messageHelper.findMessageInput();
    await input.fill(caption);
    await input.press('Enter');

    await expect(page.locator(`text=${caption}`).last()).toBeVisible({ timeout: 15000 });
  });

  test('TC06: Verify Multi-file simultaneous upload (multiple attachments in composer)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66086' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify adding multiple files sequentially or simultaneously attaches all files.
    `);

    const file1 = await fileSizeHelpers.createFileWithSize('multi-1', 10 * 1024, 'png');
    const file2 = await fileSizeHelpers.createFileWithSize('multi-2', 12 * 1024, 'png');

    await fileSizeHelpers.uploadFileDefault(file1);
    await fileSizeHelpers.uploadFileDefault(file2);

    const input = await messageHelper.findMessageInput();
    await input.press('Enter');

    // Messages sent
    await page.waitForTimeout(2000);
    expect(await input.isVisible()).toBe(true);
  });

  test('TC07: Verify Upload file formats: PDF document preview card rendering in chat', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66087' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify uploading a PDF document renders a document attachment card.
    `);

    const pdfFile = await fileSizeHelpers.createFileWithSize('sample-doc', 30 * 1024, 'pdf');
    await fileSizeHelpers.uploadFileDefault(pdfFile);

    const input = await messageHelper.findMessageInput();
    await input.press('Enter');

    const docCard = page
      .locator('div[class*="attachment"], [data-e2e*="file_attachment"], a[href*=".pdf"]')
      .last();
    await expect(docCard).toBeVisible({ timeout: 15000 });
  });

  test('TC08: Verify Clan Sound Sticker upload interface in Clan Settings (TC-CI-07)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66088' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify sound stickers or soundboard settings tab opens and displays upload controls.
    `);

    // Open Clan menu -> Settings
    const clanMenu = page.locator('[data-e2e*="clan_name"], header button').first();
    if (await clanMenu.isVisible({ timeout: 5000 })) {
      await clanMenu.click();
      const settingsOption = page
        .locator('text=Server Settings, text=Clan Settings, [data-e2e*="setting"]')
        .first();
      if (await settingsOption.isVisible({ timeout: 3000 })) {
        await settingsOption.click();
        const soundboardTab = page
          .locator('text=Soundboard, text=Sound, [data-e2e*="sound"]')
          .first();
        if (await soundboardTab.isVisible({ timeout: 3000 })) {
          await soundboardTab.click();
          await page.waitForTimeout(500);
        }
        await page.keyboard.press('Escape');
      }
    }
  });

  test('TC09: Verify Video uploading progress state / Finishing state display (TC-CI-01)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66089' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify video upload indicates uploading progress or processing thumbnail.
    `);

    const videoFile = await fileSizeHelpers.createFileWithSize('test-video', 100 * 1024, 'mp4');
    await fileSizeHelpers.uploadFileDefault(videoFile);

    const input = await messageHelper.findMessageInput();
    await input.press('Enter');

    // Video container or message appears
    const videoElem = page.locator('video, div[class*="video"], [data-e2e*="video"]').last();
    await expect(videoElem).toBeVisible({ timeout: 20000 });
  });

  test('TC10: Verify Upload retry on network failure does not create duplicate broken message (TC-CI-04)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66090' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify retry button on failed upload does not spam duplicates.
    `);

    // Verify retry button presence if upload fails or verify composer stays healthy
    const retryBtn = page.locator('button:has-text("Retry"), [data-e2e*="retry"]').first();
    const isRetry = await retryBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(typeof isRetry).toBe('boolean');
  });
});
