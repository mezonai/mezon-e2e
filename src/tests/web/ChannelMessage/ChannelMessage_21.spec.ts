import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import MessageSelector from '@/data/selectors/MessageSelector';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Messages - Pinned Message Banner and Navigation', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account8;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage8,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('Verify that pinning a message displays the pinned message in topic pin banner', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63852',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when a user pins a message in a channel, it displays in the topic pin banner at the top of the chat.

      **Test Steps:**
      1. Create a text channel
      2. Send a text message
      3. Pin the message via context menu
      4. Verify pinned message appears in topic pin banner
      5. Verify pinned messages modal lists the message
      6. Clean up channel

      **Expected Result:** Pinned message appears properly in the banner and pinned modal.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'pin-message', 'topic-pin-banner'],
    });

    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const messageSelector = new MessageSelector(page);
    const unique = generateRandomString(6).toLowerCase();
    const channelName = `pin-sys-${unique}`;
    const messageContent = `Important announcement to pin - ${unique}`;

    await AllureReporter.step(`Create text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step(`Send message: "${messageContent}"`, async () => {
      await messageHelper.sendTextMessage(messageContent);
    });

    await AllureReporter.step('Pin the message', async () => {
      const targetMessage = await messageHelper.findLastMessage();
      await messageHelper.pinMessage(targetMessage);
    });

    await AllureReporter.step('Verify pinned message appears in topic pin banner', async () => {
      const banner = messageSelector.topicPinBanner.container;
      await expect(banner).toBeVisible({ timeout: 5000 });
      await expect(banner).toContainText(messageContent);
    });

    await AllureReporter.step('Verify pinned message in pinned messages modal', async () => {
      await messageHelper.openPinnedMessagesModal();
      const pinItem = await messageHelper.getThePinMessageItem(messageContent);
      await expect(pinItem).toBeVisible({ timeout: 5000 });
    });
  });
});
