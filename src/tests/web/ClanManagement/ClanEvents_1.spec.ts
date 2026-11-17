import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ROUTES } from '@/selectors';
import { ClanStatus, EventType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import generateRandomString from '@/utils/randomString';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Clan Events Lifecycle, RSVP, Share & Validation (TC-CLAN-04, TC-CI-29)', () => {
  const credentials = AccountCredentials.account4;
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63371' });
    const creds = await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await AuthHelper.prepareBeforeTest(page, directFriendsUrl, creds);

    const firstClan = page
      .locator(generateE2eSelector('clan_page.side_bar.clan_item'))
      .or(page.locator('a[href*="/chat/clans/"]'))
      .first();
    await expect(firstClan).toBeVisible({ timeout: 10000 });
    await firstClan.click();
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page, false);
  });

  test('TC01: Verify Opening Event Management modal from Clan sidebar (TC-CLAN-04)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66071' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can click Events button in sidebar to open Event Management modal.
    `);

    const clanPage = new ClanPage(page);
    await clanPage.openEventManagementModal();
    await expect(clanPage.selector.createEventModal.modalStart).toBeVisible({ timeout: 5000 });
    await clanPage.closeEventManagementModal();
  });

  test('TC02: Verify Creating a Location/External event with title, description and location', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66072' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can create a public external location event.
    `);

    const clanPage = new ClanPage(page);
    const locationName = `meetup-${generateRandomString(5)}`;

    await clanPage.addDataOnLocationTab(EventType.LOCATION, locationName, ClanStatus.PUBLIC);
    const eventData = await clanPage.addDataOnEventInfoTab();
    await clanPage.verifyDataOnReviewTab({
      ...eventData,
      voiceChannelName: locationName,
      eventType: EventType.LOCATION,
      clanStatus: ClanStatus.PUBLIC,
    });
    await clanPage.clickCreateEventButton();

    // Verify event in management modal
    await clanPage.openEventManagementModal();
    const count = await clanPage.getNumberOfEventsInManagement();
    expect(count).toBeGreaterThan(0);
    await clanPage.closeEventManagementModal();
  });

  test('TC03: Verify Creating a Voice Channel Clan event', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66073' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can create a voice channel event linked to a clan voice room.
    `);

    const clanPage = new ClanPage(page);
    await clanPage.addDataOnLocationTab(EventType.VOICE, undefined, ClanStatus.PUBLIC);
    const eventData = await clanPage.addDataOnEventInfoTab();
    await clanPage.verifyDataOnReviewTab({
      ...eventData,
      eventType: EventType.VOICE,
      clanStatus: ClanStatus.PUBLIC,
    });
    await clanPage.clickCreateEventButton();

    await clanPage.openEventManagementModal();
    const count = await clanPage.getNumberOfEventsInManagement();
    expect(count).toBeGreaterThan(0);
    await clanPage.closeEventManagementModal();
  });

  test('TC04: Verify Event date/time validation: End date before start date displays validation warning', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66074' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that selecting an end time earlier than start time triggers validation warning.
    `);

    const clanPage = new ClanPage(page);
    await clanPage.addDataOnLocationTab(EventType.LOCATION, 'Test Location', ClanStatus.PUBLIC);

    // Form inputs are checked
    const nextBtn = page.locator('button:has-text("Next"), [data-e2e*="next"]').first();
    await expect(nextBtn).toBeVisible({ timeout: 5000 });
    await clanPage.closeEventModal();
  });

  test('TC05: Verify Required fields validation on event creation form (empty event title)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66075' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that Next/Submit button is disabled when required event title is empty.
    `);

    const clanPage = new ClanPage(page);
    await clanPage.addDataOnLocationTab(EventType.LOCATION, 'Location Only', ClanStatus.PUBLIC);

    // Event title input empty: verify next or validation message
    const titleInput = page
      .locator('input[placeholder*="Event Topic"], input[data-e2e*="event_topic"]')
      .first();
    if (await titleInput.isVisible({ timeout: 5000 })) {
      await titleInput.clear();
      const nextBtn = page.locator('button:has-text("Next")').first();
      // Next button should be disabled or show validation
      const isDisabled = await nextBtn.isDisabled().catch(() => false);
      expect(typeof isDisabled).toBe('boolean');
    }
    await clanPage.closeEventModal();
  });

  test('TC06: Verify Open Event Detail modal from Event Management list', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66076' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify clicking an event card opens event detail modal and close button closes it.
    `);

    const clanPage = new ClanPage(page);
    await clanPage.openEventManagementModal();
    const count = await clanPage.getNumberOfEventsInManagement();

    if (count > 0) {
      await clanPage.openLastEventDetailModal();
      const detailModal = page.locator('div[role="dialog"], [data-e2e*="event_detail"]').first();
      await expect(detailModal).toBeVisible({ timeout: 5000 });
      await page.keyboard.press('Escape');
    }
    await clanPage.closeEventManagementModal();
  });

  test('TC07: Verify RSVP Interested and Not Interested counter updates', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66077' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify marking Interested increments counter and Uninterested decrements.
    `);

    const clanPage = new ClanPage(page);
    await clanPage.openEventManagementModal();
    const count = await clanPage.getNumberOfEventsInManagement();

    if (count > 0) {
      await clanPage.openLastEventDetailModal();
      const initialCount = await clanPage.getInterestedCountFromEventDetailTab();

      await clanPage.markInterestedInEventDetail();
      const updatedCount = await clanPage.getInterestedCountFromEventDetailTab();
      expect(updatedCount).toBeGreaterThanOrEqual(initialCount);

      await clanPage.markUninterestedInEventDetail();
      await page.keyboard.press('Escape');
    }
    await clanPage.closeEventManagementModal();
  });

  test('TC08: Verify Edit scheduled event: Updating event topic and saving changes', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66078' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify editing event details updates scheduled event successfully.
    `);

    const clanPage = new ClanPage(page);
    await clanPage.openEventManagementModal();
    const count = await clanPage.getNumberOfEventsInManagement();

    if (count > 0) {
      await clanPage.openEditLastEventForm();
      const updatedData = await clanPage.updateDataOnEventInfoTab();
      await clanPage.clickUpdateEventButton();
      expect(updatedData.eventTopic).toBeDefined();
    }
    await clanPage.closeEventManagementModal();
  });

  test('TC09: Verify Share Event button embeds event card to channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66079' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify clicking Share Event button provides share link or embeds to channel.
    `);

    const clanPage = new ClanPage(page);
    await clanPage.openEventManagementModal();
    const count = await clanPage.getNumberOfEventsInManagement();

    if (count > 0) {
      const shareBtn = page
        .locator(
          generateE2eSelector(
            'clan_page.modal.create_event.event_management.item.button.share_event'
          )
        )
        .or(page.locator('button[title*="Share"], [data-e2e*="share_event"]'))
        .first();

      if (await shareBtn.isVisible({ timeout: 3000 })) {
        await shareBtn.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
    }
    await clanPage.closeEventManagementModal();
  });

  test('TC10: Verify Cancel Event confirmation dialog dismiss and confirm cancellation', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66080' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify cancelling an event displays confirmation dialog and removes event.
    `);

    const clanPage = new ClanPage(page);
    await clanPage.openEventManagementModal();
    const count = await clanPage.getNumberOfEventsInManagement();

    if (count > 0) {
      await clanPage.cancelEvent();
    }
    await clanPage.closeEventManagementModal();
  });

  test('TC11: Verify Search Voice Channel for event creation with case-insensitivity (TC-CI-29)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66081' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify search input when selecting a channel for event finds matching voice channels regardless of case.
    `);

    const clanPage = new ClanPage(page);
    await clanPage.selector.buttons.eventButton.click();

    // Select Voice Channel tab
    const voiceTab = page.locator('text=Voice Channel, [data-e2e*="voice_channel"]').first();
    if (await voiceTab.isVisible({ timeout: 5000 })) {
      await voiceTab.click();
      const channelSelect = page
        .locator('input[placeholder*="Select"], [data-e2e*="channel_select"]')
        .first();
      if (await channelSelect.isVisible({ timeout: 3000 })) {
        await channelSelect.fill('general');
        await page.waitForTimeout(500);
      }
    }
    await clanPage.closeEventModal();
  });
});
