import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import test from '@playwright/test';
import { AccountCredentials } from '../../../config/environment';

import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { MessageTestHelpers } from '../../../utils/messageHelpers';

test.describe('Channel Message - Module 6', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.accountKien1;
  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage6,
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

  test('Verify that flash message is match with settings', async ({ page }) => {
    const messageHelper = new MessageTestHelpers(page);
    await AllureReporter.addWorkItemLinks({
      tms: '64545',
    });

    await AllureReporter.addDescription(`
        **Test Objective:** Verify that flash message is match with settings

        **Test Steps:**
        1. Create a flash message
        2. Paste the flash message in the message input
        3. Wait for the flash message to appear
        4. Press enter
        5. Verify the flash message is match in the message input
        6. Send the flash message
        7. Verify the flash message is sent successfully

        **Expected Result:** Flash message is match with settings
      `);

    await AllureReporter.addLabels({
      tag: ['flash-message', 'quick-menu', 'channel-message'],
    });

    const clanPage = new ClanPage(page);
    const channelSettingsPage = new ChannelSettingPage(page);
    const unique = Date.now().toString(36).slice(-6);
    const command = unique;
    const messageContent = `This is a flash message test ${unique}`;

    await AllureReporter.step('Create flash message', async () => {
      await clanPage.openChannelSettings('general');
      await channelSettingsPage.openQuickMenuSettings();
      await channelSettingsPage.openFlashMessageModal();
      await channelSettingsPage.createFlashMessage(command, messageContent);
    });

    await AllureReporter.step('Verify new flash message in quick menu list', async () => {
      await channelSettingsPage.verifyFlashMessageInQuickMenuList(command, messageContent);
      await channelSettingsPage.closeChannelSettings();
    });

    await AllureReporter.step(
      'Verify new flash message is visble when user paste on message input',
      async () => {
        await messageHelper.verifyFlashMessageOnMessageInput(command, messageContent);
      }
    );

    await AllureReporter.attachScreenshot(page, 'Flash message in input is correct');
  });
});
