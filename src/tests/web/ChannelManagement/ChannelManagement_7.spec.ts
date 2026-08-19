import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Management - Stream Channel Chat', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account1;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => AuthHelper.logout(page));

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('Verify that user can send a message in a stream channel without joining', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify a user can send a chat message in a stream channel without joining the stream.

      **Test Steps:**
      1. Create a stream channel
      2. Click the stream channel name in the channel list
      3. Click the stream chat icon
      4. Send a text message in the chat panel
      5. Verify the message is displayed

      **Expected Result:** The message is sent successfully without the user joining the stream.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-management', 'stream-channel', 'text-message', 'chat-box'],
    });

    const clanPage = new ClanPage(page);
    const unique = Date.now().toString(36).slice(-6);
    const channelName = `stream-${unique}`;
    const message = `Stream message ${unique}`;

    await AllureReporter.step(`Create stream channel: ${channelName}`, async () => {
      expect(await clanPage.createNewChannel(ChannelType.STREAM, channelName)).toBe(true);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step(
      'Open the stream chat and send a message without joining',
      async () => {
        await clanPage.sendMessageInStreamChannel(channelName, message);
      }
    );

    await AllureReporter.attachScreenshot(page, 'Message sent in stream channel chat');
  });
});
