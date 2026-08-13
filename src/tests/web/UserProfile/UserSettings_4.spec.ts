import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ProfilePage } from '@/pages/ProfilePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import { joinUrlPaths } from '@/utils/joinUrlPaths';
import { expect, Page, test } from '@playwright/test';

test.describe('User Settings - Activity and Notification Switches', () => {
  const clanFactory = new ClanFactory();
  const account = AccountCredentials.account6;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await TestSetups.authenticationTest({
      suite: AllureConfig.Suites.USER_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.USER_PROFILE,
      story: AllureConfig.Stories.PROFILE_SETUP,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AuthHelper.setupAuthWithEmailPassword(page, account);
    await clanFactory.setupClan(ClanSetupHelper.configs.userProfileUserSetting, page);
    clanFactory.setClanUrl(
      joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, splitDomainAndPath(clanFactory.getClanUrl()).path)
    );
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63571' });
    const credentials = await AuthHelper.setupAuthWithEmailPassword(page, account);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await AllureReporter.addParameter('clanName', clanFactory.getClanName());
  });

  test.afterEach(async ({ page }) => AuthHelper.logout(page));

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const credentials = await AuthHelper.setupAuthWithEmailPassword(page, account);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await clanFactory.cleanupClan(page);
    await AuthHelper.logout(page);
    await context.close();
  });

  async function verifySwitchCanTurnOffAndOn(
    page: Page,
    type: 'activity' | 'notification'
  ): Promise<void> {
    const profilePage = new ProfilePage(page);

    await AllureReporter.step('Open User Settings', async () => {
      await profilePage.openUserSettingProfile();
    });

    await AllureReporter.step(`Open the ${type} settings tab`, async () => {
      await profilePage.openSettingsTab(type);
    });

    const initialState = await profilePage.isSettingsSwitchEnabled(type);
    await AllureReporter.addParameter('initialState', initialState ? 'ON' : 'OFF');

    try {
      await AllureReporter.step(`Turn OFF the ${type} switch`, async () => {
        await profilePage.setSettingsSwitch(type, false);
        expect(await profilePage.isSettingsSwitchEnabled(type)).toBe(false);
      });

      await AllureReporter.step(`Verify the ${type} OFF state persists after reload`, async () => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        await profilePage.openUserSettingProfile();
        await profilePage.openSettingsTab(type);
        expect(await profilePage.isSettingsSwitchEnabled(type)).toBe(false);
      });

      await AllureReporter.step(`Turn ON the ${type} switch`, async () => {
        await profilePage.setSettingsSwitch(type, true);
        expect(await profilePage.isSettingsSwitchEnabled(type)).toBe(true);
      });

      await AllureReporter.step(`Verify the ${type} ON state persists after reload`, async () => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        await profilePage.openUserSettingProfile();
        await profilePage.openSettingsTab(type);
        expect(await profilePage.isSettingsSwitchEnabled(type)).toBe(true);
      });
    } finally {
      await profilePage.ensureSettingsTabOpen(type);
      await profilePage.setSettingsSwitch(type, initialState);
    }
  }

  test('Verify that Activity can be turned OFF and ON in User Settings', async ({ page }) => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that the Activity setting can be turned OFF and ON.

      **Test Steps:**
      1. Open User Settings
      2. Turn OFF Activity and reload the page
      3. Verify Activity remains OFF
      4. Turn ON Activity and reload the page
      5. Verify Activity remains ON

      **Expected Result:** Activity can be toggled and its state persists after reload.
    `);
    await AllureReporter.addLabels({ tag: ['user-settings', 'activity', 'switch'] });
    await verifySwitchCanTurnOffAndOn(page, 'activity');
  });

  test('Verify that Notification can be turned OFF and ON in User Settings', async ({ page }) => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that the Notification setting can be turned OFF and ON.

      **Test Steps:**
      1. Open User Settings
      2. Turn OFF Notification and reload the page
      3. Verify Notification remains OFF
      4. Turn ON Notification and reload the page
      5. Verify Notification remains ON

      **Expected Result:** Notification can be toggled and its state persists after reload.
    `);
    await AllureReporter.addLabels({ tag: ['user-settings', 'notification', 'switch'] });
    await verifySwitchCanTurnOffAndOn(page, 'notification');
  });
});
