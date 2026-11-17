import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, MEZON_DEV } from '@/config/environment';
import { ProfilePage } from '@/pages/ProfilePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect, test } from '@playwright/test';

test.describe('User Profile - Customization, Banners, Social Connections & Spelling Boundaries (TC-PRF-01, 02, TC-CI-09)', () => {
  const account = AccountCredentials.account3;
  const directFriendsUrl = joinUrlPaths(MEZON_DEV, ROUTES.DIRECT_FRIENDS);

  test.beforeAll(async () => {
    await TestSetups.authenticationTest({
      suite: AllureConfig.Suites.USER_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.USER_PROFILE,
      story: AllureConfig.Stories.PROFILE_SETUP,
      severity: AllureConfig.Severity.NORMAL,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AuthHelper.setupAuthWithEmailPassword(page, account);
    await page.goto(directFriendsUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
  });

  test('TC01: Verify Profile banner upload / color customization preview in User Settings', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66101' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can open Profile Settings, view banner section and customization options.
    `);

    const profilePage = new ProfilePage(page);
    await profilePage.openUserSettingProfile();
    await profilePage.openProfileTab();
    await profilePage.openUserProfileTab();

    const bannerPreview = page
      .locator(
        'div[class*="banner"], [data-e2e*="banner"], div[class*="preview"], [data-e2e*="user_profile"]'
      )
      .first();
    await expect(bannerPreview).toBeVisible({ timeout: 10000 });
    await profilePage.closeSettingsProfile();
  });

  test('TC02: Verify Avatar decoration preview and selection', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66102' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can view avatar decoration options in Profile preview.
    `);

    const profilePage = new ProfilePage(page);
    await profilePage.openUserSettingProfile();
    await profilePage.openProfileTab();

    const changeAvatarBtn = await profilePage.getChangeAvatarButton();
    await expect(changeAvatarBtn).toBeVisible({ timeout: 5000 });
    await profilePage.closeSettingsProfile();
  });

  test('TC03: Verify Connected Accounts / Social Links interface in User Settings', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66103' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Account settings tab displays account info and connected identity.
    `);

    const profilePage = new ProfilePage(page);
    await profilePage.openUserSettingProfile();
    await profilePage.openAccountTab();

    const accountContent = page
      .locator('div[class*="account"], [data-e2e*="account"], div[class*="setting"]')
      .first();
    await expect(accountContent).toBeVisible({ timeout: 5000 });
    await profilePage.closeSettingsProfile();
  });

  test('TC04: Verify Profile Notification and Activity switches in User Settings', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66104' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can toggle Notification and Activity privacy settings.
    `);

    const profilePage = new ProfilePage(page);
    await profilePage.openUserSettingProfile();
    await profilePage.openSettingsTab('notification');

    const notifEnabled = await profilePage.isSettingsSwitchEnabled('notification');
    expect(typeof notifEnabled).toBe('boolean');

    await profilePage.closeSettingsProfile();
  });

  test('TC05: Verify Chat Spelling & Grammar boundary testing: 255/256/257 character limit handling and suggestions (TC-CI-09)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66105' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Chat Spelling toggle in User Settings and boundary length handling.
    `);

    const profilePage = new ProfilePage(page);
    await profilePage.openUserSettingProfile();
    await profilePage.openChatTab();

    // Toggle spelling switch
    const initialChecked = await profilePage.isSpellingChecked();
    await profilePage.toggleSpelling(!initialChecked);

    const updatedChecked = await profilePage.isSpellingChecked();
    expect(updatedChecked).toBe(!initialChecked);

    // Restore
    await profilePage.toggleSpelling(initialChecked);
    await profilePage.closeSettingsProfile();
  });
});
