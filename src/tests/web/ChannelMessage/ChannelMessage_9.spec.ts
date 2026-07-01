import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import pressEsc from '@/utils/pressEsc';
import { FileSizeTestHelpers } from '@/utils/uploadFileHelpers';
import test, { expect } from '@playwright/test';
import { AccountCredentials } from '../../../config/environment';

import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelType } from '@/types/clan-page.types';
import TestSuiteHelper from '@/utils/testSuite.helper';

test.describe('Channel Message - Module 9', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account9;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage9,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
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

  test('Press Escape before send clears file attachment preview', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '66012',
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that pressing Escape before sending cancels the in-composer file upload flow and removes file previews.

    **Test Steps:**
    1. Create a new text channel
    2. Upload a file into the message composer (do not send)
    3. Press Escape
    4. Verify the file preview area is no longer visible

    **Expected Result:** After Escape, there is no file preview in the composer; the message is not sent.
  `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'attachment', 'escape', 'composer'],
    });

    const clanPage = new ClanPage(page);
    const fileSizeHelpers = new FileSizeTestHelpers(page);
    const previewRoot = await clanPage.getSelectedFilePreview();

    const unique = Date.now().toString(36);
    const channelName = `tc-${unique}`.slice(0, 20);

    await AllureReporter.step('Create a new text channel', async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    const filePath = await fileSizeHelpers.createFileWithSize(
      'esc_cancel_upload',
      80 * 1024,
      'jpg'
    );

    await AllureReporter.step('Upload file to composer without sending', async () => {
      await fileSizeHelpers.uploadFileDefault(filePath);
      await expect(previewRoot).toBeVisible({ timeout: 5000 });
    });

    await AllureReporter.step('Press Escape before send', async () => {
      await pressEsc(page);
    });

    await AllureReporter.step('Verify file preview is cleared', async () => {
      await expect(previewRoot).toBeHidden({ timeout: 5000 });
    });
  });
});
