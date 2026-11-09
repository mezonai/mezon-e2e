import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ProfilePage } from '@/pages/ProfilePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import { joinUrlPaths } from '@/utils/joinUrlPaths';
import { expect, test } from '@playwright/test';

test.describe('User Profile & Clan Profile - Reset Changes and Custom Status Lifecycle', () => {
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
    const credentials = await AuthHelper.setupAuthWithEmailPassword(page, account);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await AllureReporter.addParameter('clanName', clanFactory.getClanName());
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const credentials = await AuthHelper.setupAuthWithEmailPassword(page, account);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await clanFactory.cleanupClan(page);
    await AuthHelper.logout(page);
    await context.close();
  });

  test('TC01: Reset Clan Profile nickname changes without saving', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that clicking Reset in Clan Profile discards uncommitted nickname changes.

      **Test Steps:**
      1. Open User Settings -> Profile -> Clan Profile
      2. Record current clan nickname
      3. Enter a new draft nickname
      4. Click Reset button
      5. Verify nickname reverts to the original value
    `);

    const profilePage = new ProfilePage(page);

    await AllureReporter.step('Navigate to Clan Profile tab', async () => {
      await profilePage.openUserSettingProfile();
      await profilePage.openProfileTab();
      await profilePage.openClanProfileTab();
    });

    const nicknameInput = await profilePage.getInputNickname();
    await expect(nicknameInput).toBeVisible({ timeout: 10000 });

    const draftNickname = `draft-nick-${Date.now().toString(36)}`;
    await AllureReporter.step('Enter uncommitted nickname changes', async () => {
      await nicknameInput.focus();
      await page.waitForTimeout(500);
      await nicknameInput.press('Control+A');
      await nicknameInput.press('Backspace');
      await page.keyboard.type(draftNickname, { delay: 80 });
      await expect(nicknameInput).toHaveValue(draftNickname, { timeout: 5000 });
    });

    await AllureReporter.step(
      'Click Reset button and verify original nickname restored',
      async () => {
        await profilePage.resetChangesClanProfile();
        const resetValue = await nicknameInput.inputValue();
        expect(resetValue).not.toBe(draftNickname);
        await profilePage.closeSettingsProfile();
      }
    );
  });

  test('TC02: Reset User Profile About Me changes without saving', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that clicking Reset in User Profile discards uncommitted About Me changes.

      **Test Steps:**
      1. Open User Settings -> Profile -> User Profile
      2. Record current About Me content
      3. Enter a new draft About Me text
      4. Click Reset button
      5. Verify About Me reverts to original value
    `);

    const profilePage = new ProfilePage(page);

    await AllureReporter.step('Navigate to User Profile tab', async () => {
      await profilePage.openUserSettingProfile();
      await profilePage.openProfileTab();
      await profilePage.openUserProfileTab();
    });

    const aboutMeInput = profilePage.getAboutMeInput();
    await expect(aboutMeInput).toBeVisible({ timeout: 10000 });
    const originalAboutMe = await aboutMeInput.inputValue();

    await AllureReporter.step('Enter uncommitted About Me changes', async () => {
      const draftAboutMe = `draft about me ${Date.now().toString(36)}`;
      await aboutMeInput.focus();
      await aboutMeInput.fill(draftAboutMe);
      await expect(aboutMeInput).toHaveValue(draftAboutMe, { timeout: 5000 });
    });

    await AllureReporter.step(
      'Click Reset button and verify original About Me restored',
      async () => {
        await profilePage.resetChangesUserProfile();
        await expect(aboutMeInput).toHaveValue(originalAboutMe, { timeout: 5000 });
        await profilePage.closeSettingsProfile();
      }
    );
  });

  test('TC03: Set and Clear Custom Status from Short Profile', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can set a custom status and subsequently clear it via the custom status modal.

      **Test Steps:**
      1. Open Footer Profile modal and open Custom Status modal
      2. Set a new custom status and save
      3. Verify custom status appears in footer profile
      4. Clear custom status via edit modal
      5. Verify custom status is removed from footer profile
    `);

    const profilePage = new ProfilePage(page);
    const customStatus = `Active status ${Date.now().toString(36)}`;

    await AllureReporter.step('Set custom status', async () => {
      await profilePage.openFooterProfileModal();
      await profilePage.openCustomStatusModal();
      await profilePage.setCustomStatus(customStatus);
      await profilePage.verifyCustomStatusSettedInFooterProfile(customStatus);
    });

    await AllureReporter.step('Clear custom status and verify removed', async () => {
      await profilePage.clearCustomStatus();
      await profilePage.verifyCustomStatusClearedInFooterProfile();
    });
  });

  test('TC04: Open User Settings directly from Footer Profile Settings gear icon', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that clicking the settings gear icon in footer profile opens User Settings with tab navigation.

      **Test Steps:**
      1. Click footer profile settings gear icon
      2. Verify User Settings Profile page is displayed
      3. Navigate between profile tabs
      4. Close Settings page
    `);

    const profilePage = new ProfilePage(page);

    await AllureReporter.step('Open User Settings via footer gear icon', async () => {
      await profilePage.openUserSettingProfile();
      await profilePage.openProfileTab();
      await profilePage.expectProfileTabsVisible();
    });

    await AllureReporter.step(
      'Switch to Clan Profile tab and back to User Profile tab',
      async () => {
        await profilePage.openClanProfileTab();
        const nicknameInput = await profilePage.getInputNickname();
        await expect(nicknameInput).toBeVisible({ timeout: 5000 });

        await profilePage.openUserProfileTab();
        const aboutMeInput = profilePage.getAboutMeInput();
        await expect(aboutMeInput).toBeVisible({ timeout: 5000 });
      }
    );

    await AllureReporter.step('Close Settings profile', async () => {
      await profilePage.closeSettingsProfile();
    });
  });
});
