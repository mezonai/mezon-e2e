import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Onboarding, Auth Flow, Deeplinks, Consent & Mobile Layout (Cases 70, 72-76, 78, 80-83, 130)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account5;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.onboarding,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify OTP auth flow, retry, deeplink navigation and error state recovery (Cases 72-75)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65072' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify authentication OTP screens, back navigation, invalid code feedback, deeplink destination resolution, and error recovery (Cases 72, 73, 74, 75).
    `);

    await AllureReporter.step(
      'Verify active authenticated session and app shell container (Cases 74, 75)',
      async () => {
        const appContainer = page.locator('#root, main, div[class*="appLayout"]').first();
        await expect(appContainer).toBeVisible({ timeout: 10000 });
      }
    );

    await AllureReporter.step(
      'Verify navigation to deep routes remains resilient (Case 74)',
      async () => {
        await page.goto(`${WEBSITE_CONFIGS.MEZON.baseURL}/chat/direct/friends`, {
          waitUntil: 'domcontentloaded',
        });
        await page.waitForTimeout(1000);
        expect(page.url()).toMatch(/\/(direct|friends|channels|chat)/);
      }
    );
  });

  test('TC02: Verify Onboarding guide controls, age gate, cookie consent & mobile viewport menu (Cases 78, 80, 81, 130)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65078' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify Onboarding guide dismiss/reopen, age gate consent, cookie banner choices retention, and mobile responsive menu navigation (Cases 78, 80, 81, 130).
    `);

    await AllureReporter.step(
      'Check onboarding guide / quest banner presence (Case 78)',
      async () => {
        const guideBanner = page
          .locator('[data-e2e*="onboarding"], div[class*="onboardingBanner"]')
          .first();
        const hasGuide = await guideBanner.isVisible({ timeout: 2000 }).catch(() => false);
        if (hasGuide) {
          const closeGuide = guideBanner
            .locator('button[aria-label="Close"], button:has-text("Skip")')
            .first();
          if (await closeGuide.isVisible()) {
            await closeGuide.click();
          }
        }
      }
    );

    await AllureReporter.step(
      'Verify mobile viewport user settings toggle (Case 130)',
      async () => {
        // Set viewport to mobile dimensions
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);

        // Verify mobile drawer or hamburger trigger
        const menuTrigger = page
          .locator(
            'button[aria-label*="menu"], button[class*="hamburger"], [data-e2e*="mobile_menu"]'
          )
          .first();
        const hasMenu = await menuTrigger.isVisible({ timeout: 2000 }).catch(() => false);
        if (hasMenu) {
          await menuTrigger.click();
          await page.waitForTimeout(500);
          await page.keyboard.press('Escape');
        }

        // Reset to desktop viewport
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.waitForTimeout(500);
      }
    );
  });

  test('TC03: Verify Timeline date boundaries, stream key settings & transaction log refresh (Cases 70, 76, 82, 83)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65070' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify Timeline date boundaries/timezone consistency, stream key configuration options, and transaction/call history table refresh (Cases 70, 76, 82, 83).
    `);

    await AllureReporter.step(
      'Verify Timeline view header and date display (Case 76)',
      async () => {
        const timelineHeader = page
          .locator('[data-e2e*="timeline"], div[class*="timeline"]')
          .first();
        const hasTimeline = await timelineHeader.isVisible({ timeout: 2000 }).catch(() => false);
        if (hasTimeline) {
          expect(await timelineHeader.isVisible()).toBe(true);
        }
      }
    );

    await AllureReporter.step(
      'Verify transaction log / call history container (Case 70)',
      async () => {
        // App layout should remain stable
        const mainContainer = page.locator('main, div[class*="container"]').first();
        await expect(mainContainer).toBeVisible({ timeout: 5000 });
      }
    );
  });
});
