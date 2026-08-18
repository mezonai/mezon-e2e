import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, MEZON_DEV } from '@/config/environment';
import { CLAN_MANAGEMENT_TAG, TEST_ENTITY_NAME_MAX_LENGTH } from '@/constants/ClanManagement';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanSettingsPage } from '@/pages/ClanSettingsPage';
import { ClanStatus, EventType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { splitDomainAndPath } from '@/utils/domain';
import joinUrlPaths from '@/utils/joinUrlPaths';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { FileSizeTestHelpers } from '@/utils/uploadFileHelpers';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Audit Log, Count Events, Interested Event', () => {
  const EVENT_CREATION_TAG = 'event-creation';
  const CREATE_PUBLIC_LOCATION_EVENT_STEP = 'Create a new public location event';
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account3;
  const [username] = getUsernamesFromEmails([credentials.email]);

  const createPublicLocationEvent = async (clanPage: ClanPage) => {
    const unique = Date.now().toString(36).slice(-6);
    const locationName = `location name - ${unique}`;

    await clanPage.addDataOnLocationTab(EventType.LOCATION, locationName, ClanStatus.PUBLIC);
    const eventData = await clanPage.addDataOnEventInfoTab();

    await clanPage.verifyDataOnReviewTab({
      ...eventData,
      voiceChannelName: locationName,
      eventType: EventType.LOCATION,
      clanStatus: ClanStatus.PUBLIC,
    });
    await clanPage.clickCreateEventButton();

    return { eventData, locationName };
  };

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.clanManagement2,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63510' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => AuthHelper.logout(page));
  test.afterAll(async ({ browser }) =>
    TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials })
  );

  test('Verify that updating a role name is recorded in Clan Audit Log', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that changing a role name creates an Update Role entry in Audit Log.

      **Test Steps:**
      1. Open Clan Settings and create a role
      2. Update the role name
      3. Open the Audit Log tab
      4. Verify the actor, Update Role action, updated role name, role ID, and event time

      **Expected Result:** Audit Log displays the correct Update Role entry and timestamp.
    `);
    await AllureReporter.addLabels({ tag: [CLAN_MANAGEMENT_TAG, 'audit-log', 'update-role'] });

    const clanPage = new ClanPage(page);
    const clanSettingsPage = new ClanSettingsPage(page);
    const originalRoleName = `audit-${Date.now().toString(36)}`.slice(
      0,
      TEST_ENTITY_NAME_MAX_LENGTH
    );
    const updatedRoleName = `updated-${Date.now().toString(36)}`.slice(
      0,
      TEST_ENTITY_NAME_MAX_LENGTH
    );

    await AllureReporter.step(`Create role: ${originalRoleName}`, async () => {
      await clanPage.openRoleSettingsPage();
      await clanPage.addNewRoleOnClan(originalRoleName);
    });

    await AllureReporter.step(`Update role name to: ${updatedRoleName}`, async () => {
      await clanPage.updateRoleName(originalRoleName, updatedRoleName);
    });

    await AllureReporter.step('Open Clan Audit Log', async () => {
      await clanSettingsPage.openAuditLogTab();
    });

    await AllureReporter.step('Verify the Update Role audit-log content and time', async () => {
      await clanSettingsPage.verifyUpdateRoleAuditLog(updatedRoleName, username);
      await clanPage.closeSettingsClan();
    });
  });

  test('Verify event count is updated correctly after creating an event', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64056',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that the event count is updated correctly after creating an event.
      **Test Steps:**
        1. Count current events
        2. Create a new public location event
        3. Verify event count increases by one
      **Expected Result:** Event count increases by one and the created event appears in the list.
    `);
    await AllureReporter.addLabels({
      tag: [EVENT_CREATION_TAG, 'event-count'],
    });

    const clanPage = new ClanPage(page);
    let initialEventCount = 0;

    await AllureReporter.step('Count current events', async () => {
      initialEventCount = await clanPage.getNumberOfEventsInManagement();
      await clanPage.closeEventManagementModal();
    });

    await AllureReporter.step(CREATE_PUBLIC_LOCATION_EVENT_STEP, async () => {
      const { eventData, locationName } = await createPublicLocationEvent(clanPage);
      const eventCount = await clanPage.getNumberOfEventsInManagement();
      expect(eventCount).toBe(initialEventCount + 1);
      await clanPage.verifyLastEventData({
        eventTopic: eventData.eventTopic,
        description: eventData.description,
        voiceChannelName: locationName,
        startTime: `${eventData.startDate} - ${eventData.startTime}`,
        clanStatus: ClanStatus.PUBLIC,
        eventType: EventType.LOCATION,
      });
      await clanPage.closeEventManagementModal();
    });

    await AllureReporter.attachScreenshot(page, `Event count updated correctly`);
  });

  test('Verify that user can edit an event after creating it', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64056',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can edit an event immediately after creating it.
      **Test Steps:**
        1. Create a new public location event
        2. Verify created event card is displayed in event management modal
        3. Open event panel and click Edit Event
        4. Update location, topic, and description
        5. Verify updated data on review tab
        6. Save and verify updated event data on event card
      **Expected Result:** The created event can be edited and the updated data is displayed correctly.
    `);
    await AllureReporter.addLabels({
      tag: [EVENT_CREATION_TAG, 'edit-event', 'location-event'],
    });

    const clanPage = new ClanPage(page);
    const editedLocationName = `edited location - ${Date.now().toString(36).slice(-6)}`;
    let editedEventData: {
      eventTopic: string;
      description?: string;
      startDate: string;
      startTime: string;
    };

    await AllureReporter.step(CREATE_PUBLIC_LOCATION_EVENT_STEP, async () => {
      await createPublicLocationEvent(clanPage);
    });

    await AllureReporter.step('Open Edit Event from the created event card', async () => {
      await clanPage.openEditLastEventForm();
    });

    await AllureReporter.step('Update event location, topic, and description', async () => {
      await clanPage.updateLocationEventLocation(editedLocationName);
      editedEventData = await clanPage.updateDataOnEventInfoTab();
    });

    await AllureReporter.step('Verify updated data on review tab and save event', async () => {
      await clanPage.verifyDataOnReviewTab({
        ...editedEventData,
        voiceChannelName: editedLocationName,
        eventType: EventType.LOCATION,
        clanStatus: ClanStatus.PUBLIC,
      });
      await clanPage.clickUpdateEventButton();
    });

    await AllureReporter.step('Verify updated event appears on event card', async () => {
      const isUpdatedEvent = await clanPage.verifyLastEventData({
        eventTopic: editedEventData.eventTopic,
        description: editedEventData.description,
        voiceChannelName: editedLocationName,
        startTime: `${editedEventData.startDate} - ${editedEventData.startTime}`,
        clanStatus: ClanStatus.PUBLIC,
        eventType: EventType.LOCATION,
      });
      expect(isUpdatedEvent).toBeTruthy();
      await clanPage.closeEventManagementModal();
    });

    await AllureReporter.attachScreenshot(page, `Event edited successfully`);
  });

  test('Verify interested count is updated correctly on event detail', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64056',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that the interested user count is updated correctly.
      **Test Steps:**
        1. Create a new public location event
        2. Open event detail
        3. Mark Interested and verify interested count increases
        4. Mark Uninterested and verify interested count decreases
      **Expected Result:** Interested count and interested user list match the user's actions.
    `);
    await AllureReporter.addLabels({
      tag: [EVENT_CREATION_TAG, 'interested-count'],
    });

    const clanPage = new ClanPage(page);

    await AllureReporter.step(CREATE_PUBLIC_LOCATION_EVENT_STEP, async () => {
      await createPublicLocationEvent(clanPage);
    });

    await AllureReporter.step(
      'Verify Interested and Uninterested update count correctly',
      async () => {
        const initialInterestedCount = await clanPage.getInterestedCountFromCard();
        await clanPage.markUninterestedInEventDetail();
        await clanPage.openLastEventDetailModal();
        await page.waitForTimeout(1000);

        await clanPage.markUninterestedInEventDetail();
        const interestedCount = await clanPage.getInterestedCountFromEventDetail();
        expect(interestedCount).toBe(initialInterestedCount - 1);

        const interestedUserCount = await clanPage.getInterestedCountFromEventDetailTab();
        expect(interestedUserCount).toBe(interestedCount);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000); // Wait for modal to close
        await clanPage.markInterestedInEventDetail();
        await clanPage.openLastEventDetailModal();
        await page.waitForTimeout(1000);
        const uninterestedCount = await clanPage.getInterestedCountFromEventDetail();
        expect(uninterestedCount).toBe(initialInterestedCount);

        const uninterestedUserCount = await clanPage.getInterestedCountFromEventDetailTab();
        expect(uninterestedUserCount).toBe(uninterestedCount);
        await clanPage.closeEventModal();
      }
    );

    await AllureReporter.attachScreenshot(page, `Interested count updated correctly`);
  });

  test('Verify clan banner is updated after uploading an image', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that an uploaded clan banner is displayed on the clan page.

      **Test Steps:**
      1. Open the current clan using the dev URL
      2. Capture the current clan banner
      3. Upload a new banner from Clan Settings
      4. Verify clan_page.banner displays the new image

      **Expected Result:** The clan banner image changes after the upload completes.
    `);
    await AllureReporter.addLabels({ tag: [CLAN_MANAGEMENT_TAG, 'clan-banner', 'upload'] });

    const clanPage = new ClanPage(page);
    const fileSizeHelpers = new FileSizeTestHelpers(page);
    const clanPath = splitDomainAndPath(clanFactory.getClanUrl()).path;

    try {
      await AllureReporter.step('Open the clan on dev and capture its current banner', async () => {
        await page.goto(joinUrlPaths(MEZON_DEV, clanPath), { waitUntil: 'domcontentloaded' });
      });
      const previousBannerImage = await clanPage.getClanBannerImage();
      const bannerPath = await fileSizeHelpers.createFileWithSize(
        `clan-banner-${Date.now()}`,
        1024 * 1024,
        'jpg'
      );

      await AllureReporter.step('Upload a new clan banner', async () => {
        await clanPage.uploadClanBanner(bannerPath);
      });

      await AllureReporter.step(
        'Verify clan_page.banner displays the uploaded banner',
        async () => {
          await clanPage.verifyClanBannerChanged(previousBannerImage);
        }
      );

      await AllureReporter.attachScreenshot(page, 'Clan banner updated successfully');
    } finally {
      await fileSizeHelpers.cleanupFiles();
    }
  });
});
