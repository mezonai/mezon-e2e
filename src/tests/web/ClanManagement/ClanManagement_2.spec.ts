import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import ClanSelector from '@/data/selectors/ClanSelector';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MezonCredentials } from '@/types';
import { ChannelStatus, ChannelType, ClanStatus, EventType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Module 2', () => {
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

  test('Verify that I can create a public location event in a clan', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64056',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully create a new public location event within a clan.
    **Test Steps:**
      1. Create new public location event
      2. Verify event appears in event list
    **Expected Result:**Public Location event is created and visible in the clan's event list.
  `);
    await AllureReporter.addLabels({
      tag: ['event-creation', 'Public-event', 'location-event'],
    });

    const clanPage = new ClanPage(page);
    const clanSelector = new ClanSelector(page);
    const unique = Date.now().toString(36).slice(-6);
    const locationName = `location name - ${unique}`;
    let res: {
      eventTopic: string;
      description?: string;
      startDate: string;
      startTime: string;
    };

    await AllureReporter.step(`Create new public location event in clan:`, async () => {
      await clanPage.addDataOnLocationTab(EventType.LOCATION, locationName, ClanStatus.PUBLIC);
      res = await clanPage.addDataOnEventInfoTab();

      const data = {
        ...res,
        locationName,
        eventType: EventType.LOCATION,
        clanStatus: ClanStatus.PUBLIC,
      };
      await clanPage.verifyDataOnReviewTab(data);
      await clanSelector.eventModal.createEventButton.click();
      await clanPage.waitForModalToBeHidden();
    });

    await AllureReporter.step('Verify event is present in event list', async () => {
      const isCreatedEvent = await clanPage.verifyLastEventData({
        eventTopic: res.eventTopic,
        description: res.description,
        voiceChannelName: locationName,
        startTime: `${res.startDate} - ${res.startTime}`,
        clanStatus: ClanStatus.PUBLIC,
        eventType: EventType.LOCATION,
      });
      expect(isCreatedEvent).toBeTruthy();
    });

    await AllureReporter.step(
      'Verify event information is match in event dertail modal',
      async () => {
        const isCreatedEvent = await clanPage.verifyInEventDetailModal({
          eventTopic: res.eventTopic,
          description: res.description,
          channelName: locationName,
          startTime: `${res.startDate} - ${res.startTime}`,
        });
        expect(isCreatedEvent).toBeTruthy();
        await clanPage.closeEventModal();
      }
    );

    await AllureReporter.attachScreenshot(page, `Public location Event Created - ${locationName}`);
  });

  test('Verify that I can create a private location event in a clan', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64056',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully create a new private location event within a clan.
    **Test Steps:**
      1. Create a private text channel in clan
      2. Create new private location event
      3. Verify event appears in event list
    **Expected Result:**Private Location event is created and visible in the clan's event list.
  `);
    await AllureReporter.addLabels({
      tag: ['event-creation', 'Private-event', 'location-event'],
    });

    const clanPage = new ClanPage(page);
    const clanSelector = new ClanSelector(page);
    const unique = Date.now().toString(36).slice(-6);
    const textChannelName = `ptc-${unique}`.slice(0, 20);
    const locationName = `location name - ${unique}`;

    await AllureReporter.addParameter('textChannelName', textChannelName);
    await AllureReporter.addParameter('textChannelType', ChannelType.TEXT);
    await AllureReporter.addParameter('textChannelStatus', ChannelStatus.PRIVATE);

    await AllureReporter.step(`Create new private text channel: ${textChannelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, textChannelName, ChannelStatus.PRIVATE);
    });

    await AllureReporter.step('Verify channel is present in channel list', async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(textChannelName);
      expect(isNewChannelPresent).toBe(true);
    });

    let res: {
      eventTopic: string;
      description?: string;
      startDate: string;
      startTime: string;
    };

    await AllureReporter.step(`Create new private location event in clan:`, async () => {
      await clanPage.addDataOnLocationTab(
        EventType.LOCATION,
        locationName,
        ClanStatus.PRIVATE,
        textChannelName
      );
      res = await clanPage.addDataOnEventInfoTab();

      const data = {
        ...res,
        locationName,
        eventType: EventType.LOCATION,
        clanStatus: ClanStatus.PRIVATE,
        textChannelName,
      };
      await clanPage.verifyDataOnReviewTab(data);
      await clanSelector.eventModal.createEventButton.click();
      await clanPage.waitForModalToBeHidden();
    });

    await AllureReporter.step('Verify event is present in event list', async () => {
      const isCreatedEvent = await clanPage.verifyLastEventData({
        eventTopic: res.eventTopic,
        description: res.description,
        voiceChannelName: locationName,
        startTime: `${res.startDate} - ${res.startTime}`,
        clanStatus: ClanStatus.PRIVATE,
        eventType: EventType.LOCATION,
        textChannelName,
      });
      expect(isCreatedEvent).toBeTruthy();
    });

    await AllureReporter.step(
      'Verify event information is match in event detail modal',
      async () => {
        const isCreatedEvent = await clanPage.verifyInEventDetailModal({
          eventTopic: res.eventTopic,
          description: res.description,
          channelName: locationName,
          startTime: `${res.startDate} - ${res.startTime}`,
        });
        expect(isCreatedEvent).toBeTruthy();
        await clanPage.closeEventModal();
      }
    );

    await AllureReporter.attachScreenshot(page, `Private location Event Created - ${locationName}`);
  });

  test('Verify that I can create a private event in a clan', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64056',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully create a new private event within a clan.
    **Test Steps:**
      1. Create new private event
      2. Verify event appears in event list
    **Expected Result:**Private event is created and visible in the clan's event list.
  `);
    await AllureReporter.addLabels({
      tag: ['event-creation', 'Private-event'],
    });

    const clanPage = new ClanPage(page);
    const clanSelector = new ClanSelector(page);
    let res: {
      eventTopic: string;
      description?: string;
      startDate: string;
      startTime: string;
    };

    await AllureReporter.step(`Create new private location event in clan:`, async () => {
      await clanPage.addDataOnLocationTab(EventType.PRIVATE);
      res = await clanPage.addDataOnEventInfoTab();

      const data = {
        ...res,
        eventType: EventType.PRIVATE,
      };
      await clanPage.verifyDataOnReviewTab(data);
      await clanSelector.eventModal.createEventButton.click();
      await clanPage.waitForModalToBeHidden();
    });
    await AllureReporter.step('Verify event is present in event list', async () => {
      const isCreatedEvent = await clanPage.verifyLastEventData({
        eventTopic: res.eventTopic,
        description: res.description,
        startTime: `${res.startDate} - ${res.startTime}`,
        eventType: EventType.PRIVATE,
      });
      expect(isCreatedEvent).toBeTruthy();
    });

    await AllureReporter.step(
      'Verify event information is match in event dertail modal',
      async () => {
        const isCreatedEvent = await clanPage.verifyInEventDetailModal({
          eventTopic: res.eventTopic,
          description: res.description,
          startTime: `${res.startDate} - ${res.startTime}`,
        });
        expect(isCreatedEvent).toBeTruthy();
        await clanPage.closeEventModal();
      }
    );

    await AllureReporter.attachScreenshot(page, `Private Event Created`);
  });

  test('Verify that number of channels is true', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63381',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that total channels is true on channel management tab.
    **Test Steps:**
      1. Create channel on clan
      2. Count number of the channels
      2. Verify number of channels is match on channel management tab
    **Expected Result:** Number of channels is true.
  `);
    await AllureReporter.addLabels({
      tag: ['channel_management', 'count_number'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const channelName = `vc-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('channelType', ChannelType.VOICE);
    await AllureReporter.addParameter('channelStatus', ChannelStatus.PUBLIC);

    await AllureReporter.step(`Create new public voice channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.VOICE, channelName, ChannelStatus.PUBLIC);
    });

    await AllureReporter.step('Verify channel is present in channel list', async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step(
      'Verify number of channels in channels list match in channel management',
      async () => {
        await page.reload();
        await page.waitForTimeout(2000);
        const countNumbersOfChannels = await clanPage.countChannelsOnChannelList();
        const res = await clanPage.getTotalChannels();
        expect(countNumbersOfChannels).toBe(res.totalChannels);
        expect(countNumbersOfChannels).toBe(res.countChannelItems);
      }
    );

    await AllureReporter.attachScreenshot(page, `Number of channels is true`);
  });

  test('Verify number of messages is true for each channel on channel management tab', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63381',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that number of messages is true for each channel on channel management tab.
    **Test Steps:**
      1. Create text channel on clan
      2. Send message
      3. Count number of the message
      2. Verify number of messages is match for each channel on channel management tab
    **Expected Result:** Number of messages is true.
  `);
    await AllureReporter.addLabels({
      tag: ['channel_management', 'messages_count'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const channelName = `tc-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);
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

    await AllureReporter.step('Send messages on channel', async () => {
      const messageHelper = new MessageTestHelpers(page);
      const messageCount = Math.floor(Math.random() * 5) + 1;

      for (let i = 0; i < messageCount; i++) {
        const testMessage = `Test message ${i + 1} - ${Date.now()}`;
        await messageHelper.sendTextMessage(testMessage);
      }
    });

    await AllureReporter.step(
      'Verify number of messages in channel is match in channel management',
      async () => {
        await page.reload();
        await page.waitForTimeout(2000);
        const countNumbersOfMessages = await clanPage.countMessagesOnChannel();
        const totalMessages = await clanPage.getTotalMessages(channelName);
        expect(countNumbersOfMessages).toBe(totalMessages);
      }
    );

    await AllureReporter.attachScreenshot(page, `Number of messages is true`);
  });
});
