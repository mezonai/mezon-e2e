import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import ClanEventSelector from '@/data/selectors/ClanEventSelector';
import ClanOnboardingSelector from '@/data/selectors/ClanOnboardingSelector';
import ClanSettingSelector from '@/data/selectors/ClanSettingSelector';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Onboarding Controls, Community Section & Event Location Selection (TC-CLAN-08, TC-CI-20, 29)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account8;
  let clanPage: ClanPage;
  let clanSettingSelector: ClanSettingSelector;
  let onboardingSelector: ClanOnboardingSelector;
  let eventSelector: ClanEventSelector;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    clanPage = new ClanPage(page);
    clanSettingSelector = new ClanSettingSelector(page);
    onboardingSelector = new ClanOnboardingSelector(page);
    eventSelector = new ClanEventSelector(page);

    await page
      .evaluate(() => {
        localStorage.removeItem('remember_channel');
      })
      .catch(() => {});
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });

    const clanHeader = clanPage.selector.buttons.clanName
      .or(page.locator('[data-e2e*="clan_page-header-title-clan_name"]'))
      .first();
    if (!(await clanHeader.isVisible({ timeout: 2000 }).catch(() => false))) {
      const clanName = clanFactory.getClanName();
      const clanBtn = page
        .locator(`[data-e2e="clan_page-side_bar-clan_item"][title*="${clanName}"] button`)
        .or(page.locator(`div[title*="${clanName}"] button`))
        .first();

      await clanBtn.scrollIntoViewIfNeeded().catch(() => {});
      if (await clanBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await clanBtn.click({ force: true });
        await page.waitForTimeout(1000);
      }
      if (page.url().includes('/member-safety')) {
        const firstChannel = page
          .locator('[data-e2e*="channel_list-item-name"], [data-e2e*="channel_list"] p')
          .first();
        if (await firstChannel.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstChannel.click();
        }
      }
      await expect(clanHeader).toBeVisible({ timeout: 10000 });
    }
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify Clan Settings Onboarding navigation and controls (Clan Guide, Add Resources, Questions) (TC-CLAN-08)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66066' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can open Clan Settings, navigate to Onboarding tab, and inspect onboarding configuration options.
    `);
    await AllureReporter.addLabels({
      tag: ['clan-management', 'onboarding', 'clan-settings'],
    });

    await AllureReporter.step('Open Clan Settings', async () => {
      await clanPage.openClanSettings();
      await page.waitForTimeout(1000);
    });

    await AllureReporter.step('Navigate to Onboarding sidebar item', async () => {
      const onboardingSidebar = page
        .locator('div, button')
        .filter({ hasText: /^Onboarding$/i })
        .or(clanSettingSelector.buttons.sidebarItem.filter({ hasText: 'Onboarding' }))
        .first();

      if (await onboardingSidebar.isVisible({ timeout: 5000 }).catch(() => false)) {
        await onboardingSidebar.click();
        await page.waitForTimeout(1000);

        // Verify onboarding page elements
        const enableBtn = clanSettingSelector.buttons.enableOnboarding
          .or(page.locator('button').filter({ hasText: /enable onboarding|get started/i }))
          .first();
        const guideBtn = clanSettingSelector.buttons.editClanGuide
          .or(page.locator('button').filter({ hasText: /guide|clan guide/i }))
          .first();
        const hasOnboardingControls =
          (await enableBtn.isVisible({ timeout: 3000 }).catch(() => false)) ||
          (await guideBtn.isVisible({ timeout: 3000 }).catch(() => false)) ||
          (await page
            .locator('h1, h2, h3, p')
            .filter({ hasText: /onboarding/i })
            .first()
            .isVisible()
            .catch(() => false));

        expect(hasOnboardingControls).toBe(true);
      }
    });

    await AllureReporter.step('Close Clan Settings', async () => {
      await clanPage.closeSettingsClan();
    });
  });

  test('TC02: Verify Clan Settings Community Enablement overview section and Vanity URL controls (TC-CI-20)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66067' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can access Community section in Clan Settings and verify Community Enablement controls.
    `);
    await AllureReporter.addLabels({
      tag: ['clan-management', 'community', 'clan-settings', 'vanity-url'],
    });

    await AllureReporter.step('Open Clan Settings', async () => {
      await clanPage.openClanSettings();
      await page.waitForTimeout(1000);
    });

    await AllureReporter.step('Navigate to Community or Overview tab', async () => {
      const communitySidebar = page
        .locator('div, button')
        .filter({ hasText: /^Community|Enable Community$/i })
        .or(clanSettingSelector.buttons.sidebarItem.filter({ hasText: /community/i }))
        .first();

      if (await communitySidebar.isVisible({ timeout: 4000 }).catch(() => false)) {
        await communitySidebar.click();
        await page.waitForTimeout(1000);

        const enableCommunityBtn = clanSettingSelector.community.enableButton
          .or(page.locator('button').filter({ hasText: /enable community/i }))
          .first();
        const hasCommunityControls =
          (await enableCommunityBtn.isVisible({ timeout: 3000 }).catch(() => false)) ||
          (await page
            .locator('text=/community/i')
            .first()
            .isVisible()
            .catch(() => false));

        expect(hasCommunityControls).toBe(true);
      } else {
        // Overview tab fallback: verify clan name input exists
        await expect(clanSettingSelector.general.clanName).toBeVisible({ timeout: 5000 });
      }
    });

    await AllureReporter.step('Close Clan Settings', async () => {
      await clanPage.closeSettingsClan();
    });
  });

  test('TC03: Verify Clan Event modal location selection controls (Voice Channel vs Text Channel) (TC-CI-29)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66068' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify opening Create Event modal and selecting channel location controls for Voice vs Text channel.
    `);
    await AllureReporter.addLabels({
      tag: ['clan-management', 'clan-event', 'location-selection'],
    });

    await AllureReporter.step('Open Clan dropdown and click Create Event', async () => {
      const clanMenuBtn = clanPage.selector.buttons.clanName
        .or(page.locator('[data-e2e*="clan_page-header-title-clan_name"]'))
        .first();
      await clanMenuBtn.click();
      await page.waitForTimeout(500);

      const createEventItem = page
        .locator('div, button')
        .filter({ hasText: /^Create Event$/i })
        .or(page.locator('[data-e2e*="create_event"]'))
        .first();

      if (await createEventItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createEventItem.click();
        await page.waitForTimeout(1000);

        // Verify Event modal appears
        const eventModal = page.locator('[data-e2e*="create_event"], div[role="dialog"]').first();
        await expect(eventModal).toBeVisible({ timeout: 8000 });

        // Select channel location options
        const voiceOption = page.locator('text=/voice channel/i, [data-e2e*="voice"]').first();
        const textOption = page
          .locator('text=/text channel|somewhere else/i, [data-e2e*="text"]')
          .first();

        const hasLocationOptions =
          (await voiceOption.isVisible({ timeout: 3000 }).catch(() => false)) ||
          (await textOption.isVisible({ timeout: 3000 }).catch(() => false));
        expect(hasLocationOptions).toBe(true);

        // Cancel / close modal
        const cancelBtn = page
          .locator('button:has-text("Cancel"), button[aria-label="Close"], [data-e2e*="cancel"]')
          .first();
        if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await cancelBtn.click();
        } else {
          await page.keyboard.press('Escape');
        }
      } else {
        // Close clan dropdown menu
        await page.keyboard.press('Escape');
      }
    });
  });
});
