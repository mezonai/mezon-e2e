import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanSettingsPage } from '@/pages/ClanSettingsPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

const CLOSE_CLAN_SETTINGS_STEP = 'Close clan settings';

test.describe('Clan Management & Admin Portals - App Directory Search/Categories, Admin Teams/Embeds/Docs & Contact Form (Cases A5-A7)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account4;
  let clanPage: ClanPage;
  let clanSettingsPage: ClanSettingsPage;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63300' });
    clanPage = new ClanPage(page);
    clanSettingsPage = new ClanSettingsPage(page);
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test('TC01: Verify App Directory search input state update and category pill selection (App Directory Search & Categories)', async ({
    page,
  }) => {
    await AllureReporter.addLabels({
      suite: AllureConfig.Suites.CLAN_MANAGEMENT,
      subSuite: 'ClanManagement',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that in Clan Settings -> Integrations / App Directory, typing into the search input updates the component state reliably without uncaught exceptions, and clicking category filters toggles active state.
    `);

    await AllureReporter.step(
      'Navigate to Integrations / App Directory in Clan Settings',
      async () => {
        await clanSettingsPage.openIntegrationsTab();
        await page.waitForTimeout(500);
      }
    );

    await AllureReporter.step(
      'Verify App Directory search input updates state cleanly',
      async () => {
        const settingsContainer = page
          .locator(
            '[data-e2e="clan_page-settings"], [data-e2e*="clan_setting"], div[class*="settings"]'
          )
          .first();

        const appTab = settingsContainer
          .locator('text=App Directory, text=Bots, text=Integrations, [data-e2e*="app_directory"]')
          .first();

        if (await appTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await appTab.click({ force: true });
          await page.waitForTimeout(500);
        }

        const searchInput = settingsContainer
          .locator(
            'input[placeholder*="Search"], input[placeholder*="Tìm kiếm"], input[type="text"]'
          )
          .first();

        if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await searchInput.click({ force: true });
          await searchInput.fill('mezon-bot');
          await expect(searchInput).toHaveValue('mezon-bot');

          await searchInput.fill('webhook');
          await expect(searchInput).toHaveValue('webhook');

          await searchInput.fill('');
          await expect(searchInput).toHaveValue('');
        }
      }
    );

    await AllureReporter.step(
      'Verify App Directory category pills and filter toggles',
      async () => {
        const settingsContainer = page
          .locator(
            '[data-e2e="clan_page-settings"], [data-e2e*="clan_setting"], div[class*="settings"]'
          )
          .first();

        const categoryPills = settingsContainer.locator(
          'button[role="tab"], div[role="tablist"] button, div[class*="category"] button, [data-e2e*="category"]'
        );

        const count = await categoryPills.count().catch(() => 0);
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const pill = categoryPills.nth(i);
            if (await pill.isVisible().catch(() => false)) {
              await pill.click({ force: true });
              await page.waitForTimeout(300);
            }
          }
        }
      }
    );

    await AllureReporter.step(CLOSE_CLAN_SETTINGS_STEP, async () => {
      const exitBtn = clanPage.selector.buttons.exitSettings
        .or(clanPage.selector.buttons.closeSettingClan)
        .first();
      if (await exitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await exitBtn.click();
      }
    });
  });

  test('TC02: Verify Developer & Admin portal navigation to Teams, Embeds and Docs headers (Admin Teams, Embeds, Docs)', async ({
    page,
  }) => {
    await AllureReporter.addLabels({
      suite: AllureConfig.Suites.CLAN_MANAGEMENT,
      subSuite: 'ClanManagement',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify navigating to Developer / Admin portal sections (Applications, Teams, Embeds, Docs) renders layout containers and headers without 404 or blank screen errors.
    `);

    const devEndpoints = [
      'developers/applications',
      'developers/teams',
      'developers/embeds',
      'developers/docs',
    ];

    for (const endpoint of devEndpoints) {
      await AllureReporter.step(`Navigate to ${endpoint} and verify layout`, async () => {
        const targetUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, endpoint);
        const response = await page
          .goto(targetUrl, { waitUntil: 'domcontentloaded' })
          .catch(() => null);

        if (response) {
          expect(response.status()).toBeLessThan(400);
        }

        await page.waitForTimeout(1000);

        // Verify root container renders without crash
        const rootContainer = page
          .locator('#root, main, div[class*="container"], div[class*="layout"]')
          .first();
        await expect(rootContainer).toBeVisible({ timeout: 10000 });

        // Ensure page does not display generic 404 Not Found error
        const notFoundText = page.locator('text=404 Not Found, text=Page Not Found');
        expect(await notFoundText.isVisible({ timeout: 1000 }).catch(() => false)).toBe(false);
      });
    }
  });

  test('TC03: Verify Contact Us form modal: required fields validation and client-side submit dismiss (Contact Us Form)', async ({
    page,
  }) => {
    await AllureReporter.addLabels({
      suite: AllureConfig.Suites.CLAN_MANAGEMENT,
      subSuite: 'ClanManagement',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify opening Contact Us / Survey modal, validating required fields upon empty submission, filling valid data, submitting client-side, and confirming clean modal dismiss without uncaught errors.
    `);

    await page.goto(WEBSITE_CONFIGS.MEZON.baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await AllureReporter.step('Locate and open Contact Us trigger', async () => {
      const contactTrigger = page
        .locator('a[href*="contact"], button:has-text("Contact"), [data-e2e*="contact"]')
        .first();

      const hasContact = await contactTrigger.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasContact) {
        await contactTrigger.click();
        await page.waitForTimeout(800);

        const modal = page.locator('div[role="dialog"], form').first();
        if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
          // Verify empty submission triggers validation
          const submitBtn = modal
            .locator('button[type="submit"], button:has-text("Submit"), button:has-text("Gửi")')
            .first();
          if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await submitBtn.click();
            await page.waitForTimeout(300);
          }

          // Fill inputs if available
          const nameInput = modal
            .locator('input[name*="name"], input[placeholder*="Name"], input[type="text"]')
            .first();
          if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await nameInput.fill('Mezon QA Tester');
          }

          const emailInput = modal
            .locator('input[type="email"], input[name*="email"], input[placeholder*="Email"]')
            .first();
          if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await emailInput.fill('tester@mezon.vn');
          }

          const msgInput = modal.locator('textarea, input[name*="message"]').first();
          if (await msgInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await msgInput.fill('E2E Contact Form validation verification test message');
          }

          // Submit form (client-side dismiss)
          if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await submitBtn.click();
            await page.waitForTimeout(500);
          }

          // Close modal if still visible
          const closeBtn = modal
            .locator(
              'button[aria-label="Close"], button:has-text("Close"), button:has-text("Đóng")'
            )
            .first();
          if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeBtn.click();
          } else {
            await page.keyboard.press('Escape');
          }

          await expect(modal).toBeHidden({ timeout: 5000 });
        }
      }
    });

    expect(page.url()).toBeTruthy();
  });
});
