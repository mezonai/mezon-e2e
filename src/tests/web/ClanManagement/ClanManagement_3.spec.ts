import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanSettingsPage } from '@/pages/ClanSettingsPage';
import { MessagePage } from '@/pages/MessagePage';
import { MezonCredentials } from '@/types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Module 3', () => {
  const clanFactory = new ClanFactory();
  const credentials: MezonCredentials = AccountCredentials.account3;
  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.clanManagement2,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63510',
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

  test('Verify that I can create a webhook when standing at Channels or Members page', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64201',
      github_issue: '9769',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully create a new webhook when standing at Channels or Members page.
        **Test Steps:**
          1. Go to Channels or Members page
          2. Open Clan settings page
          3. Open Integrations tab
          4. Click on Create webhook button
          5. Click on New webhook button
          6. Verify webhook is created
        **Expected Result:** Webhook is created.
  `);
    await AllureReporter.addLabels({
      tag: ['webhook_creation', 'channels_members_page'],
    });

    const clanSettingsPage = new ClanSettingsPage(page);
    const clanPage = new ClanPage(page);

    await AllureReporter.step('Go to Channels page', async () => {
      await clanPage.gotoChannelManagementPage();
    });

    await AllureReporter.step('Open Integrations tab', async () => {
      await clanSettingsPage.openIntegrationsTab();
    });

    await AllureReporter.step('Create webhook', async () => {
      await clanSettingsPage.createWebhook();
    });

    await AllureReporter.step('Verify webhook is created', async () => {
      const isWebhookCreated = await clanSettingsPage.verifyWebhookCreated();
      expect(isWebhookCreated).toBe(true);
    });
  });

  test('Verify that favorite channel unmarkable', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64675',
      github_issue: '9791',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that favorite channel unmarkable.
          **Test Steps:**
            1. Mark the general channel as favorite
            2. Verify the general channel is marked as favorite
            3. Unmark the general channel
            4. Verify the general channel is not marked as favorite
          **Expected Result:** The general channel is not marked as favorite.
    `);

    await AllureReporter.addLabels({
      tag: ['favorite-channel', 'unmarkable'],
    });

    const clanPage = new ClanPage(page);

    await AllureReporter.step('Mark the general channel as favorite', async () => {
      await clanPage.markChannelAsFavorite('general');
    });

    await AllureReporter.step('Verify the general channel is marked as favorite', async () => {
      await clanPage.verifyChannelIsMarkedAsFavorite('general');
    });

    await AllureReporter.step('Unmark the general channel', async () => {
      await clanPage.unmarkChannelAsFavorite('general');
    });

    await AllureReporter.step('Verify the general channel is not marked as favorite', async () => {
      await clanPage.verifyChannelIsUnmarkedAsFavorite('general');
    });
  });

  test('Verify that can jump to pinned message when user in canvas', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64793',
      github_issue: '10006',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that can jump to pinned message when user in canvas.
          **Test Steps:**
            1. Send a message
            2. Pin the message
            3. Create a canvas
            4. Fill canvas title & content
            5. Open pinned messages modal and jump to the message
            6. Verify the message is visible in the main chat
          **Expected Result:** Message is visible in the main chat and is highlighted.
    `);

    await AllureReporter.addLabels({
      tag: ['canvas', 'jump-to-pinned-message'],
    });

    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);

    const originalMessage = `original message - ${generateRandomString(10)}`;
    const canvasTitle = `canvas title - ${generateRandomString(10)}`;
    const canvasContent = `canvas content - ${generateRandomString(10)}`;

    await AllureReporter.step('Send a message', async () => {
      await messageHelper.sendTextMessage(originalMessage);
    });

    await AllureReporter.step('Pin the message', async () => {
      await messageHelper.pinLastMessage();
    });

    await AllureReporter.step('Create a canvas', async () => {
      await clanPage.openCanvasManagementModal();
      await clanPage.createCanvas();
      await clanPage.fillCanvasTitle(canvasTitle);
      await clanPage.fillCanvasContent(canvasContent);
      await clanPage.saveCanvas();
    });

    await AllureReporter.step('Open pinned messages modal and jump to the message', async () => {
      await messageHelper.openPinnedMessagesModal();
      await messageHelper.clickJumpToMessage(originalMessage);
      await messageHelper.verifyMessageIsHighlighted(originalMessage);
      const isMessageVisible = await messageHelper.verifyMessageVisibleInMainChat(originalMessage);
      expect(isMessageVisible).toBeTruthy();
    });
  });

  test('Verify that display correct username on input chat on short profile', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64877',
      github_issue: '10354',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that display correct username on input chat on short profile.
          **Test Steps:**
            1. Send message
            2. Verify on short profile after click name above message
            3. Verify on short profile after click mention username
            4. Verify on short profile after click user in member list
            5. Verify on short profile after click footer profile
            6. Verify on short profile after click user in replied message
          **Expected Result:** On short profile, display correct username in input chat.
    `);

    await AllureReporter.addLabels({
      tag: ['short-profile', 'input-chat', 'username'],
    });

    const clanPage = new ClanPage(page);
    const messagePage = new MessagePage(page);
    const messageHelper = new MessageTestHelpers(page);
    const username = 'thang.thieuquang';

    await AllureReporter.step('Send message mention username', async () => {
      await messagePage.mentionByText(username);
    });

    await AllureReporter.step(
      'Verify on short profile after click name above message',
      async () => {
        const lastUserSendMessage = await messagePage.getLastUserSendMessage();
        await lastUserSendMessage.click();
        await messagePage.verifyShortProfileUsernameWithInputChat();
      }
    );

    await AllureReporter.step('Verify on short profile after click mention username', async () => {
      const mentionItem = await messageHelper.getMentionItemLocator(username);
      await mentionItem.click();
      await messagePage.verifyShortProfileUsernameWithInputChat();
    });

    await AllureReporter.step(
      'Verify on short profile after click user in member list',
      async () => {
        await clanPage.openMemberList();
        const memberItem = await clanPage.getMemberItemIn2ndSideBarbyUsername(username);
        await memberItem.click();
        await messagePage.verifyShortProfileUsernameWithInputChat();
      }
    );

    await AllureReporter.step('Verify on short profile after click footer profile', async () => {
      const footerProfile = await messagePage.getFooterAvatar();
      await footerProfile.click();
      await messagePage.verifyShortProfileUsernameWithInputChat();
    });

    await AllureReporter.step(
      'Verify on short profile after click user in replied message',
      async () => {
        const lastMessage = await messagePage.getLastMessage();
        await messageHelper.replyToMessage(lastMessage, 'replied message');
        const lastRepliedMessageUsername =
          await messageHelper.getLastRepliedMessageUsernameLocator();
        await lastRepliedMessageUsername.click();
        await messagePage.verifyShortProfileUsernameWithInputChat();
      }
    );
  });

  test('Verify that user can delete canvas', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64917',
      github_issue: '10355',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can delete canvas.
          **Test Steps:**
            1. Create a canvas
            2. Fill canvas title & content
            3. Delete the canvas
            4. Verify the canvas is deleted
          **Expected Result:** The canvas is deleted and not visible in the channel.
    `);

    await AllureReporter.addLabels({
      tag: ['canvas', 'delete-canvas'],
    });

    const clanPage = new ClanPage(page);
    const canvasTitle = `canvas title - ${generateRandomString(10)}`;
    const canvasContent = `canvas content - ${generateRandomString(10)}`;

    await AllureReporter.step('Create a canvas', async () => {
      await clanPage.openCanvasManagementModal();
      await clanPage.createCanvas();
      await clanPage.fillCanvasTitle(canvasTitle);
      await clanPage.fillCanvasContent(canvasContent);
      await clanPage.saveCanvas();
    });

    await AllureReporter.step('Delete the canvas', async () => {
      await clanPage.openCanvasManagementModal();
      await clanPage.deleteCanvas(canvasTitle);
    });

    await AllureReporter.step('Verify the canvas is deleted', async () => {
      const isCanvasVisible = await clanPage.assertCanvasContent(canvasTitle, canvasContent, false);
      expect(isCanvasVisible).toBeFalsy();
    });
  });
});
