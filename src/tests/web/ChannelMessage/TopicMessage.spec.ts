import AllureConfig from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { expect } from '@playwright/test';
import { randomInt } from 'crypto';

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
          4. Verify that edit button not visible when hover on message
          5. Click right => Verify that edit button not visible on modal
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

  test('Verify that button delete is hidden on init topic message', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64267',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
        **Test Objective:** Verify that display name on init topic message is match with updated clan nickname and button delete is hidden on init topic message.
        **Test Steps:**
          1. Create text channel on clan
          2. Update clan nickname
          3. Send message
          4. Create topic on created message
          5. Verify display name on init topic message is match with updated clan nickname
          6. Click right => Verify that delete button not visible on modal
        **Expected Result:** Verify that display name on init topic message is match with updated clan nickname and button delete is hidden on init topic message.
      `);
    await AllureReporter.addLabels({
      tag: ['topic_message', 'delete_button', 'init_message', 'display_name'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const channelName = `tc-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const testMessage = `Test message - ${Date.now()}`;
    const nickname = `nn-${unique}`.slice(0, 20);
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

    await AllureReporter.step('Update new nickname setting on clan profile', async () => {
      const profilePage = new ProfilePage(page);
      await profilePage.updateClanNickname(nickname);
    });

    await AllureReporter.step('Send messages on channel and create topic', async () => {
      await messageHelper.sendTextMessage(testMessage);
      await messageHelper.createTopicToInitMessage(testMessage);
    });

    await AllureReporter.step(
      'Verify that nickname for init topic message on topic box is match with nickname setting on clan',
      async () => {
        await page.reload();
        await page.waitForTimeout(2000);
        await messageHelper.verifyNameOnInitTopicMessageIsMatchWithClanSetting(
          nickname,
          testMessage
        );
      }
    );

    await AllureReporter.step(
      'Delete button is hidden on modal when click right to topic message init',
      async () => {
        await messageHelper.verifyDeleteButtonIsHiddenWhenClickRight(testMessage);
      }
    );

    await AllureReporter.attachScreenshot(
      page,
      `Display name on init topic message is match with updated clan nickname and detele button is hidden`
    );
  });

  test('Verify that number of topic messages is match on topic box', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64315',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
        **Test Objective:** Verify that number of topic messages is match on topic box
        **Test Steps:**
          1. Create text channel on clan
          2. Send message
          3. Create topic on created message
          4. Send messages on topic box
        **Expected Result:** Verify that number of topic messages is match on topic box
      `);
    await AllureReporter.addLabels({
      tag: ['topic_message', 'count-number'],
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
    const messagesToSend = randomInt(2, 6);

    await AllureReporter.step('Send messages on topic box', async () => {
      await messageHelper.openTopicBoxByMessage(testMessage);
      for (let i = 0; i < messagesToSend; i++) {
        const message = `Message in topic box ${i + 1} - ${Date.now()}`;
        await messageHelper.sendMessageInTopicBox(message);
      }
      await page.waitForTimeout(2000);
      await messageHelper.closeTopicBox();
    });

    await AllureReporter.step('Count number of messages in topic box and verify', async () => {
      const totalTopicMessages = await messageHelper.getTotalTopicMessages(testMessage);
      expect(totalTopicMessages).toBe(messagesToSend + 1);
    });

    await AllureReporter.attachScreenshot(page, `Number of topic messages is match on topic box`);
  });
});
