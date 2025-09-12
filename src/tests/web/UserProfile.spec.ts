import { AllureConfig, TestSetups } from '@/config/allure.config';
import { ProfilePage } from '@/pages/ProfilePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { expect, test } from '@playwright/test';

test.describe('User Profile - Clan Profiles', () => {
  let clanSetupHelper: ClanSetupHelper;
  let testClanUrl: string;
  let testClanName: string;

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);
    await clanSetupHelper.cleanupAllClans(browser, ClanSetupHelper.configs.userProfile.suiteName);

    const setupResult = await clanSetupHelper.setupTestClan(ClanSetupHelper.configs.userProfile);
    testClanUrl = setupResult.clanUrl;
    testClanName = setupResult.clanName;
  });

  test.afterAll(async () => {
    if (clanSetupHelper && testClanName && testClanUrl) {
      await clanSetupHelper.cleanupClan(
        testClanName,
        testClanUrl,
        ClanSetupHelper.configs.userProfile.suiteName
      );
    }
  });

  test.beforeEach(async ({ page }, testInfo) => {
    await AuthHelper.setAuthForSuite(page, 'User Profile');

    const profilePage = new ProfilePage(page);

    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63571',
    });

    await AllureReporter.step('Navigate to clan chat page', async () => {
      await page.goto(testClanUrl);
    });

    await AllureReporter.step('Open user settings profile', async () => {
      await profilePage.buttons.userSettingProfileButton.click();
    });

    await AllureReporter.addParameter('clanChatUrl', testClanUrl);
  });

  test('Change avatar clan - button visible', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.step('Navigate to profile tab', async () => {
      await profilePage.openProfileTab();
    });

    await AllureReporter.step('Navigate to clan profile tab', async () => {
      await profilePage.openClanProfileTab();
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that the "Change Avatar" button is visible in the clan profile section.
      
      **Test Steps:**
      1. Navigate to clan profile settings
      2. Locate the change avatar button
      3. Verify the button is visible and accessible
      
      **Expected Result:** The "Change Avatar" button should be visible and accessible to the user.
    `);

    await AllureReporter.addLabels({
      tag: ['user-profile', 'avatar-change', 'ui-visibility', 'clan-profile'],
    });

    await AllureReporter.step('Verify change avatar button is visible', async () => {
      const changeAvatarButton = profilePage.buttons.changeAvatarButton;
      await expect(changeAvatarButton).toBeVisible({ timeout: 5000 });
      await AllureReporter.addParameter('changeAvatarButtonVisible', 'Yes');
    });

    await AllureReporter.attachScreenshot(page, 'Change Avatar Button Visible');
  });

  test('Change clan nickname', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.step('Navigate to profile tab', async () => {
      await profilePage.openProfileTab();
    });

    await AllureReporter.step('Navigate to clan profile tab', async () => {
      await profilePage.openClanProfileTab();
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully change their clan nickname.
      
      **Test Steps:**
      1. Locate the nickname input field
      2. Clear existing nickname and enter new one
      3. Save the changes
      4. Verify the nickname has been updated
      
      **Expected Result:** The clan nickname should be successfully updated and saved.
    `);

    await AllureReporter.addLabels({
      tag: ['user-profile', 'nickname-change', 'profile-update', 'clan-profile'],
    });

    const target = `kien.trinhduy-${Date.now()}`;
    await AllureReporter.addParameter('newNickname', target);
    await AllureReporter.addParameter('platform', process.platform);

    await AllureReporter.step('Enter new nickname', async () => {
      const nicknameInput = profilePage.inputs.nicknameInput;
      await nicknameInput.click();

      const isMac = process.platform === 'darwin';
      await AllureReporter.addParameter('inputMethod', isMac ? 'Mac shortcuts' : 'PC shortcuts');

      let ok = false;
      for (let i = 0; i < 3; i++) {
        await nicknameInput.press(isMac ? 'Meta+A' : 'Control+A');
        await nicknameInput.press('Backspace');
        await page.waitForTimeout(50);
        await nicknameInput.type(target, { delay: 40 });
        await page.waitForTimeout(150);
        const v = await nicknameInput.inputValue();
        if (v === target) {
          ok = true;
          break;
        }
      }

      if (!ok) {
        await nicknameInput.evaluate((el: HTMLInputElement, value: string) => {
          el.value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, target);
      }

      await nicknameInput.evaluate((el: HTMLInputElement) => {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.blur();
      });

      await page.waitForTimeout(800);
      await expect(nicknameInput).toHaveValue(target, { timeout: 3000 });
      await AllureReporter.addParameter(
        'nicknameInputSuccess',
        ok ? 'Direct input' : 'Programmatic input'
      );
    });

    await AllureReporter.step('Save nickname changes', async () => {
      const saveChangesBtn = profilePage.buttons.saveChangesClanProfileButton;
      await saveChangesBtn.click();
      await AllureReporter.addParameter('saveButtonClicked', 'Yes');
    });

    await AllureReporter.attachScreenshot(page, 'Clan Nickname Changed Successfully');
  });

  test('Edit user profile - button visible', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.step('Navigate to account tab', async () => {
      await profilePage.openAccountTab();
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that the "Edit User Profile, Edit Display Name and Edit Username" button is visible in the clan profile section.
      
      **Test Steps:**
      1. Navigate to clan profile settings
      2. Navigate to account tab
      2. Click the Edit User Profile button, Edit Display Name button and Edit Username button
      3. Verify the all button is visible and accessible
      
      **Expected Result:** The "Edit User Profile, Edit Display Name and Edit Username" button should be visible and accessible to the user.
    `);

    await AllureReporter.addLabels({
      tag: ['user-profile', 'avatar-change', 'ui-visibility', 'clan-profile'],
    });

    const buttons = [
      profilePage.buttons.editUserprofileButton,
      profilePage.buttons.editDisplayNameButton,
      profilePage.buttons.editUserNameButton,
    ];

    for (const button of buttons) {
      await AllureReporter.step(`Click button: ${await button.textContent()}`, async () => {
        await button.click();
        await profilePage.expectProfileTabsVisible();
      });

      await profilePage.openAccountTab();
    }

    await AllureReporter.attachScreenshot(
      page,
      'Edit User Profile, Edit Display Name and Edit Username Button Visible'
    );
  });
});
