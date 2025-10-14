import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/ClanPage';
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

test.describe('Clan Profile', () => {
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
    await clanFactory.setupClan(ClanSetupHelper.configs.clanProfile, page);

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

    const clanPage = new ClanPage(page);
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
  //Error Due To cannot tag by "+" Mezon Updateing
  // test('Validate avatar when click mention', async ({ page }) => {
  //   await AllureReporter.addWorkItemLinks({
  //     parrent_issue: '63364',
  //   });

  //   const messageHelper = new MessageTestHelpers(page);
  //   const clanPage = new ClanPage(page);
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
});
