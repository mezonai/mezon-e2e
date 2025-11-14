import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { getImageHash } from '@/utils/images';
import { joinUrlPaths } from '@/utils/joinUrlPaths';
import { FileSizeTestHelpers } from '@/utils/uploadFileHelpers';
import { expect, Locator, test } from '@playwright/test';

test.describe('Clan Profile - Module 2', () => {
  let profileHash: string | null = null;
  let profilePage: ProfilePage;
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
    await clanFactory.setupClan(ClanSetupHelper.configs.clanProfile2, page);

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

  test('Validate avatar in member list', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63364',
    });

    await page.waitForTimeout(1000);
    const clanPage = new ClanPage(page);
    await clanPage.openMemberList();
    const userName = await clanPage.getFooterProfileUserName();
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
    const clanPage = new ClanPage(page);
    await clanPage.openMemberList();
    const userName = await clanPage.getFooterProfileUserName();
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
    const clanPage = new ClanPage(page);
    await clanPage.openMemberList();
    const userName = await clanPage.getFooterProfileUserName();
    const memberItem = await clanPage.getMemberFromMemberList(userName || '');
    await memberItem.click({ button: 'right' });
    await page
      .locator(generateE2eSelector('chat.channel_message.member_list.item.actions'))
      .filter({
        hasText: 'Profile',
      })
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
    const clanPage = new ClanPage(page);
    await clanPage.openMemberListSetting();

    const profileAvatar = await clanPage.getMemberSettingsUsersInfoAvatar();
    await expect(profileAvatar).toBeVisible({ timeout: 5000 });
    const avatarSrc = await profileAvatar.getAttribute('src');
    const avatarHash = await getImageHash(avatarSrc || '');

    expect(profileHash).not.toBeNull();
    expect(avatarHash).not.toBeNull();

    expect(profileHash).toEqual(avatarHash);
  });
});
