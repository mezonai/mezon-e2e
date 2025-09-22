import { AllureConfig, TestSetups } from '@/config/allure.config';
import { MessagePage } from '@/pages/MessagePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getImageHash } from '@/utils/images';
import generateRandomString from '@/utils/randomString';
import { FileSizeTestHelpers } from '@/utils/uploadFileHelpers';
import { expect, Locator, test } from '@playwright/test';

test.describe('User Profile - Clan Profiles', () => {
  let clanSetupHelper: ClanSetupHelper;
  let testClanUrl: string;
  let clanName: string;

  test.use({ storageState: 'playwright/.auth/account6.json' });

  test.beforeAll(async ({ browser }) => {
    await TestSetups.authenticationTest({
      suite: AllureConfig.Suites.USER_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.USER_PROFILE,
      story: AllureConfig.Stories.PROFILE_SETUP,
      severity: AllureConfig.Severity.CRITICAL,
    });

    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(ClanSetupHelper.configs.userProfile);
    testClanUrl = setupResult.clanUrl;
    clanName = setupResult.clanName;
  });

  test.afterAll(async () => {
    if (clanSetupHelper && clanName && testClanUrl) {
      await clanSetupHelper.cleanupClan(
        clanName,
        testClanUrl,
        ClanSetupHelper.configs.userProfile.suiteName
      );
    }
  });

  test.beforeEach(async ({ page }) => {
    const profilePage = new ProfilePage(page);

    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63571',
    });

    await AllureReporter.step('Navigate to clan chat page', async () => {
      await page.goto(testClanUrl);
    });

    await AllureReporter.step('Open user settings profile', async () => {
      await profilePage.buttons.userSettingProfile.click();
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
      const changeAvatarButton = profilePage.buttons.changeAvatar;
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
      const nicknameInput = profilePage.inputs.nickname;
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
      const saveChangesBtn = profilePage.buttons.saveChangesClanProfile;
      await saveChangesBtn.click();
      await AllureReporter.addParameter('saveButtonClicked', 'Yes');
    });

    await AllureReporter.attachScreenshot(page, 'Clan Nickname Changed Successfully');
  });

  // test.skip('Remove avatar clan', async ({ page }) => {
  //   const profilePage = new ProfilePage(page);
  //   await AllureReporter.addTestParameters({
  //     testType: AllureConfig.TestTypes.E2E,
  //     userType: AllureConfig.UserTypes.AUTHENTICATED,
  //     severity: AllureConfig.Severity.NORMAL,
  //   });

  //   await AllureReporter.step('Navigate to profile tab', async () => {
  //     await profilePage.openProfileTab();
  //   });

  //   await AllureReporter.step('Navigate to clan profile tab', async () => {
  //     await profilePage.openClanProfileTab();
  //   });

  //   await AllureReporter.addDescription(`
  //     **Test Objective:** Verify that a user can successfully remove their clan avatar.

  //     **Test Steps:**
  //     1. Navigate to clan profile settings
  //     2. Locate the remove/delete avatar option
  //     3. Remove the current avatar
  //     4. Verify the avatar has been removed

  //     **Expected Result:** The clan avatar should be successfully removed.

  //     **Note:** This test is currently skipped pending implementation.
  //   `);

  //   await AllureReporter.addLabels({
  //     tag: ['user-profile', 'avatar-removal', 'profile-update', 'clan-profile', 'skipped'],
  //   });

  //   // Implementation pending
  // });

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
      profilePage.buttons.editUserprofile,
      profilePage.buttons.editDisplayName,
      profilePage.buttons.editUserName,
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

  test('Update avatar user profile - button visible', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    const directMessagePage = new MessagePage(page);
    const fileSizeHelpers = new FileSizeTestHelpers(page);
    let profileAvatar: Locator;
    let footerAvatar: Locator;
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that the "Update Avatar" button is visible in the user profile section.
      
      **Test Steps:**
      1. Navigate to user profile settings
      2. Locate the update avatar button
      3. Verify the button is visible and accessible
      
      **Expected Result:** The "Update Avatar" button should be visible and accessible to the user.
    `);

    await AllureReporter.step('Navigate to profile tab', async () => {
      await profilePage.openProfileTab();
    });

    await AllureReporter.step('Navigate to user profile tab', async () => {
      await profilePage.openUserProfileTab();
    });

    const smallAvatarPath = await fileSizeHelpers.createFileWithSize(
      'small_avatar',
      5 * 1024 * 1024,
      'jpg'
    );

    await fileSizeHelpers.uploadFileDefault(smallAvatarPath);
    await profilePage.buttons.applyImageAvatar.click();
    await profilePage.buttons.saveChangesUserProfile.click();

    profileAvatar = profilePage.userProfile.avatar;
    await expect(profileAvatar).toBeVisible({ timeout: 5000 });
    const profileSrc = await profileAvatar.getAttribute('src');
    const profileHash = await getImageHash(profileSrc || '');

    await profilePage.navigate('/chat/direct/friends');
    footerAvatar = directMessagePage.footerAvatar;
    await expect(footerAvatar).toBeVisible({ timeout: 5000 });
    const footerSrc = await footerAvatar.getAttribute('src');
    const footerHash = await getImageHash(footerSrc || '');

    expect(profileHash).not.toBeNull();
    expect(footerHash).not.toBeNull();

    expect(profileHash).toEqual(footerHash);
  });

  // test('Change display name profile', async ({ page }) => {
  //   const profilePage = new ProfilePage(page);
  //   await AllureReporter.addTestParameters({
  //     testType: AllureConfig.TestTypes.E2E,
  //     userType: AllureConfig.UserTypes.AUTHENTICATED,
  //     severity: AllureConfig.Severity.CRITICAL,
  //   });

  //   await AllureReporter.step('Navigate to profile tab', async () => {
  //     await profilePage.openProfileTab();
  //   });

  //   await AllureReporter.step('Navigate to user profile tab', async () => {
  //     await profilePage.openUserProfileTab();
  //   });

  //   await AllureReporter.addDescription(`
  //     **Test Objective:** Verify that a user can successfully change their display name profile.

  //     **Test Steps:**
  //     1. Locate the display name input field
  //     2. Clear existing display name and enter new one
  //     3. Save the changes
  //     4. Verify the display name has been updated

  //     **Expected Result:** The clan display name should be successfully updated and saved.
  //   `);

  //   await AllureReporter.addLabels({
  //     tag: ['user-profile', 'nickname-change', 'profile-update', 'clan-profile'],
  //   });

  //   const target = `acc.automationtest-${Date.now()}`;
  //   await AllureReporter.addParameter('newDisplayname', target);
  //   await AllureReporter.addParameter('platform', process.platform);

  //   await AllureReporter.step('Enter new display name', async () => {
  //     const displayNameInput = profilePage.inputs.displayNameInput;
  //     await expect(displayNameInput).toBeVisible({ timeout: 5000 });
  //     await displayNameInput.click();

  //     const isMac = process.platform === 'darwin';
  //     await AllureReporter.addParameter('inputMethod', isMac ? 'Mac shortcuts' : 'PC shortcuts');

  //     let ok = false;
  //     for (let i = 0; i < 3; i++) {
  //       await displayNameInput.press(isMac ? 'Meta+A' : 'Control+A');
  //       await displayNameInput.press('Backspace');
  //       await page.waitForTimeout(50);
  //       await displayNameInput.type(target, { delay: 40 });
  //       await page.waitForTimeout(150);
  //       const v = await displayNameInput.inputValue();
  //       if (v === target) {
  //         ok = true;
  //         break;
  //       }
  //     }

  //     if (!ok) {
  //       await displayNameInput.evaluate((el: HTMLInputElement, value: string) => {
  //         el.value = value;
  //         el.dispatchEvent(new Event('input', { bubbles: true }));
  //         el.dispatchEvent(new Event('change', { bubbles: true }));
  //       }, target);
  //     }

  //     await displayNameInput.evaluate((el: HTMLInputElement) => {
  //       el.dispatchEvent(new Event('input', { bubbles: true }));
  //       el.dispatchEvent(new Event('change', { bubbles: true }));
  //       el.blur();
  //     });

  //     await page.waitForTimeout(800);
  //     await expect(displayNameInput).toHaveValue(target, { timeout: 3000 });
  //     await AllureReporter.addParameter(
  //       'dispalyNameInputSuccess',
  //       ok ? 'Direct input' : 'Programmatic input'
  //     );
  //   });
  //   await AllureReporter.step('Save display name', async () => {
  //     const saveChangesBtn = profilePage.buttons.saveChangesUserProfileButton;
  //     await saveChangesBtn.scrollIntoViewIfNeeded();
  //     await expect(saveChangesBtn).toBeVisible({ timeout: 1000 });
  //     await expect(saveChangesBtn).toBeEnabled({ timeout: 1000 });
  //     await saveChangesBtn.click();
  //     await AllureReporter.addParameter('saveButtonClicked', 'Yes');
  //   });

  //   await AllureReporter.step('Verify display name has been changed successfully', async () => {
  //     await profilePage.verifyDisplayNameUpdated(target);
  //   });

  //   await AllureReporter.attachScreenshot(page, 'Display Name Changed Successfully');
  // });

  test('Update About me status', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63571',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully change their About me status.

      **Test Steps:**
      1. Locate the About me status input field
      2. Clear existing About me status and enter new one
      3. Verify save changes button visible
      4. Verify that the length of the "About Me" status is reflected correctly.
      5. Save the changes
      6. Verify the About me status has been updated

      **Expected Result:** The About me status should be successfully updated and saved.
    `);

    const profilePage = new ProfilePage(page);
    await AllureReporter.step('Navigate to profile tab', async () => {
      await profilePage.openProfileTab();
    });

    await AllureReporter.step('Navigate to user profile tab', async () => {
      await profilePage.openUserProfileTab();
    });

    await AllureReporter.addLabels({
      tag: ['user-profile'],
    });

    const target = `about me status - ${generateRandomString(10)}`;
    await AllureReporter.addParameter('newAboutMeStatus', target);
    await AllureReporter.addParameter('platform', process.platform);

    await AllureReporter.step('Enter new about me status and save button visible', async () => {
      await profilePage.enterAboutMeStatus(target);
      const saveChangesBtn = profilePage.buttons.saveChangesUserProfile;
      await expect(saveChangesBtn).toBeVisible({ timeout: 500 });
      await expect(saveChangesBtn).toBeEnabled({ timeout: 500 });
    });

    await AllureReporter.step('Verify length of new about me status', async () => {
      await profilePage.validateLength(target);
    });

    await AllureReporter.step('Save About me status', async () => {
      await profilePage.buttons.saveChangesUserProfile.click();
    });

    await AllureReporter.step(
      'Verify About me status has been changed successfully at About me input',
      async () => {
        await page.reload();
        await profilePage.openUserSettingProfile();
        await profilePage.openProfileTab();
        await profilePage.openUserProfileTab();
        await profilePage.verifyAboutMeStatusUpdated(target);
      }
    );

    const mentionText = `mention text - ${generateRandomString(10)}`;
    await AllureReporter.step(
      'Verify About me status has been changed successfully at short profile',
      async () => {
        await page.reload();
        await profilePage.sendMessage(mentionText);
        await profilePage.verifyAboutMeStatusInShortProfile(target);
      }
    );

    await AllureReporter.attachScreenshot(page, 'About me status Changed Successfully');
  });
});

test.describe('User Profile - Update avatar', () => {
  let clanSetupHelper: ClanSetupHelper;
  let testClanUrl: string;
  let clanName: string;
  let profileHash: string | null = null;

  test.use({ storageState: 'playwright/.auth/account6.json' });

  test.beforeAll(async ({ browser }) => {
    await TestSetups.authenticationTest({
      suite: AllureConfig.Suites.USER_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.USER_PROFILE,
      story: AllureConfig.Stories.PROFILE_SETUP,
      severity: AllureConfig.Severity.CRITICAL,
    });

    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(ClanSetupHelper.configs.userProfile);
    testClanUrl = setupResult.clanUrl;
    clanName = setupResult.clanName;

    const page = await browser.newPage();
    await page.goto(testClanUrl);
    const profilePage = new ProfilePage(page);

    await AllureReporter.step('Open user settings profile', async () => {
      await profilePage.buttons.userSettingProfile.click();
    });

    const fileSizeHelpers = new FileSizeTestHelpers(page);
    let profileAvatar: Locator;
    let footerAvatar: Locator;
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that the "Update Avatar" button is visible in the user profile section.
      
      **Test Steps:**
      1. Navigate to user profile settings
      2. Locate the update avatar button
      3. Verify the button is visible and accessible
      
      **Expected Result:** The "Update Avatar" button should be visible and accessible to the user.
    `);

    await AllureReporter.step('Navigate to profile tab', async () => {
      await profilePage.openProfileTab();
    });

    await AllureReporter.step('Navigate to user profile tab', async () => {
      await profilePage.openUserProfileTab();
    });

    const smallAvatarPath = await fileSizeHelpers.createFileWithSize(
      'small_avatar',
      5 * 1024 * 1024,
      'jpg'
    );

    await fileSizeHelpers.uploadFileDefault(smallAvatarPath);
    await profilePage.buttons.applyImageAvatar.click();
    await profilePage.buttons.saveChangesUserProfile.click();

    profileAvatar = profilePage.userProfile.avatar;
    await expect(profileAvatar).toBeVisible({ timeout: 5000 });
    const profileSrc = await profileAvatar.getAttribute('src');
    profileHash = await getImageHash(profileSrc || '');
  });

  test.afterAll(async () => {
    if (clanSetupHelper && clanName && testClanUrl) {
      await clanSetupHelper.cleanupClan(
        clanName,
        testClanUrl,
        ClanSetupHelper.configs.userProfile.suiteName
      );
    }
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.step('Navigate to clan chat page', async () => {
      await page.goto(testClanUrl);
    });
  });

  test('Validate footer avatar', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63364',
    });

    const profilePage = new ProfilePage(page);
    const directMessagePage = new MessagePage(page);

    let footerAvatar: Locator;

    await profilePage.navigate('/chat/direct/friends');
    footerAvatar = directMessagePage.footerAvatar;
    await expect(footerAvatar).toBeVisible({ timeout: 5000 });
    const footerSrc = await footerAvatar.getAttribute('src');
    const footerHash = await getImageHash(footerSrc || '');

    expect(profileHash).not.toBeNull();
    expect(footerHash).not.toBeNull();

    expect(profileHash).toEqual(footerHash);
  });
});
