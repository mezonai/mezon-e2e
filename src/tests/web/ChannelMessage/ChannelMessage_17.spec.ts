import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test from '@playwright/test';

test.describe('Channel Messages - Edit and Delete Flash Messages', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account8;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage6,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await new ChannelSettingPage(page).closeChannelSettingsIfVisible();
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('Edit a flash message and send its updated content', async ({ page }) => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify an edited flash message uses its updated command and content when sent.

      **Test Steps:**
      1. Create a flash message
      2. Edit its command and message content
      3. Verify the updated flash message in Quick Menu settings
      4. Send the updated flash message in the channel

      **Expected Result:** The sent message displays the edited flash message content.
    `);
    await AllureReporter.addLabels({ tag: ['channel-message', 'flash-message', 'edit'] });

    const clanPage = new ClanPage(page);
    const channelSettingsPage = new ChannelSettingPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const suffix = Date.now().toString(36).slice(-6);
    const originalCommand = `flash${suffix}`;
    const editedCommand = `edited${suffix}`;
    const originalContent = `Original flash message ${suffix}`;
    const editedContent = `Edited flash message ${suffix}`;

    await AllureReporter.step('Create and edit a flash message', async () => {
      await clanPage.openChannelSettings('general');
      await channelSettingsPage.openQuickMenuSettings();
      await channelSettingsPage.openFlashMessageModal();
      await channelSettingsPage.createFlashMessage(originalCommand, originalContent);
      await channelSettingsPage.editFlashMessage(originalCommand, editedCommand, editedContent);
      await channelSettingsPage.closeChannelSettings();
    });

    await AllureReporter.step('Send and verify the edited flash message', async () => {
      await messageHelper.sendFlashMessageAndVerify(editedCommand, editedContent);
    });
  });

  test('Delete a flash message and verify it cannot be used', async ({ page }) => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify a deleted flash message is no longer available when composing a message.

      **Test Steps:**
      1. Create a flash message
      2. Delete it from Quick Menu settings
      3. Enter its command in the channel message input

      **Expected Result:** The deleted flash message is absent from command suggestions and cannot be sent as a flash message.
    `);
    await AllureReporter.addLabels({ tag: ['channel-message', 'flash-message', 'delete'] });

    const clanPage = new ClanPage(page);
    const channelSettingsPage = new ChannelSettingPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const suffix = Date.now().toString(36).slice(-6);
    const command = `delete${suffix}`;
    const content = `Flash message to delete ${suffix}`;

    await AllureReporter.step('Create and delete a flash message', async () => {
      await clanPage.openChannelSettings('general');
      await channelSettingsPage.openQuickMenuSettings();
      await channelSettingsPage.openFlashMessageModal();
      await channelSettingsPage.createFlashMessage(command, content);
      await channelSettingsPage.deleteFlashMessage(command);
      await channelSettingsPage.closeChannelSettings();
    });

    await AllureReporter.step('Verify the deleted flash message cannot be used', async () => {
      await messageHelper.verifyDeletedFlashMessageIsUnavailable(command);
    });
  });
});
