import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
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

test.describe('Clan Management - Module 4', () => {
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
      tag: ['event-creation', 'Public-event', 'location-event'],
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
      tag: ['event-creation', 'share-event', 'Public-event'],
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

    await AllureReporter.step('Verify channel is present in channel list', async () => {
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
      await page.waitForTimeout(1000);
    });

    await AllureReporter.step('Verify that pasted link is correct', async () => {
      const lastMessage = await messagePage.getLastMessage();
      expect(lastMessage).toContainText(channelName);
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
      tag: ['edit-category', 'clan-management'],
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
});
