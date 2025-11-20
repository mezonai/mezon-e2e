import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import test, { expect } from '@playwright/test';
import { AccountCredentials } from '../../../config/environment';

import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { MessageTestHelpers } from '../../../utils/messageHelpers';
import generateRandomString from '@/utils/randomString';
import { ChannelType } from '@/types/clan-page.types';
import { MessagePage } from '@/pages/MessagePage';

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

  test('Verify that message content is edited after jump to the message', async ({ page }) => {
    const messageHelper = new MessageTestHelpers(page);
    const messagePage = new MessagePage(page);
    await AllureReporter.addWorkItemLinks({
      tms: '64595',
      github_issue: '9972',
    });

    await AllureReporter.addDescription(`
        **Test Objective:** Verify that message content is edited after jump to the message

        **Test Steps:**
        1. Send a message
        2. Pin the message
        3. Go to Pin list and jump to the message
        4. Edit message content
        5. Verify the message content is edited
        6. Reload and verify the message content is edited

        **Expected Result:** Message content is edited after jump to the message
      `);

    await AllureReporter.addLabels({
      tag: ['pin-message', 'channel-message', 'edit-message'],
    });

    const originalMessage = `original message - ${generateRandomString(10)}`;
    const editedMessage = `edited message - ${generateRandomString(10)}`;

    await AllureReporter.step('Send a message', async () => {
      await messageHelper.sendTextMessage(originalMessage);
    });

    const lastMessage = await messagePage.getLastMessage();

    await AllureReporter.step('Pin the message', async () => {
      await messageHelper.pinLastMessage();
    });

    await AllureReporter.step('Go to Pin list and jump to the message', async () => {
      await messageHelper.openPinnedMessagesModal();
      await messageHelper.clickJumpToMessage(originalMessage);
      const isMessageVisible = await messageHelper.verifyMessageVisibleInMainChat(originalMessage);
      expect(isMessageVisible).toBeTruthy();
    });

    await AllureReporter.step('Edit message content', async () => {
      await messageHelper.editMessage(lastMessage, editedMessage);
    });

    await AllureReporter.step('Verify the message content is edited', async () => {
      await messageHelper.verifyLastMessageHasText(editedMessage);
    });

    await AllureReporter.step('Reload and verify the message content is edited', async () => {
      await page.reload();
      await messageHelper.verifyLastMessageHasText(editedMessage);
    });
  });

  test('Verify that can send voice channel link', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64645',
      github_issue: '9816',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that can send voice channel link

      **Test Steps:**
      1. Create new voice channel
      2. Join voice channel
      3. Copy voice channel link
      4. Send voice channel link in general channel
      4. Verify voice channel link is sent

      **Expected Result:** Voice channel link is sent
    `);

    await AllureReporter.addLabels({
      tag: ['voice-channel', 'send-voice-channel-link'],
    });
    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const ran = Math.floor(Math.random() * 999) + 1;
    const channelName = `voice-channel-${ran}`;

    await AllureReporter.step(`Create new voice channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.VOICE, channelName);
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('Join voice channel', async () => {
      await clanPage.joinVoiceChannel(channelName);
      const isUserInVoiceChannel = await clanPage.isJoinVoiceChannel(channelName);
      expect(isUserInVoiceChannel).toBe(true);
    });

    await AllureReporter.step('Copy and send voice channel link', async () => {
      await clanPage.copyVoiceChannelLink();
      await clanPage.openChannelByName('general');
      await messageHelper.pasteAndSendText();
      await page.waitForTimeout(3000);
    });

    await AllureReporter.step('Verify voice channel link is sent', async () => {
      const isVoiceChannelLinkSent = await messageHelper.verifyLastMessageHasText(channelName);
      expect(isVoiceChannelLinkSent).toBe(true);
    });
  });

  test('Verify that can jump to pinned edited message is not makes DM and another channel/thread skeleton loading', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64699',
      github_issue: '9420',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that can jump to pinned edited message is not makes DM and another channel/thread skeleton loading

      **Test Steps:**
      1. Send a message
      2. Pin the message
      3. Edit the message content
      4. Go to Pin list and jump to the message
      5. Verify the message is visible in the main chat
      6. Go to DM list and return to the channel
      7. Verify the message is displayed in the channel

      **Expected Result:** Message is still displayed in the channel after going to DM list and return to the channel
    `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'jump-to-pinned-edited-message'],
    });
    const clanPage = new ClanPage(page);
    const messagePage = new MessagePage(page);
    const messageHelper = new MessageTestHelpers(page);

    const originalMessage = `original message - ${generateRandomString(10)}`;
    const editedMessage = `edited message - ${generateRandomString(10)}`;

    await AllureReporter.step('Send a message', async () => {
      await messageHelper.sendTextMessage(originalMessage);
    });

    const lastMessage = await messagePage.getLastMessage();

    await AllureReporter.step('Pin the message', async () => {
      await messageHelper.pinLastMessage();
    });

    await AllureReporter.step('Edit the message content', async () => {
      await page.waitForTimeout(1000);
      await messageHelper.editMessage(lastMessage, editedMessage);
    });

    await AllureReporter.step('Go to Pin list and jump to the message', async () => {
      await messageHelper.openPinnedMessagesModal();
      await messageHelper.clickJumpToMessage(editedMessage);
      const isMessageVisible = await messageHelper.verifyMessageVisibleInMainChat(editedMessage);
      expect(isMessageVisible).toBeTruthy();
    });

    await AllureReporter.step('Go to DM list and return to the channel', async () => {
      await clanPage.gotoDM();
      const clanItem = await clanPage.getClanItemByName(clanFactory.getClanName());
      await clanItem.click();
    });

    await AllureReporter.step('Verify the message is displayed in the channel', async () => {
      const isMessageVisible = await messageHelper.verifyMessageVisibleInMainChat(editedMessage);
      expect(isMessageVisible).toBeTruthy();
    });
  });
});
