import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import {
  CLAN_MANAGEMENT_TAG,
  CONTEXT_MENU_TAG,
  PUBLIC_CHANNELS_CATEGORY_NAME,
  TEST_ENTITY_NAME_MAX_LENGTH,
} from '@/constants/ClanManagement';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
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
    const voiceChannelName = `vc-${unique}`.slice(0, TEST_ENTITY_NAME_MAX_LENGTH);
    const textChannelName = `ptc-${unique}`.slice(0, TEST_ENTITY_NAME_MAX_LENGTH);
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

  test('Verify category context menu displays mute and notification actions', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify the expected actions are available from a category context menu.

      **Test Steps:**
      1. Locate the Public Channels category in the channel list
      2. Right-click the category name
      3. Verify "Mute Category" is displayed
      4. Verify "Notification Settings" is displayed

      **Expected Result:** Both category actions are visible in the context menu.
    `);
    await AllureReporter.addLabels({
      tag: [CLAN_MANAGEMENT_TAG, 'category', CONTEXT_MENU_TAG, 'notification'],
    });

    const clanPage = new ClanPage(page);

    await AllureReporter.step(
      'Open the Public Channels context menu and verify its actions',
      async () => {
        await clanPage.verifyCategoryContextMenuActions(PUBLIC_CHANNELS_CATEGORY_NAME, [
          'Mute Category',
          'Notification Settings',
        ]);
      }
    );

    await AllureReporter.attachScreenshot(page, 'Category context menu actions displayed');
  });

  test('Verify category context menu displays collapse actions', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify the category context menu provides controls for collapsing categories.

      **Test Steps:**
      1. Locate the Public Channels category in the channel list
      2. Right-click the category name
      3. Verify "Collapse Category" is displayed
      4. Verify "Collapse All Categories" is displayed

      **Expected Result:** Both category collapse actions are visible in the context menu.
    `);
    await AllureReporter.addLabels({
      tag: [CLAN_MANAGEMENT_TAG, 'category', CONTEXT_MENU_TAG, 'collapse'],
    });

    const clanPage = new ClanPage(page);

    await AllureReporter.step(
      'Open the Public Channels context menu and verify collapse actions',
      async () => {
        await clanPage.verifyCategoryContextMenuActions(PUBLIC_CHANNELS_CATEGORY_NAME, [
          'Collapse Category',
          'Collapse All Categories',
        ]);
      }
    );

    await AllureReporter.attachScreenshot(page, 'Category collapse actions displayed');
  });

  test('Verify an empty category can be deleted from Edit Category', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64058' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify a clan owner can delete an empty category from its edit page.

      **Test Steps:**
      1. Create an empty category
      2. Right-click the category in the channel list
      3. Click "Edit Category"
      4. Click the Delete Category button
      5. Confirm the deletion in the confirmation modal
      6. Verify the category no longer appears in the channel list

      **Expected Result:** The empty category is deleted after confirmation.
    `);
    await AllureReporter.addLabels({
      tag: [CLAN_MANAGEMENT_TAG, 'category', 'delete-category'],
    });

    const clanPage = new ClanPage(page);
    const menuPanel = new ClanMenuPanel(page);
    const categoryName = `delete-cat-${Date.now().toString(36).slice(-6)}`;

    await AllureReporter.step(`Create empty category: ${categoryName}`, async () => {
      await menuPanel.createCategory(categoryName);
      expect(await menuPanel.isCategoryPresent(categoryName)).toBe(true);
    });

    await AllureReporter.step(`Delete category: ${categoryName}`, async () => {
      await clanPage.deleteCategory(categoryName);
      await page.waitForTimeout(1000);
    });

    await AllureReporter.step('Verify the category is removed from the channel list', async () => {
      expect(await menuPanel.isCategoryPresent(categoryName)).toBe(false);
    });

    await AllureReporter.attachScreenshot(page, `Category Deleted - ${categoryName}`);
  });
});
