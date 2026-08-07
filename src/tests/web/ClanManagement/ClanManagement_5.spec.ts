import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MezonCredentials } from '@/types';
import { ChannelStatus, ChannelType, ClanStatus, EventType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Categories, Invitations, and Voice Events', () => {
  const VERIFY_CHANNEL_PRESENT_STEP = 'Verify channel is present in channel list';
  const clanFactory = new ClanFactory();
  const credentials: MezonCredentials = AccountCredentials.account4;
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

  test('Verify that I can create a Private voice event in a clan', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63378',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully create a new Private voice event within a clan.
    **Test Steps:**
    1. Create a voice channel in clan
    2. Create a private text channel in clan
    3. Create new Private voice event
    4. Verify event appears in event list
    **Expected Result:** Private voice event is created and visible in the clan's event list.
  `);
    await AllureReporter.addLabels({
      tag: ['event-creation', 'Private-event', 'voice-event'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const voiceChannelName = `vc-${unique}`.slice(0, 20);
    const textChannelName = `ptc-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);

    await AllureReporter.addParameter('voiceChannelName', voiceChannelName);
    await AllureReporter.addParameter('voiceChannelType', ChannelType.VOICE);
    await AllureReporter.addParameter('voiceChannelStatus', ChannelStatus.PUBLIC);

    await AllureReporter.step(`Create new voice channel: ${voiceChannelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.VOICE, voiceChannelName, ChannelStatus.PUBLIC);
    });

    await AllureReporter.step(VERIFY_CHANNEL_PRESENT_STEP, async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(voiceChannelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.addParameter('textChannelName', textChannelName);
    await AllureReporter.addParameter('textChannelType', ChannelType.TEXT);
    await AllureReporter.addParameter('textChannelStatus', ChannelStatus.PRIVATE);

    await AllureReporter.step(`Create new private text channel: ${textChannelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, textChannelName, ChannelStatus.PRIVATE);
    });

    await AllureReporter.step(VERIFY_CHANNEL_PRESENT_STEP, async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(textChannelName);
      expect(isNewChannelPresent).toBe(true);
    });

    let res: {
      eventTopic: string;
      description?: string;
      startDate: string;
      startTime: string;
    };

    await AllureReporter.step(`Create new Private voice event in clan:`, async () => {
      await clanPage.addDataOnLocationTab(
        EventType.VOICE,
        voiceChannelName,
        ClanStatus.PRIVATE,
        textChannelName
      );
      res = await clanPage.addDataOnEventInfoTab();

      const data = {
        ...res,
        voiceChannelName,
        eventType: EventType.VOICE,
        clanStatus: ClanStatus.PRIVATE,
        textChannelName,
      };
      await clanPage.verifyDataOnReviewTab(data);
      await clanPage.clickCreateEventButton();
      await clanPage.waitForModalToBeHidden();
    });

    await AllureReporter.step('Verify event is present in event list', async () => {
      const isCreatedEvent = await clanPage.verifyLastEventData({
        eventTopic: res.eventTopic,
        description: res.description,
        voiceChannelName,
        startTime: `${res.startDate} - ${res.startTime}`,
        clanStatus: ClanStatus.PRIVATE,
        eventType: EventType.VOICE,
        textChannelName,
      });
      expect(isCreatedEvent).toBeTruthy();
    });

    await AllureReporter.step(
      'Verify event information is match in event dertail modal',
      async () => {
        const isCreatedEvent = await clanPage.verifyInEventDetailModal({
          eventTopic: res.eventTopic,
          description: res.description,
          channelName: voiceChannelName,
          startTime: `${res.startDate} - ${res.startTime}`,
        });
        expect(isCreatedEvent).toBeTruthy();
        await clanPage.closeEventModal();
      }
    );

    await AllureReporter.attachScreenshot(
      page,
      `Private Voice Event Created - ${voiceChannelName}`
    );
  });
});
