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

test.describe('Channel Message - Module 8', () => {
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

  test('Forward all messages to general channel and verify order and content', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63395',
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that user can forward all messages from a text channel to general channel
    and messages are displayed with correct order and content

    **Test Steps:**
    1. Create a new text channel
    2. Send 3 different messages to the channel
    3. Forward all messages to general channel
    4. Verify messages in general channel have correct order and content

    **Expected Result:** All messages are forwarded to general channel with correct order and content
  `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'forward', 'general-channel'],
    });

    const messageHelper = new MessageTestHelpers(page);
    const clanPage = new ClanPage(page);

    const unique = Date.now().toString(36);
    const channelName = `tc-${unique}`.slice(0, 20);
    const messages = [
      `Forward message 1 - ${Date.now()}`,
      `Forward message 2 - ${Date.now()}`,
      `Forward message 3 - ${Date.now()}`,
    ];

    await AllureReporter.step('Create a new text channel', async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('Send 3 messages to the text channel', async () => {
      for (const message of messages) {
        await messageHelper.sendTextMessage(message);
      }
    });

    await AllureReporter.step('Forward all messages to general channel', async () => {
      await messageHelper.forwardAllMessages('general');
    });

    await AllureReporter.step('Verify forwarded messages in general channel', async () => {
      await clanPage.openChannelByName('general');

      await messageHelper.assertMessageFromLastByIndexAndContent(2, messages[0]);
      await messageHelper.assertMessageFromLastByIndexAndContent(1, messages[1]);
      await messageHelper.assertMessageFromLastByIndexAndContent(0, messages[2]);
    });
  });

  test('Verify that user can unpin messages after pin them in a text channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63400',
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that user can unpin message after pin them in a text channel
    **Test Steps:**
    1. Create a new text channel
    2. Send a message to the channel
    3. Pin message
    4. Unpin the message
    5. Verify the message is unpinned 
    **Expected Result:** User can unpin the message
  `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'pin-unpin', 'text-channel'],
    });
    const messageHelper = new MessageTestHelpers(page);
    const messagePage = new MessagePage(page);
    const clanPage = new ClanPage(page);
    const unique = Date.now().toString(36);
    const channelName = `tc-${unique}`.slice(0, 20);
    const message = `Pin message- ${Date.now()}`;

    await AllureReporter.step('Create a new text channel', async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('Send message to the text channel', async () => {
      await messageHelper.sendTextMessage(message);
    });
    await AllureReporter.step('Pin message', async () => {
      await messagePage.pinLastMessage();
    });

    await AllureReporter.step('Unpin the message', async () => {
      await messagePage.unpinLastMessage();
    });
    await AllureReporter.step('Verify the message is unpinned', async () => {
      const isMessageUnpinned = await messagePage.verifyMessageIsUnpinned(message);
      expect(isMessageUnpinned).toBe(true);
    });
  });

  test('Verify that user can create poll in channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63400',
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that user can create poll in channel
    **Test Steps:**
    1. Create a new text channel
    2. Open poll modal
    3. Create poll with question and answers
    4. Submit poll
    5. Verify poll is displayed correctly
    **Expected Result:** User can create poll successfully
  `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'poll', 'text-channel'],
    });

    const messagePage = new MessagePage(page);
    const clanPage = new ClanPage(page);

    const unique = Date.now().toString(36);
    const channelName = `tc-${unique}`.slice(0, 20);

    const question = `Poll question ${unique}`;
    const answers = ['Answer 1', 'Answer 2', 'Answer 3'];

    await AllureReporter.step('Create a new text channel', async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step('Open poll modal', async () => {
      await messagePage.openCreatePoll();
    });

    await AllureReporter.step('Create poll', async () => {
      await messagePage.createPoll(question, answers);
    });

    await AllureReporter.step('Verify poll card', async () => {
      await messagePage.verifyPollCard(question, answers);
    });
  });

  test('Verify that user can vote on poll card', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63400',
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that user can vote on poll card
    **Test Steps:**
    1. Create a new text channel
    2. Open poll modal
    3. Create poll with question and answers
    4. Vote on an option
    5. Verify vote is applied
    **Expected Result:** User can vote successfully
  `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'poll', 'vote'],
    });

    const messagePage = new MessagePage(page);
    const clanPage = new ClanPage(page);

    const unique = Date.now().toString(36);
    const channelName = `tc-${unique}`.slice(0, 20);

    const question = `Poll question ${unique}`;
    const answers = ['Answer 1', 'Answer 2', 'Answer 3'];

    await AllureReporter.step('Create a new text channel', async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step('Create poll', async () => {
      await messagePage.openCreatePoll();
      await messagePage.createPoll(question, answers);
      await messagePage.verifyPollCard(question, answers);
    });

    await AllureReporter.step('Vote on poll', async () => {
      await messagePage.votePollByIndex(0);
    });

    await AllureReporter.step('Verify voted state', async () => {
      await messagePage.verifyUserVoted(0);
    });
  });

  test('Verify that user can end poll', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63401',
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that user can end poll
    **Test Steps:**
    1. Create a new text channel
    2. Create poll
    3. Right click on poll card
    4. Click "End Poll Now"
    5. Verify poll is ended
    **Expected Result:** Poll is ended successfully
  `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'poll', 'end'],
    });

    const messagePage = new MessagePage(page);
    const clanPage = new ClanPage(page);

    const unique = Date.now().toString(36);
    const channelName = `tc-${unique}`.slice(0, 20);

    const question = `Poll question ${unique}`;
    const answers = ['Answer 1', 'Answer 2', 'Answer 3'];

    await AllureReporter.step('Create a new text channel', async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step('Create poll', async () => {
      await messagePage.openCreatePoll();
      await messagePage.createPoll(question, answers);
      await messagePage.verifyPollCard(question, answers);
    });

    await AllureReporter.step('End poll', async () => {
      await messagePage.endPoll();
    });

    await AllureReporter.step('Verify poll ended', async () => {
      await messagePage.verifyPollEnded();
    });
  });
});
