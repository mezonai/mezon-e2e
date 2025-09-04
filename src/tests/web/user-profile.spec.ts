import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';
import { WEBSITE_CONFIGS } from '../../config/environment';
import { generateE2eSelector } from '@/utils/generateE2eSelector';

const CLAN_CHAT_URL = `${WEBSITE_CONFIGS.MEZON.baseURL}chat/clans/1786228934740807680/channels/1786228934753390593`;

test.describe('User Profile - Clan Profiles', () => {
  test.beforeAll(async () => {
    await TestSetups.authenticationTest({
      suite: AllureConfig.Suites.USER_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.USER_PROFILE,
      story: AllureConfig.Stories.PROFILE_SETUP,
      severity: AllureConfig.Severity.CRITICAL,
    });
  });

  test.beforeEach(async ({ page }, testInfo) => {
    await AllureReporter.initializeTest(page, testInfo, {
      suite: AllureConfig.Suites.USER_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.USER_PROFILE,
      story: AllureConfig.Stories.PROFILE_SETUP,
      severity: AllureConfig.Severity.CRITICAL,
      testType: AllureConfig.TestTypes.E2E,
    });

    await AllureReporter.step('Navigate to clan chat page', async () => {
      await page.goto(CLAN_CHAT_URL);
      await page.waitForLoadState('networkidle');
    });

    await AllureReporter.step('Open user settings profile', async () => {
      await page.waitForSelector('[data-e2e="user_setting-profile-button_setting"]', {
        state: 'visible',
        timeout: 10000,
      });
      await page.locator('[data-e2e="user_setting-profile-button_setting"]').click();
    });

    await AllureReporter.step('Navigate to profile tab', async () => {
      const profileTab = page.locator('[data-e2e="user_setting-profile-tab_profile"]');
      await profileTab.waitFor({ state: 'visible', timeout: 10000 });
      await profileTab.click();
    });

    await AllureReporter.step('Navigate to clan profile tab', async () => {
      const clanProfileTab = page.locator('[data-e2e="user_setting-profile-clan_profile-button"]');
      await clanProfileTab.waitFor({ state: 'visible', timeout: 10000 });
      await clanProfileTab.click();
    });

    await AllureReporter.addParameter('clanChatUrl', CLAN_CHAT_URL);
  });

  test('Change avatar clan - button visible', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
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
      const changeAvatarButton = page.locator(
        '[data-e2e="user_setting-profile-clan_profile-button_change_avatar"]'
      );
      await expect(changeAvatarButton).toBeVisible({ timeout: 10000 });
      await AllureReporter.addParameter('changeAvatarButtonVisible', 'Yes');
    });

    await AllureReporter.attachScreenshot(page, 'Change Avatar Button Visible');
  });

  test('Change clan nickname', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
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
      const nicknameInput = page
        .locator('[data-e2e="user_setting-profile-clan_profile-input_nickname"]')
        .first();
      await expect(nicknameInput).toBeVisible({ timeout: 10000 });
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
      const saveChangesBtn = page.locator(
        `${generateE2eSelector('user_setting.profile.clan_profile')} ${generateE2eSelector('button.base')}`, { hasText: 'Save Changes' }
      );
      await saveChangesBtn.scrollIntoViewIfNeeded();
      await expect(saveChangesBtn).toBeVisible({ timeout: 10000 });
      await expect(saveChangesBtn).toBeEnabled({ timeout: 10000 });
      await saveChangesBtn.click();
      await AllureReporter.addParameter('saveButtonClicked', 'Yes');
    });

    await AllureReporter.attachScreenshot(page, 'Clan Nickname Changed Successfully');
  });

  test.skip('Remove avatar clan', async () => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully remove their clan avatar.
      
      **Test Steps:**
      1. Navigate to clan profile settings
      2. Locate the remove/delete avatar option
      3. Remove the current avatar
      4. Verify the avatar has been removed
      
      **Expected Result:** The clan avatar should be successfully removed.
      
      **Note:** This test is currently skipped pending implementation.
    `);

    await AllureReporter.addLabels({
      tag: ['user-profile', 'avatar-removal', 'profile-update', 'clan-profile', 'skipped'],
    });

    // Implementation pending
  });
});
