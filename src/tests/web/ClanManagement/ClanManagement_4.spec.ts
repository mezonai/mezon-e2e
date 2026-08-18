import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { CLAN_MANAGEMENT_TAG, PUBLIC_CHANNELS_CATEGORY_NAME } from '@/constants/ClanManagement';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ToastSelector } from '@/data/selectors/ToastSelector';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { MezonCredentials } from '@/types';
import { ChannelStatus, ChannelType, ClanStatus, EventType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Events and Category Updates', () => {
  const VERIFY_CHANNEL_PRESENT_STEP = 'Verify channel is present in channel list';
  const EVENT_CREATION_TAG = 'event-creation';
  const clanFactory = new ClanFactory();
  const credentials: MezonCredentials = AccountCredentials.account4;
  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.clanManagement4,
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

  test('Verify that user can cancel created event and event is removed from the list of events', async ({
    page,
  }) => {
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
        3. Cancel created event
        4. Verify that event is removed from the list of events
    **Expected Result:**Public Location event is created and visible in the clan's event list.
  `);
    await AllureReporter.addLabels({
      tag: [EVENT_CREATION_TAG, 'Public-event', 'location-event'],
    });

    const clanPage = new ClanPage(page);

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
      await clanPage.clickCreateEventButton();
    });

    await AllureReporter.step(
      'Cancel created event and verify that event is removed from the list of events',
      async () => {
        await clanPage.cancelEvent();
      }
    );
  });

  test('Verify that user can share event details using "Share" functionality', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64057',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully share event details using the "Share" functionality.
    **Test Steps:**
      1. Create new public location event
      2. Click "Share" button for the created event
    **Expected Result:** The event link is copied to the clipboard, and a confirmation message is displayed.
  `);
    await AllureReporter.addLabels({
      tag: [EVENT_CREATION_TAG, 'share-event', 'Public-event'],
    });

    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const messagePage = new MessagePage(page);

    const unique = Date.now().toString(36).slice(-6);
    let res: {
      eventTopic: string;
      description?: string;
      startDate: string;
      startTime: string;
    };

    const channelName = `vc-${unique}`.slice(0, 20);

    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('channelType', ChannelType.VOICE);
    await AllureReporter.addParameter('channelStatus', ChannelStatus.PUBLIC);

    await AllureReporter.step(`Create new public voice channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.VOICE, channelName, ChannelStatus.PUBLIC);
    });

    await AllureReporter.step(VERIFY_CHANNEL_PRESENT_STEP, async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step(`Create new public voice event in clan:`, async () => {
      await clanPage.addDataOnLocationTab(EventType.VOICE, channelName);
      res = await clanPage.addDataOnEventInfoTab();

      const data = {
        ...res,
        channelName: channelName,
        eventType: EventType.VOICE,
      };
      await clanPage.verifyDataOnReviewTab(data);
      await clanPage.clickCreateEventButton();
    });

    await AllureReporter.step(
      'Click "Share" button and verify that event link is copied to clipboard',
      async () => {
        await clanPage.clickCopyLinkFromShareButton();
      }
    );

    await AllureReporter.step('Paste the copied event link on chat', async () => {
      await messageHelper.pasteAndSendTextV2();
    });

    await AllureReporter.step('Verify that pasted link is correct', async () => {
      const lastMessage = await messagePage.getLastMessage();
      await expect(lastMessage).toContainText(channelName);
    });
  });
  test('Verify that user can edit category name', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64058',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.MINOR,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully edit the category name within a clan.
    **Test Steps:**
      1. Create new category
      2. Edit category name
    **Expected Result:** The category name is updated successfully and reflected in the category list.
  `);
    await AllureReporter.addLabels({
      tag: ['edit-category', CLAN_MANAGEMENT_TAG],
    });

    const clanPage = new ClanPage(page);
    const menuPanel = new ClanMenuPanel(page);

    const unique = Date.now().toString(36).slice(-6);
    const categoryName = `cateName - ${unique}`;
    const newCategoryName = `newCateName - ${unique}`;

    await AllureReporter.addParameter('categoryName', categoryName);
    await AllureReporter.addParameter('newCategoryName', newCategoryName);
    await AllureReporter.step(`Create new category: ${categoryName}`, async () => {
      await menuPanel.createCategory(categoryName);
    });

    await AllureReporter.step(`Edit category name to: ${newCategoryName}`, async () => {
      await clanPage.editCategoryName(categoryName, newCategoryName);
    });

    await AllureReporter.step(
      'Verify that category name is updated in the category list',
      async () => {
        const isNewCategoryPresent = await menuPanel.isCategoryPresent(newCategoryName);
        expect(isNewCategoryPresent).toBe(true);
      }
    );
  });

  test('Verify that a category containing a system channel cannot be deleted', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64058',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.MINOR,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can not delete a category that contains a system channel.
    **Test Steps:**
      1. Create new category
      2. Attempt to delete category
    **Expected Result:** The category cannot be deleted and an error message is displayed.
  `);
    await AllureReporter.addLabels({
      tag: ['delete-category', CLAN_MANAGEMENT_TAG],
    });

    const clanPage = new ClanPage(page);
    const menuPanel = new ClanMenuPanel(page);
    const toastSelector = new ToastSelector(page);

    const unique = Date.now().toString(36).slice(-6);
    const categoryName = `cateName - ${unique}`;

    await AllureReporter.addParameter('categoryName', categoryName);
    await AllureReporter.step(`Create new category: ${categoryName}`, async () => {
      await menuPanel.createCategory(categoryName);
    });

    await AllureReporter.step(
      `Click delete category, verify that category cannot be deleted and error message is displayed`,
      async () => {
        await clanPage.deleteCategory(PUBLIC_CHANNELS_CATEGORY_NAME);
        const message = 'This category has welcome channel';
        await toastSelector.verifyErrorToast(message);
        await clanPage.closeSettingsChannel();
      }
    );
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
      tag: [EVENT_CREATION_TAG, 'public-event', 'voice-event'],
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

    await AllureReporter.step(VERIFY_CHANNEL_PRESENT_STEP, async () => {
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
      await clanPage.clickCreateEventButton();
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
});
