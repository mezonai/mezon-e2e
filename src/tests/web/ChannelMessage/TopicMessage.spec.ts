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
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { expect, Locator } from '@playwright/test';
import { randomInt } from 'crypto';

test.describe('Topic Messages - Initial Message Actions, Counts, Replies, and Navigation', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account8;
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
      await page.waitForTimeout(2000);
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

  test('Verify that should not lost init message when reply in topic', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64919',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
        **Test Objective:** Verify that should not lost init message when reply in topic
        **Test Steps:**
          1. Send message
          2. Reply message last message
          3. Create topic on last message send message on topic box
          4. Verify replied message is not lost in main chat and message in topic box is lost
          5. Reload page and verify again.
        **Expected Result:** Verify that should not lost init message when reply in topic
      `);
    await AllureReporter.addLabels({
      tag: ['topic_message', 'reply_message', 'init_message'],
    });
    const originalMessage = `Original message - ${generateRandomString(10)}`;
    const replyMessage = `Reply message - ${generateRandomString(10)}`;
    const messageHelper = new MessageTestHelpers(page);

    await AllureReporter.step('Send message', async () => {
      await messageHelper.sendTextMessage(originalMessage);
    });

    await AllureReporter.step('Reply message last message', async () => {
      const lastMessage = await messageHelper.findLastMessage();
      await messageHelper.replyToMessage(lastMessage, replyMessage);
    });

    await AllureReporter.step('Create topic on last message', async () => {
      await messageHelper.createTopicToInitMessage(replyMessage);
    });

    await AllureReporter.step(
      'Verify replied message is not lost in main chat and message in topic box is lost',
      async () => {
        await messageHelper.openTopicBoxByMessage(replyMessage);
        await messageHelper.verifyReplyMessageIsVisibleInTopicBox(replyMessage);
        await messageHelper.closeTopicBox();
        await messageHelper.verifyReplyMessageIsVisibleInMainChat();
      }
    );

    await AllureReporter.step('Reload page and verify again', async () => {
      await page.reload();
      await messageHelper.verifyReplyMessageIsVisibleInMainChat();
      await messageHelper.openTopicBoxByMessage(replyMessage);
      await messageHelper.verifyReplyMessageIsVisibleInTopicBox(replyMessage);
    });

    await AllureReporter.attachScreenshot(
      page,
      `Replying message on init message topic is not lost`
    );
  });

  test('Verify that user can jump to topic box when click from inbox popover', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64315',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
        **Test Objective:** Verify that user can jump to topic box when click from inbox popover
        **Test Steps:**
          1. Send message on channel
          2. Create topic on created message
          3. Send messages on topic box
          4. Open inbox popover 
          5. Click topic tab
          6. Click created topic on inbox popover 

        **Expected Result:** User can jump to topic box when click from inbox popover
      `);
    await AllureReporter.addLabels({
      tag: ['topic_message', 'inbox_popover', 'topic_tab'],
    });

    const messageHelper = new MessageTestHelpers(page);
    const testMessage = `Test message - ${Date.now()}`;
    const replyMessage = `Message in topic box ${Date.now()}`;
    let topicLocator: Locator;

    await AllureReporter.step('Send messages on channel and create topic', async () => {
      await messageHelper.sendTextMessage(testMessage);
      await messageHelper.createTopicToInitMessage(testMessage);
    });

    await AllureReporter.step('Send messages on topic box', async () => {
      await messageHelper.openTopicBoxByMessage(testMessage);
      await messageHelper.sendMessageInTopicBox(replyMessage);
      await page.waitForTimeout(2000);
      await messageHelper.closeTopicBox();
    });

    await AllureReporter.step('Open inbox popover and topic tab', async () => {
      await messageHelper.openHeaderInboxButton();
      await messageHelper.openTopicTabOnInboxPopover();
    });

    await AllureReporter.step('Verify that created topic is visible on topic tab', async () => {
      const locator = await messageHelper.verifyCreatedTopicOnInboxPopover(
        testMessage,
        replyMessage
      );
      topicLocator = locator;
    });

    await AllureReporter.step(
      'Click created topic and verify it jump to created topic',
      async () => {
        await messageHelper.clickJumpToTopicFromInboxPopover(topicLocator);
        await messageHelper.verifyCreatedTopicIsOpen(testMessage, replyMessage);
      }
    );

    await AllureReporter.attachScreenshot(
      page,
      `User can jump to topic box when click from inbox popover`
    );
  });
});
