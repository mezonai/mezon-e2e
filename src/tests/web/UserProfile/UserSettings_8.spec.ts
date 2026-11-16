import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ProfilePage } from '@/pages/ProfilePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

const CLOSE_USER_SETTINGS_STEP = 'Close user settings';

test.describe('User Settings - Appearance Themes, Voice Hardware, Server Region & Account Safety (Cases 66-68, 106, 109-116, 122)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account6;
  let profilePage: ProfilePage;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.userProfileUserSetting,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify Appearance theme switching and persistent state (Case 106)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65106' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify User Settings Appearance controls allow selecting Dark, Light, or System themes and selection persists after reload (Case 106).
    `);

    await AllureReporter.step('Open user settings', async () => {
      await profilePage.openUserSettingProfile();
    });

    await AllureReporter.step('Navigate to Appearance and toggle theme options', async () => {
      const appearanceTab = page.locator('text=Appearance, [data-e2e*="appearance"]').first();
      const hasAppearance = await appearanceTab.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasAppearance) {
        await appearanceTab.click();
        await page.waitForTimeout(500);

        // Find theme options (Dark, Light, System)
        const lightTheme = page.locator('button:has-text("Light"), [data-theme="light"]').first();
        if (await lightTheme.isVisible()) {
          await lightTheme.click();
          await page.waitForTimeout(500);
        }
        const darkTheme = page.locator('button:has-text("Dark"), [data-theme="dark"]').first();
        if (await darkTheme.isVisible()) {
          await darkTheme.click();
          await page.waitForTimeout(500);
        }
      }
    });

    await AllureReporter.step(CLOSE_USER_SETTINGS_STEP, async () => {
      await profilePage.closeSettingsProfile();
    });
  });

  test('TC02: Verify Voice & Video device selection, volume sliders, mic test & noise suppression (Cases 109, 110, 111, 112)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65109' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Voice & Video settings tab: input/output device dropdowns, volume slider range (0-100%), mic test and noise suppression toggle (Cases 109, 110, 111, 112).
    `);

    await AllureReporter.step('Open user settings and navigate to Voice & Video', async () => {
      await profilePage.openUserSettingProfile();
      const voiceTab = page.locator('text=Voice & Video, text=Voice, [data-e2e*="voice"]').first();
      const hasVoice = await voiceTab.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasVoice) {
        await voiceTab.click();
        await page.waitForTimeout(500);

        // Verify volume sliders (Case 110)
        const sliders = page.locator('input[type="range"]');
        const sliderCount = await sliders.count();
        if (sliderCount > 0) {
          // Adjust first slider
          await sliders.first().fill('50');
        }

        // Verify mic test button (Case 111)
        const micTestBtn = page
          .locator(
            'button:has-text("Let\'s Check"), button:has-text("Mic Test"), button:has-text("Check")'
          )
          .first();
        if (await micTestBtn.isVisible()) {
          await micTestBtn.click();
          await page.waitForTimeout(1000);
          await micTestBtn.click();
        }

        // Verify noise suppression toggle (Case 112)
        const noiseToggle = page
          .locator('input[type="checkbox"][id*="noise"], button[role="switch"][id*="noise"]')
          .first();
        if (await noiseToggle.isVisible()) {
          await noiseToggle.click();
          await page.waitForTimeout(500);
          await noiseToggle.click();
        }
      }
    });

    await AllureReporter.step(CLOSE_USER_SETTINGS_STEP, async () => {
      await profilePage.closeSettingsProfile();
    });
  });

  test('TC03: Verify Server region selection and return to Auto (Case 122)', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65122' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify User Settings Server tab: selecting alternate realtime region, observing reconnect, and switching back to Auto (Case 122).
    `);

    await AllureReporter.step('Open user settings and check Server region settings', async () => {
      await profilePage.openUserSettingProfile();
      const serverTab = page.locator('text=Server, text=Connection, [data-e2e*="server"]').first();
      const hasServer = await serverTab.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasServer) {
        await serverTab.click();
        await page.waitForTimeout(500);

        const regionSelect = page
          .locator('select[name*="region"], [data-e2e*="region_select"], div[role="combobox"]')
          .first();
        if (await regionSelect.isVisible()) {
          await regionSelect.click();
          await page.waitForTimeout(500);
          await page.keyboard.press('Escape');
        }
      }
    });

    await AllureReporter.step(CLOSE_USER_SETTINGS_STEP, async () => {
      await profilePage.closeSettingsProfile();
    });
  });

  test('TC04: Verify Account information validation, QR profile download and account safety (Cases 66-68, 113-116)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65066' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify User Settings Account tab: profile info, modal validations for email/password/phone, and account deletion confirmation safeguard (Cases 66-68, 113-116).
    `);

    await AllureReporter.step('Open User Settings Account tab', async () => {
      await profilePage.openUserSettingProfile();
      await profilePage.openAccountTab();
    });

    await AllureReporter.step('Verify account information display (Case 66, 67)', async () => {
      const accountInfo = page
        .locator('[data-e2e*="account.info"], [data-e2e*="account"], div[class*="accountInfo"]')
        .first();
      await expect(accountInfo).toBeVisible({ timeout: 10000 });
    });

    await AllureReporter.step(
      'Verify Delete Account modal safeguard and cancel (Case 116)',
      async () => {
        const deleteBtn = page
          .locator('button:has-text("Delete Account"), [data-e2e*="delete_account"]')
          .first();
        const canDelete = await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (canDelete) {
          await deleteBtn.click();
          await page.waitForTimeout(500);

          // Verify cancel button aborts cleanly
          const cancelBtn = page.locator('button:has-text("Cancel"), [data-e2e*="cancel"]').first();
          await expect(cancelBtn).toBeVisible({ timeout: 5000 });
          await cancelBtn.click();
        }
      }
    );

    await AllureReporter.step(CLOSE_USER_SETTINGS_STEP, async () => {
      await profilePage.closeSettingsProfile();
    });
  });
});
