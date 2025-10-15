import AllureConfig from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/ClanPage';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { expect } from '@playwright/test';

test.describe('Topic message', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials['account2-5'];
  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.topicMessage,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '64267',
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

  test('Verify that button edit is hidden on init topic message', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64267',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
        **Test Objective:** Verify that button edit is hidden on init topic message.
        **Test Steps:**
          1. Create text channel on clan
          2. Send message
          3. Create topic on created message
          2. Verify that edit button not visible when hover on message
          2. Click right => Verify that edit button not visible on modal
        **Expected Result:** Verify that button edit is hidden on init topic message.
      `);
    await AllureReporter.addLabels({
      tag: ['topic_message', 'edit_button'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const channelName = `tc-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const testMessage = `Test message - ${Date.now()}`;
    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('channelType', ChannelType.TEXT);
    await AllureReporter.addParameter('channelStatus', ChannelStatus.PUBLIC);

    await AllureReporter.step(`Create new public text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC);
    });

    await AllureReporter.step('Verify channel is present in channel list', async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('Send messages on channel and create topic', async () => {
      await messageHelper.sendTextMessage(testMessage);
      await messageHelper.createTopicToInitMessage(testMessage);
    });

    await AllureReporter.step(
      'Edit button is hidden when hover to topic message init',
      async () => {
        await messageHelper.verifyEditButtonIsHiddenWhenHover(testMessage);
      }
    );

    await AllureReporter.step(
      'Edit button is hidden on modal when click right to topic message init',
      async () => {
        await messageHelper.verifyEditButtonIsHiddenWhenClickRight(testMessage);
      }
    );

    await AllureReporter.attachScreenshot(page, `Edit button is hidden`);
  });
});
