import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import test, { expect } from '@playwright/test';
import { AccountCredentials } from '../../../config/environment';

import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { ChannelType } from '@/types/clan-page.types';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { MessageTestHelpers } from '../../../utils/messageHelpers';

test.describe('Channel Message - Module 7', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account5;
  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage7,
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

  test('Verify that user can send GIF message on voice channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '65032',
      github_issue: '11018',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can send GIF message on voice channel

      **Test Steps:**
      1. Create voice channel
      2. User join to voice channel
      3. User open chat box
      4. User send GIF message to chat box

      **Expected Result:** User can send GIF message on voice channel
    `);

    await AllureReporter.addLabels({
      tag: ['voice-channel', 'GIF-message', 'chat-box'],
    });

    const ran = Math.floor(Math.random() * 999) + 1;
    const channelName = `voice-channel-${ran}`;
    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);
    let gifName: string | null;

    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('channelType', ChannelType.VOICE);

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

    await AllureReporter.step('Open chat box on channel', async () => {
      await messageHelper.openHeaderInboxButton();
      await messageHelper.openGifsPopover();
      await messageHelper.openGifsTrending();
      const res = await messageHelper.sendGifsMessage();
      gifName = res;
      await page.waitForTimeout(2000);
    });

    await AllureReporter.step('Veirify message is visible on chat box', async () => {
      const messageSend = await messageHelper.isGifMessageVisible(gifName);
      expect(messageSend).toBeTruthy();
    });

    await AllureReporter.step('Verify modal error not visible', async () => {
      await page.waitForTimeout(2000);
      const errorModal = await messageHelper.isErrorModalVisible();
      expect(errorModal).toBeFalsy();
    });
  });

  test('Verify that user can send GIF message on channel and gif verify on image gallery', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63368',
      github_issue: '10991',
    });

    await AllureReporter.addLabels({
      tag: ['text-channel', 'GIF-message', 'chat-box'],
    });

    const messageHelper = new MessageTestHelpers(page);
    let gifName: string | null;

    await AllureReporter.step('Send gif message on channel', async () => {
      await messageHelper.openGifsPopover();
      await messageHelper.openGifsTrending();
      const res = await messageHelper.sendGifsMessage();
      gifName = res;
      await page.waitForTimeout(2000);
    });

    await AllureReporter.step('Veirify message is visible on chat box', async () => {
      const messageSend = await messageHelper.isGifMessageVisible(gifName);
      expect(messageSend).toBeTruthy();
    });

    await AllureReporter.step('Verify gif is visible on image gallery', async () => {
      await messageHelper.openGalleryModal();
      await messageHelper.isGifVisibleOnGalleryTab(gifName);

      await messageHelper.openImagesTabOnGallery();
      await messageHelper.isGifVisibleOnGalleryTab(gifName);
    });
  });

  test('Verify that user can send message with anonymous', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63368',
      github_issue: '10991',
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that user can send message with anonymous in a channel

    **Test Steps:**
    1. Navigate to a channel
    2. Enable anonymous mode using Ctrl+Shift+Enter
    3. Verify anonymous icon is visible
    4. Send a message with anonymous identity
    5. Verify the message is displayed with anonymous profile

    **Expected Result:** User can send message with anonymous identity
  `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'anonymous', 'text-channel'],
    });

    const messageText = `Anonymous message ${Date.now()}`;
    const messagePage = new MessagePage(page);

    await AllureReporter.step('Enable anonymous mode and send message', async () => {
      await messagePage.openAnonymous();
      await messagePage.verifyAnonymousIsVisible();
      await messagePage.sendMessageWithAnonymous(messageText);
    });

    await AllureReporter.step(
      'Verify anonymous message is sent with anonymous identity',
      async () => {
        const isMessageSent = await messagePage.isAnonymousMessageSent();
        expect(isMessageSent).toBe(true);
      }
    );
  });

  test('Verify that user can not send message with anonymous when settings prevent anonymous', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63368',
      github_issue: '10991',
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that user can not send message with anonymous when settings prevent anonymous

    **Test Steps:**
    1. Setting prevent anonymous in clan settings
    1. Navigate to a channel
    2. Enable anonymous mode using Ctrl+Shift+Enter
    3. Verify anonymous icon is not visible

    **Expected Result:** User can not send message with anonymous when settings prevent anonymous
  `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'anonymous', 'text-channel', 'prevent-anonymous'],
    });

    const messagePage = new MessagePage(page);
    const clanPage = new ClanPage(page);

    await AllureReporter.step('Setting prevent anonymous', async () => {
      await clanPage.openClanSettings();
      await clanPage.preventAnonymous();
      await clanPage.closeSettingsClan();
    });

    await AllureReporter.step('Enable anonymous mode', async () => {
      await page.keyboard.press('Control+Shift+Enter');
      await page.waitForTimeout(3000);
    });

    await AllureReporter.step('Verify anonymous icon is not visible', async () => {
      const isVisible = await messagePage.isAnonymousIconVisible();
      expect(isVisible).toBe(false);
    });
  });

  test('Add message to inbox and verify message is present in inbox', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '65128',
      github_issue: '11057',
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can add message to inbox and verify message is present in inbox
      **Test Steps:**
      1. Send message on channel
      2. Add message to inbox
      3. Open inbox
      4. Verify message is present in inbox
      **Expected Result:** User can add message to inbox and verify message is present in inbox
    `);
    await AllureReporter.addLabels({
      tag: ['channel-message', 'inbox', 'add-to-inbox'],
    });
    const messageHelper = new MessageTestHelpers(page);
    const messageContent = `Test inbox message ${Date.now()}`;
    await AllureReporter.step('Send message on channel', async () => {
      await messageHelper.sendTextMessage(messageContent);
    });

    await AllureReporter.step('Add message to inbox', async () => {
      const targetMessage = await messageHelper.findMessageItemByText(messageContent);
      await messageHelper.addMessageToInbox(targetMessage);
    });

    await AllureReporter.step('Open inbox and verify message is present in inbox', async () => {
      await messageHelper.openHeaderInboxButton();
      await messageHelper.openMessageTabInInbox();
      await messageHelper.assertMessageInInboxByContent(messageContent);
    });
  });
});
