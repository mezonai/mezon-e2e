import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, GLOBAL_CONFIG } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ROUTES } from '@/selectors';
import { MezonCredentials } from '@/types';
import { ChannelStatus, ChannelType, ClanStatus, EventType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management', () => {
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

  test('Verify that I can create a public category', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new public category within a clan.
      
      **Test Steps:**
      1. Generate unique category name
      2. Create new public category
      3. Verify category appears in category list
      
      **Expected Result:** Public category is created and visible in the clan's category list.
    `);

    await AllureReporter.addLabels({
      tag: ['category-creation', 'public-category'],
    });

    const categoryPublicName = `category-public-${new Date().getTime()}`;
    const categoryPage = new ClanMenuPanel(page);

    await AllureReporter.addParameter('categoryName', categoryPublicName);
    await AllureReporter.addParameter('categoryType', 'public');

    await AllureReporter.step(`Create new public category: ${categoryPublicName}`, async () => {
      await categoryPage.createCategory(categoryPublicName);
    });

    await AllureReporter.step('Verify category is present in category list', async () => {
      const isCreatedCategory = await categoryPage.isCategoryPresent(categoryPublicName);
      expect(isCreatedCategory).toBeTruthy();
    });

    await AllureReporter.attachScreenshot(page, `Public Category Created - ${categoryPublicName}`);
  });

  test('Verify that I can invite people to a clan from sidebar', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63379',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully invite people to a clan from sidebar.

    **Test Steps:**
    1. Open invite people dialog
    2. Pick first user on list
    3. Send invitation
    4. Verify invitation is sent

    **Expected Result:** Invitation is successfully sent to the user.
  `);

    await AllureReporter.addLabels({
      tag: ['invite-people', 'user-invitations'],
    });

    const clanPage = new ClanPage(page);

    await AllureReporter.step('Open invite people dialog', async () => {
      await clanPage.clickButtonInvitePeopleFromMenu();
    });

    const inviteResult = await AllureReporter.step('Send invitation via modal', async () => {
      return await clanPage.sendInviteOnModal();
    });

    expect(inviteResult.success).toBeTruthy();

    await AllureReporter.step('Navigate to direct friends page', async () => {
      await page.goto(joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS));
    });

    await AllureReporter.step(`Open DM with invited user`, async () => {
      await clanPage.openDirectMessageWithUser(inviteResult.username!);
    });

    await AllureReporter.step('Verify last message in DM equals urlInvite', async () => {
      const messageHelper = new MessageTestHelpers(page);
      const lastMessage = await messageHelper.getLastMessageInChat();
      const isMatch = lastMessage.includes(inviteResult.urlInvite ?? '');
      expect(isMatch).toBeTruthy();
      return isMatch;
    });

    await AllureReporter.attachScreenshot(page, 'Invite People Sent');
  });

  test('Verify that I can invite people to a clan from channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63380',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully invite people to a clan from a channel.
    **Test Steps:**
    1. create a channel in clan
    2. Open invite people dialog from channel
    3. Pick first user on list
    4. Send invitation
    5. Verify invitation is sent
    **Expected Result:** Invitation is successfully sent to the user.
  `);
    await AllureReporter.addLabels({
      tag: ['invite-people', 'user-invitations'],
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

    await AllureReporter.step('Open invite people dialog from channel', async () => {
      await clanPage.clickButtonInvitePeopleFromChannel();
    });
    const inviteResult = await AllureReporter.step('Send invitation via modal', async () => {
      return await clanPage.sendInviteOnModal();
    });
    expect(inviteResult.success).toBeTruthy();
    await AllureReporter.step('Navigate to direct friends page', async () => {
      await page.goto(joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS));
    });
    await AllureReporter.step(`Open DM with invited user`, async () => {
      await clanPage.openDirectMessageWithUser(inviteResult.username!);
    });
    await AllureReporter.step('Verify last message in DM equals urlInvite', async () => {
      const messageHelper = new MessageTestHelpers(page);
      const lastMessage = await messageHelper.getLastMessageInChat();
      const isMatch = lastMessage.includes(inviteResult.urlInvite ?? '');
      expect(isMatch).toBeTruthy();
      return isMatch;
    });
  });

  test('Verify that I can create a public voice event in a clan', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63378',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully create a new public voice event within a clan.
    **Test Steps:**
    1. Create a voice channel in clan
    2. Create new public voice event
    3. Verify event appears in event list
    **Expected Result:** Public voice event is created and visible in the clan's event list.
  `);
    await AllureReporter.addLabels({
      tag: ['event-creation', 'public-event', 'voice-event'],
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

    let res: {
      eventTopic: string;
      description?: string;
      startDate: string;
      startTime: string;
    };

    await AllureReporter.step(`Create new public voice event in clan:`, async () => {
      await clanPage.addDataOnLocationTab(EventType.VOICE, channelName);
      res = await clanPage.addDataOnEventInfoTab();

      const data = {
        ...res,
        channelName: channelName,
        eventType: EventType.VOICE,
      };
      await clanPage.verifyDataOnReviewTab(data);
      await clanPage.eventModal.createEventButton.click();
      await clanPage.waitForModalToBeHidden();
    });

    await AllureReporter.step('Verify event is present in event list', async () => {
      const isCreatedEvent = await clanPage.verifyLastEventData({
        eventTopic: res.eventTopic,
        description: res.description,
        voiceChannelName: channelName,
        startTime: `${res.startDate} - ${res.startTime}`,
        clanStatus: ClanStatus.PUBLIC,
        eventType: EventType.VOICE,
      });
      expect(isCreatedEvent).toBeTruthy();
    });

    await AllureReporter.step(
      'Verify event information is match in event dertail modal',
      async () => {
        const isCreatedEvent = await clanPage.verifyInEventDetailModal({
          eventTopic: res.eventTopic,
          description: res.description,
          channelName: channelName,
          startTime: `${res.startDate} - ${res.startTime}`,
        });
        expect(isCreatedEvent).toBeTruthy();
        await clanPage.closeEventModal();
      }
    );

    await AllureReporter.attachScreenshot(page, `Public Voice Event Created - ${channelName}`);
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

    await AllureReporter.step('Verify channel is present in channel list', async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(voiceChannelName);
      expect(isNewChannelPresent).toBe(true);
    });

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
      await clanPage.eventModal.createEventButton.click();
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
