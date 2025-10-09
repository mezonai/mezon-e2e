import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { MessagePage } from '@/pages/MessagePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { getImageHash } from '@/utils/images';
import { joinUrlPaths } from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import generateRandomString from '@/utils/randomString';
import { FileSizeTestHelpers } from '@/utils/uploadFileHelpers';
import { expect, Locator, test } from '@playwright/test';

test.describe('User Settings', () => {
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await TestSetups.authenticationTest({
      suite: AllureConfig.Suites.USER_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.USER_PROFILE,
      story: AllureConfig.Stories.PROFILE_SETUP,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account6);
    await clanFactory.setupClan(ClanSetupHelper.configs.userProfile, page);

    clanFactory.setClanUrl(
      joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, splitDomainAndPath(clanFactory.getClanUrl()).path)
    );
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63571',
    });

    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account6
    );
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await AllureReporter.addParameter('clanName', clanFactory.getClanName());
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account6
    );
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await clanFactory.cleanupClan(page);
    await AuthHelper.logout(page);
    await context.close();
  });

  test('Change avatar clan - button visible', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.step('Navigate to profile tab', async () => {
      await profilePage.openUserSettingProfile();
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
      await profilePage.openUserSettingProfile();
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

  test('Edit user profile - button visible', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.step('Navigate to account tab', async () => {
      await profilePage.openUserSettingProfile();
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

  // test('Update avatar user profile - button visible', async ({ page }) => {
  //   const profilePage = new ProfilePage(page);
  //   const directMessagePage = new MessagePage(page);
  //   const fileSizeHelpers = new FileSizeTestHelpers(page);
  //   await AllureReporter.addTestParameters({
  //     testType: AllureConfig.TestTypes.E2E,
  //     userType: AllureConfig.UserTypes.AUTHENTICATED,
  //     severity: AllureConfig.Severity.NORMAL,
  //   });

  //   await AllureReporter.addDescription(`
  //     **Test Objective:** Verify that the "Update Avatar" button is visible in the user profile section.

  //     **Test Steps:**
  //     1. Navigate to user profile settings
  //     2. Locate the update avatar button
  //     3. Verify the button is visible and accessible

  //     **Expected Result:** The "Update Avatar" button should be visible and accessible to the user.
  //   `);

  //   await AllureReporter.step('Navigate to profile tab', async () => {
  //     await profilePage.openUserSettingProfile();
  //     await profilePage.openProfileTab();
  //   });

  //   await AllureReporter.step('Navigate to user profile tab', async () => {
  //     await profilePage.openUserProfileTab();
  //   });

  //   const smallAvatarPath = await fileSizeHelpers.createFileWithSize(
  //     'small_avatar',
  //     5 * 1024 * 1024,
  //     'jpg'
  //   );

  //   await fileSizeHelpers.uploadFileDefault(smallAvatarPath);
  //   await profilePage.buttons.applyImageAvatar.click();
  //   await profilePage.buttons.saveChangesUserProfile.click();

  //   const profileAvatar: Locator = profilePage.userProfile.avatar;
  //   await expect(profileAvatar).toBeVisible({ timeout: 5000 });
  //   const profileSrc = await profileAvatar.getAttribute('src');
  //   const profileHash = await getImageHash(profileSrc || '');

  //   await profilePage.navigate('/chat/direct/friends');
  //   const footerAvatar: Locator = directMessagePage.footerAvatar;
  //   await expect(footerAvatar).toBeVisible({ timeout: 5000 });
  //   const footerSrc = await footerAvatar.getAttribute('src');
  //   const footerHash = await getImageHash(footerSrc || '');

  //   expect(profileHash).not.toBeNull();
  //   expect(footerHash).not.toBeNull();

  //   expect(profileHash).toEqual(footerHash);
  // });

  // test('Update About me status', async ({ page }) => {
  //   await AllureReporter.addWorkItemLinks({
  //     tms: '63571',
  //   });

  //   await AllureReporter.addDescription(`
  //     **Test Objective:** Verify that a user can successfully change their About me status.

  //     **Test Steps:**
  //     1. Locate the About me status input field
  //     2. Clear existing About me status and enter new one
  //     3. Verify save changes button visible
  //     4. Verify that the length of the "About Me" status is reflected correctly.
  //     5. Save the changes
  //     6. Verify the About me status has been updated

  //     **Expected Result:** The About me status should be successfully updated and saved.
  //   `);

  //   const profilePage = new ProfilePage(page);
  //   await AllureReporter.step('Navigate to profile tab', async () => {
  //     await profilePage.openUserSettingProfile();
  //     await profilePage.openProfileTab();
  //   });

  //   await AllureReporter.step('Navigate to user profile tab', async () => {
  //     await profilePage.openUserProfileTab();
  //   });

  //   await AllureReporter.addLabels({
  //     tag: ['user-profile'],
  //   });

  //   const target = `about me status - ${generateRandomString(10)}`;
  //   await AllureReporter.addParameter('newAboutMeStatus', target);
  //   await AllureReporter.addParameter('platform', process.platform);

  //   await AllureReporter.step('Enter new about me status and save button visible', async () => {
  //     await profilePage.enterAboutMeStatus(target);
  //     const saveChangesBtn = profilePage.buttons.saveChangesUserProfile;
  //     await expect(saveChangesBtn).toBeVisible({ timeout: 500 });
  //     await expect(saveChangesBtn).toBeEnabled({ timeout: 500 });
  //   });

  //   await AllureReporter.step('Verify length of new about me status', async () => {
  //     await profilePage.validateLength(target);
  //   });

  //   await AllureReporter.step('Save About me status', async () => {
  //     await profilePage.buttons.saveChangesUserProfile.click();
  //   });

  //   await AllureReporter.step(
  //     'Verify About me status has been changed successfully at About me input',
  //     async () => {
  //       await page.reload();
  //       await profilePage.openUserSettingProfile();
  //       await profilePage.openProfileTab();
  //       await profilePage.openUserProfileTab();
  //       await profilePage.verifyAboutMeStatusUpdated(target);
  //     }
  //   );

  //   const mentionText = `mention text - ${generateRandomString(10)}`;
  //   await AllureReporter.step(
  //     'Verify About me status has been changed successfully at short profile',
  //     async () => {
  //       await page.reload();
  //       await profilePage.sendMessage(mentionText);
  //       await profilePage.verifyAboutMeStatusInShortProfile(target);
  //     }
  //   );

  //   await AllureReporter.attachScreenshot(page, 'About me status Changed Successfully');
  // });
});

test.describe('Clan Profile - Update avatar', () => {
  let profileHash: string | null = null;
  let profilePage: ProfilePage;
  const message = `message - ${generateRandomString(10)}`;
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    await TestSetups.authenticationTest({
      suite: AllureConfig.Suites.USER_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.USER_PROFILE,
      story: AllureConfig.Stories.PROFILE_SETUP,
      severity: AllureConfig.Severity.CRITICAL,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account6);
    await clanFactory.setupClan(ClanSetupHelper.configs.userProfile, page);

    clanFactory.setClanUrl(
      joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, splitDomainAndPath(clanFactory.getClanUrl()).path)
    );

    profilePage = new ProfilePage(page);

    await AllureReporter.step('Open user settings profile', async () => {
      await profilePage.buttons.userSettingProfile.click();
    });

    const fileSizeHelpers = new FileSizeTestHelpers(page);
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that the "Update Avatar" button is visible in the user profile section.
      
      **Test Steps:**
      1. Navigate to clan profile settings
      2. Update avatar
      3. Verify avatar has been updated
      
      **Expected Result:** The avatar should be successfully updated and saved.
    `);

    await AllureReporter.step('Navigate to clan profile settings', async () => {
      await profilePage.openProfileTab();
      await profilePage.openClanProfileTab();
    });

    const smallAvatarPath = await fileSizeHelpers.createFileWithSize(
      'small_avatar',
      7 * 1024 * 1024,
      'jpg'
    );

    await fileSizeHelpers.uploadFileDefault(smallAvatarPath);
    await profilePage.buttons.applyImageAvatar.click();
    await profilePage.buttons.saveChangesClanProfile.click();

    const profileAvatar: Locator = profilePage.clanProfile.avatar;
    await expect(profileAvatar).toBeVisible({ timeout: 5000 });
    const profileSrc = await profileAvatar.getAttribute('src');
    profileHash = await getImageHash(profileSrc || '');

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account6
    );
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await AllureReporter.addParameter('clanName', clanFactory.getClanName());
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account6
    );
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await clanFactory.cleanupClan(page);
    await AuthHelper.logout(page);
    await context.close();
  });

  test('Validate avatar user in clan profile', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63364',
    });

    await page.waitForTimeout(500);

    const profilePage = new ProfilePage(page);

    await profilePage.openUserSettingProfile();
    await profilePage.openProfileTab();
    await profilePage.openClanProfileTab();
    await page.waitForTimeout(500);
    const avatar = await profilePage.clanProfile.avatar;
    await expect(avatar).toBeVisible({ timeout: 5000 });
    const avatarSrc = await avatar.getAttribute('src');
    const avatarHash = await getImageHash(avatarSrc || '');

    expect(profileHash).not.toBeNull();
    expect(avatarHash).not.toBeNull();

    expect(profileHash).toEqual(avatarHash);
  });

  test('Validate avatar user when send message in clan', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63364',
    });

    const messageHelper = new MessageTestHelpers(page);

    await page.waitForTimeout(2000);
    const messageSended = await messageHelper.sendTextMessageAndGetItem(message);
    await page.waitForTimeout(1000);
    const avatar = await messageSended.locator(generateE2eSelector('avatar.image'));
    await expect(avatar).toBeVisible({ timeout: 5000 });
    const avatarSrc = await avatar.getAttribute('src');
    const avatarHash = await getImageHash(avatarSrc || '');

    expect(profileHash).not.toBeNull();
    expect(avatarHash).not.toBeNull();

    expect(profileHash).toEqual(avatarHash);
  });

  test('Validate avatar when click user name', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63364',
    });

    const clanPage = new ClanPageV2(page);
    await clanPage.createNewChannel(ChannelType.TEXT, generateRandomString(10));
    await page.waitForTimeout(1000);

    const messageHelper = new MessageTestHelpers(page);
    let messageSended = messageHelper.getMessageItemLocator(message).last();

    if (!(await messageSended.isVisible({ timeout: 2000 }))) {
      messageSended = await messageHelper.sendTextMessageAndGetItem(message);
      await page.waitForTimeout(1000);
    }

    const profileName = await messageSended.locator(
      generateE2eSelector('base_profile.display_name')
    );

    await profileName.click();
    const popup = page.locator('div.fixed.z-50');
    await expect(popup).toBeVisible({ timeout: 5000 });
    const profileAvatar = popup.locator(
      `${generateE2eSelector('user_setting.profile.user_profile.preview.avatar')} ${generateE2eSelector('avatar.image')}`
    );

    await expect(profileAvatar).toBeVisible({ timeout: 5000 });
    const avatarSrc = await profileAvatar.getAttribute('src');
    const avatarHash = await getImageHash(avatarSrc || '');

    expect(profileHash).not.toBeNull();
    expect(avatarHash).not.toBeNull();

    expect(profileHash).toEqual(avatarHash);
  });

  // test('Validate avatar when click mention', async ({ page }) => {
  //   await AllureReporter.addWorkItemLinks({
  //     parrent_issue: '63364',
  //   });

  //   const messageHelper = new MessageTestHelpers(page);
  //   const clanPage = new ClanPageV2(page);
  //   await page.waitForTimeout(1000);
  //   const username = await clanPage.footerProfile.userName.textContent();
  //   await page.waitForTimeout(500);
  //   await messageHelper.mentionUserAndSend(`@${username}`, [username || '']);
  //   await page.waitForTimeout(500);
  //   const mentionItem = messageHelper
  //     .getMessageItemLocator(`@${username}`)
  //     .last()
  //     .locator(generateE2eSelector('chat.channel_message.mention_user'));
  //   await mentionItem.click();
  //   await page.waitForTimeout(500);
  //   const profileAvatar = profilePage.userProfile.avatar;
  //   await expect(profileAvatar).toBeVisible({ timeout: 5000 });
  //   const avatarSrc = await profileAvatar.getAttribute('src');
  //   const avatarHash = await getImageHash(avatarSrc || '');

  //   expect(profileHash).not.toBeNull();
  //   expect(avatarHash).not.toBeNull();

  //   expect(profileHash).toEqual(avatarHash);
  // });

  test('Validate avatar in pin message modal', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63364',
    });

    const messageHelper = new MessageTestHelpers(page);
    await page.waitForTimeout(1000);
    const messageToPinText = `Message to pin ${Date.now()}`;
    await messageHelper.sendTextMessage(messageToPinText);
    const targetMessage = await messageHelper.findLastMessage();
    await messageHelper.pinMessage(targetMessage);
    await messageHelper.openPinnedMessagesModal();

    const pinMessageAvt = (await messageHelper.getThePinMessageItem(messageToPinText)).locator(
      generateE2eSelector('avatar.image')
    );
    await expect(pinMessageAvt).toBeVisible({ timeout: 5000 });
    const avatarSrc = await pinMessageAvt.getAttribute('src');
    const avatarHash = await getImageHash(avatarSrc || '');

    expect(profileHash).not.toBeNull();
    expect(avatarHash).not.toBeNull();

    expect(profileHash).toEqual(avatarHash);
  });

  test('Validate avatar in member list', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63364',
    });

    await page.waitForTimeout(1000);
    const clanPage = new ClanPageV2(page);
    await clanPage.openMemberList();
    const userName = await clanPage.footerProfile.userName.textContent();
    const memberItem = await clanPage.getMemberFromMemberList(userName || '');
    const memberAvatar = memberItem.locator(generateE2eSelector('avatar.image'));
    await expect(memberAvatar).toBeVisible({ timeout: 5000 });
    const avatarSrc = await memberAvatar.getAttribute('src');
    const avatarHash = await getImageHash(avatarSrc || '');

    expect(profileHash).not.toBeNull();
    expect(avatarHash).not.toBeNull();

    expect(profileHash).toEqual(avatarHash);
  });

  test('Validate avatar in member list click username', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63364',
    });

    await page.waitForTimeout(1000);
    const clanPage = new ClanPageV2(page);
    await clanPage.openMemberList();
    const userName = await clanPage.footerProfile.userName.textContent();
    const memberItem = await clanPage.getMemberFromMemberList(userName || '');
    memberItem.click();
    const popup = page.locator('div.fixed.z-50');
    await expect(popup).toBeVisible({ timeout: 5000 });
    const profileAvatar = popup.locator(
      `${generateE2eSelector('user_setting.profile.user_profile.preview.avatar')} ${generateE2eSelector('avatar.image')}`
    );
    await expect(profileAvatar).toBeVisible({ timeout: 5000 });
    const avatarSrc = await profileAvatar.getAttribute('src');
    const avatarHash = await getImageHash(avatarSrc || '');

    expect(profileHash).not.toBeNull();
    expect(avatarHash).not.toBeNull();

    expect(profileHash).toEqual(avatarHash);
  });

  test('Validate avatar in member list right click and click profile', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63364',
    });

    await page.waitForTimeout(1000);
    const clanPage = new ClanPageV2(page);
    await clanPage.openMemberList();
    const userName = await clanPage.footerProfile.userName.textContent();
    const memberItem = await clanPage.getMemberFromMemberList(userName || '');
    await memberItem.click({ button: 'right' });
    await page
      .locator(generateE2eSelector('chat.channel_message.member_list.item.actions.view_profile'))
      .click();
    const popup = page.locator('div[class*="w-[600px]"][class*="h-[90vh]"]');
    await expect(popup).toBeVisible({ timeout: 5000 });
    const profileAvatar = popup.locator(
      `${generateE2eSelector('user_setting.profile.user_profile.preview.avatar')} ${generateE2eSelector('avatar.image')}`
    );
    await expect(profileAvatar).toBeVisible({ timeout: 5000 });
    const avatarSrc = await profileAvatar.getAttribute('src');
    const avatarHash = await getImageHash(avatarSrc || '');

    expect(profileHash).not.toBeNull();
    expect(avatarHash).not.toBeNull();

    expect(profileHash).toEqual(avatarHash);
  });

  test('Validate avatar in member settings page', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63364',
    });

    await page.waitForTimeout(1000);
    const clanPage = new ClanPageV2(page);
    await clanPage.openMemberListSetting();

    const profileAvatar = clanPage.memberSettings.usersInfo.locator(
      generateE2eSelector('avatar.image')
    );
    await expect(profileAvatar).toBeVisible({ timeout: 5000 });
    const avatarSrc = await profileAvatar.getAttribute('src');
    const avatarHash = await getImageHash(avatarSrc || '');

    expect(profileHash).not.toBeNull();
    expect(avatarHash).not.toBeNull();

    expect(profileHash).toEqual(avatarHash);
  });
});

test.describe('User Profile - Update avatar', () => {
  let profileHash: string | null = null;
  let profileName: string | null = null;
  const messageText = `message-text-${generateRandomString(10)}`;

  test.beforeAll(async ({ browser }) => {
    await TestSetups.authenticationTest({
      suite: AllureConfig.Suites.USER_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.USER_PROFILE,
      story: AllureConfig.Stories.PROFILE_SETUP,
      severity: AllureConfig.Severity.CRITICAL,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account6);

    await page.goto(joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL as string, 'chat/direct/friends'));
    const profilePage = new ProfilePage(page);
    const messagePage = new MessagePage(page);

    await AllureReporter.step('Open user settings profile', async () => {
      await profilePage.buttons.userSettingProfile.click();
    });

    const fileSizeHelpers = new FileSizeTestHelpers(page);
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

    const profileAvatar: Locator = profilePage.userProfile.avatar;
    await expect(profileAvatar).toBeVisible({ timeout: 5000 });
    const profileSrc = await profileAvatar.getAttribute('src');
    profileHash = await getImageHash(profileSrc || '');
    profileName = await profilePage.getProfileName();

    await profilePage.navigate('/chat/direct/friends');
    await messagePage.sendMessage(messageText);
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.describe('Validate avatar with owner account', () => {
    test.beforeEach(async ({ page }) => {
      const credentials = await AuthHelper.setupAuthWithEmailPassword(
        page,
        AccountCredentials.account6
      );
      await AuthHelper.prepareBeforeTest(
        page,
        joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL as string, 'chat/direct/friends'),
        credentials
      );
    });

    test('Validate footer avatar', async ({ page }) => {
      const profilePage = new ProfilePage(page);
      const directMessagePage = new MessagePage(page);

      await profilePage.navigate('/chat/direct/friends');
      const footerAvatar = directMessagePage.footerAvatar;
      await expect(footerAvatar).toBeVisible();
      const footerSrc = await footerAvatar.getAttribute('src');
      const footerHash = await getImageHash(footerSrc || '');

      expect(profileHash).not.toBeNull();
      expect(profileHash).toEqual(footerHash);
    });

    // test('Validate account avatar', async ({ page }) => {
    //   const profilePage = new ProfilePage(page);

    //   await profilePage.navigate('/chat/direct/friends');
    //   await profilePage.openUserSettingProfile();
    //   const accountAvatar = profilePage.accountPage.image;
    //   await expect(accountAvatar).toBeVisible();
    //   const accountSrc = await accountAvatar.getAttribute('src');
    //   const accountHash = await getImageHash(accountSrc || '');

    //   expect(profileHash).not.toBeNull();
    //   expect(profileHash).toEqual(accountHash);

    //   await profilePage.buttons.closeSettingProfile.click();
    // });
  });

  test.describe('Validate avatar with friend account', () => {
    test.beforeEach(async ({ page }) => {
      const credentials = await AuthHelper.setupAuthWithEmailPassword(
        page,
        AccountCredentials.account1
      );
      await AuthHelper.prepareBeforeTest(
        page,
        joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL as string, 'chat/direct/friends'),
        credentials
      );
    });

    test('TC01: Friend List _ avatar ', async ({ page }) => {
      await AllureReporter.addWorkItemLinks({
        parrent_issue: '63364',
      });

      const messagePage = new MessagePage(page);

      const friendItem = await messagePage.getFriendItemFromFriendList(profileName || '');
      const accountAvatar = friendItem.locator(generateE2eSelector('avatar.image'));
      await expect(accountAvatar).toBeVisible({ timeout: 5000 });
      const accountSrc = await accountAvatar.getAttribute('src');
      const accountHash = await getImageHash(accountSrc || '');

      expect(profileHash).not.toBeNull();
      expect(accountHash).not.toBeNull();

      expect(profileHash).toEqual(accountHash);
    });

    test('TC02: Direct Message _ Conversation List _ Avatar user', async ({ page }) => {
      await AllureReporter.addWorkItemLinks({
        parrent_issue: '63364',
      });

      const profilePage = new ProfilePage(page);
      const messagePage = new MessagePage(page);

      await profilePage.navigate('/chat/direct/friends');
      await messagePage.createDMWithFriendName(profileName || '');
      const DmItem = messagePage.getFriendItemFromListDM(profileName || '');
      const accountAvatar = DmItem.locator(generateE2eSelector('avatar.image'));
      await expect(accountAvatar).toBeVisible({ timeout: 5000 });
      const accountSrc = await accountAvatar.getAttribute('src');
      const accountHash = await getImageHash(accountSrc || '');

      expect(profileHash).not.toBeNull();
      expect(accountHash).not.toBeNull();

      expect(profileHash).toEqual(accountHash);
    });

    // test('TC03: Direct Message _ Dual Chat _ Top bar (New Bug MEZON)', async ({ page }) => {
    //   await AllureReporter.addWorkItemLinks({
    //     parrent_issue: '63364',
    //   });

    //   const profilePage = new ProfilePage(page);
    //   const messagePage = new MessagePage(page);

    //   await profilePage.navigate('/chat/direct/friends');
    //   await messagePage.createDMWithFriendName(profileName || '');
    //   const accountAvatar = messagePage.headerDMAvatar;
    //   await expect(accountAvatar).toBeVisible({ timeout: 5000 });
    //   const accountSrc = await accountAvatar.getAttribute('src');
    //   const accountHash = await getImageHash(accountSrc || '');

    //   expect(profileHash).not.toBeNull();
    //   expect(accountHash).not.toBeNull();

    //   expect(profileHash).toEqual(accountHash);
    // });

    test('TC04: Direct Message _ Dual Chat _ Display name', async ({ page }) => {
      await AllureReporter.addWorkItemLinks({
        parrent_issue: '63364',
      });
      const messagePage = new MessagePage(page);

      await messagePage.createDMWithFriendName(profileName || '');
      await messagePage.sendMessageWhenInDM(messageText);
      const messageItemWithProfileName = await messagePage.getMessageWithProfileName(
        profileName || ''
      );
      await page.waitForTimeout(500);
      const accountAvatar = messageItemWithProfileName.locator(generateE2eSelector('avatar.image'));
      await expect(accountAvatar).toBeVisible({ timeout: 5000 });
      const accountSrc = await accountAvatar.getAttribute('src');
      const accountHash = await getImageHash(accountSrc || '');

      expect(profileHash).not.toBeNull();
      expect(accountHash).not.toBeNull();

      expect(profileHash).toEqual(accountHash);
    });

    // test('TC05: Direct Message _ Dual Chat _ Short Profile (click on display name)', async ({
    //   page,
    // }) => {
    //   await AllureReporter.addWorkItemLinks({
    //     parrent_issue: '63364',
    //   });

    //   const profilePage = new ProfilePage(page);
    //   const messagePage = new MessagePage(page);
    //   await profilePage.navigate('/chat/direct/friends');
    //   await messagePage.createDMWithFriendName(profileName || '');
    //   const messageItemWithProfileName = await messagePage.getMessageWithProfileName(
    //     profileName || ''
    //   );
    //   await page.waitForTimeout(500);
    //   const displayName = messageItemWithProfileName.locator(
    //     generateE2eSelector('base_profile.display_name')
    //   );
    //   await displayName.click();

    //   const accountAvatar = profilePage.userProfile.avatar;
    //   await expect(accountAvatar).toBeVisible({ timeout: 5000 });
    //   const accountSrc = await accountAvatar.getAttribute('src');
    //   const accountHash = await getImageHash(accountSrc || '');

    //   expect(profileHash).not.toBeNull();
    //   expect(accountHash).not.toBeNull();

    //   expect(profileHash).toEqual(accountHash);
    // });

    // test('TC06: Direct Message _ Dual Chat _ Short Profile (click on mention)', async ({
    //   page,
    // }) => {
    //   await AllureReporter.addWorkItemLinks({
    //     parrent_issue: '63364',
    //   });

    //   const profilePage = new ProfilePage(page);
    //   const messagePage = new MessagePage(page);
    //   const messageHelper = new MessageTestHelpers(page);
    //   await profilePage.navigate('/chat/direct/friends');
    //   await messagePage.createDMWithFriendName(profileName || '');
    //   await page.waitForTimeout(500);
    //   await messageHelper.mentionUserAndSend(`@${profileName}`, [profileName || '']);
    //   await page.waitForTimeout(500);
    //   const mentionItem = messageHelper
    //     .getMessageItemLocator(`@${profileName}`)
    //     .last()
    //     .locator(generateE2eSelector('chat.channel_message.mention_user'));
    //   await mentionItem.click();
    //   const accountAvatar = profilePage.userProfile.avatar;
    //   await expect(accountAvatar).toBeVisible({ timeout: 5000 });
    //   const accountSrc = await accountAvatar.getAttribute('src');
    //   const accountHash = await getImageHash(accountSrc || '');

    //   expect(profileHash).not.toBeNull();
    //   expect(accountHash).not.toBeNull();

    //   expect(profileHash).toEqual(accountHash);
    // });

    test('TC07: Direct Message _ Dual Chat _ Side Profile', async ({ page }) => {
      await AllureReporter.addWorkItemLinks({
        parrent_issue: '63364',
      });

      const profilePage = new ProfilePage(page);
      const messagePage = new MessagePage(page);
      await profilePage.navigate('/chat/direct/friends');
      await messagePage.createDMWithFriendName(profileName || '');
      await messagePage.openUserProfile();
      const accountAvatar = profilePage.userProfile.avatar;
      await expect(accountAvatar).toBeVisible({ timeout: 5000 });
      const accountSrc = await accountAvatar.getAttribute('src');
      const accountHash = await getImageHash(accountSrc || '');

      expect(profileHash).not.toBeNull();
      expect(accountHash).not.toBeNull();

      expect(profileHash).toEqual(accountHash);
    });

    test('TC08: Direct Message _ Dual Chat _ Pinned Message list', async ({ page }) => {
      await AllureReporter.addWorkItemLinks({
        parrent_issue: '63364',
      });

      const profilePage = new ProfilePage(page);
      const messagePage = new MessagePage(page);
      await profilePage.navigate('/chat/direct/friends');
      await messagePage.createDMWithFriendName(profileName || '');
      const messageItemWithProfileName = await messagePage.getMessageWithProfileName(
        profileName || ''
      );
      await messagePage.pinSpecificMessage(messageItemWithProfileName);
      await page.waitForTimeout(500);
      const accountAvatar = messageItemWithProfileName.locator(generateE2eSelector('avatar.image'));
      await expect(accountAvatar).toBeVisible({ timeout: 5000 });
      const accountSrc = await accountAvatar.getAttribute('src');
      const accountHash = await getImageHash(accountSrc || '');

      expect(profileHash).not.toBeNull();
      expect(accountHash).not.toBeNull();

      expect(profileHash).toEqual(accountHash);
    });
  });
});
