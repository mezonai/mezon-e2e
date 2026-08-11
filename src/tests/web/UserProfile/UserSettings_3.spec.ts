import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ProfilePage } from '@/pages/ProfilePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import { joinUrlPaths } from '@/utils/joinUrlPaths';
import generateRandomString from '@/utils/randomString';
import { expect, test } from '@playwright/test';

test.describe('User Settings - Clan Identity and User Profile Updates', () => {
  const clanFactory = new ClanFactory();
  const account = AccountCredentials.account6;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await TestSetups.authenticationTest({
      suite: AllureConfig.Suites.USER_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.USER_PROFILE,
      story: AllureConfig.Stories.PROFILE_SETUP,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AuthHelper.setupAuthWithEmailPassword(page, account);
    await clanFactory.setupClan(ClanSetupHelper.configs.userProfileUserSetting, page);

    clanFactory.setClanUrl(
      joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, splitDomainAndPath(clanFactory.getClanUrl()).path)
    );
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63571',
    });

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
      await profilePage.openUserSettingProfile();
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
      const saveChangesBtn = await profilePage.getSaveChangesUserProfile();
      await expect(saveChangesBtn).toBeVisible({ timeout: 500 });
      await expect(saveChangesBtn).toBeEnabled({ timeout: 500 });
    });

    await AllureReporter.step('Verify length of new about me status', async () => {
      await profilePage.validateLength(target);
    });

    await AllureReporter.step('Save About me status', async () => {
      await profilePage.saveChangesUserProfile();
      const saveChangesBtn = await profilePage.getSaveChangesUserProfile();
      await expect(saveChangesBtn).toBeHidden({ timeout: 500 });
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
        await page.reload({
          waitUntil: 'domcontentloaded',
        });
        await profilePage.sendMessage(mentionText);
        await profilePage.verifyAboutMeStatusInShortProfile(target);
      }
    );

    await AllureReporter.attachScreenshot(page, 'About me status Changed Successfully');
  });
});
