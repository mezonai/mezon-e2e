import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { MessagePage } from '@/pages/MessagePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { getImageHash } from '@/utils/images';
import { joinUrlPaths } from '@/utils/joinUrlPaths';
import generateRandomString from '@/utils/randomString';
import { FileSizeTestHelpers } from '@/utils/uploadFileHelpers';
import { expect, Locator, test } from '@playwright/test';

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

    await page.goto(joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL as string, ROUTES.DIRECT_FRIENDS));
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

    await profilePage.navigate(ROUTES.DIRECT_FRIENDS);
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
        joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL as string, ROUTES.DIRECT_FRIENDS),
        credentials
      );
    });

    test('Validate footer avatar', async ({ page }) => {
      const profilePage = new ProfilePage(page);
      const directMessagePage = new MessagePage(page);

      await profilePage.navigate(ROUTES.DIRECT_FRIENDS);
      const footerAvatar = directMessagePage.footerAvatar;
      await expect(footerAvatar).toBeVisible();
      const footerSrc = await footerAvatar.getAttribute('src');
      const footerHash = await getImageHash(footerSrc || '');

      expect(profileHash).not.toBeNull();
      expect(profileHash).toEqual(footerHash);
    });

    // test('Validate account avatar', async ({ page }) => {
    //   const profilePage = new ProfilePage(page);

    //   await profilePage.navigate(ROUTES.DIRECT_FRIENDS);
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
        joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL as string, ROUTES.DIRECT_FRIENDS),
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

      await profilePage.navigate(ROUTES.DIRECT_FRIENDS);
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

    //   await profilePage.navigate(ROUTES.DIRECT_FRIENDS);
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
    //   await profilePage.navigate(ROUTES.DIRECT_FRIENDS);
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
    //   await profilePage.navigate(ROUTES.DIRECT_FRIENDS);
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
      await profilePage.navigate(ROUTES.DIRECT_FRIENDS);
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
      await profilePage.navigate(ROUTES.DIRECT_FRIENDS);
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
