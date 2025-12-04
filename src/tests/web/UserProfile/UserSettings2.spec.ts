import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { joinUrlPaths } from '@/utils/joinUrlPaths';
import generateRandomString from '@/utils/randomString';
import { test } from '@playwright/test';

test.describe('User Settings 2', () => {
  const clanFactory = new ClanFactory();
  const account = AccountCredentials.account7;
  const [userName] = getUsernamesFromEmails([account.email]);

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

  test('Set custom status and verify on short profile, footer profile', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63571',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully set custom status.

      **Test Steps:**
      1. Open custom status modal
      2. Enter new custom status
      3. Save the changes
      4. Verify the user status has been setted

      **Expected Result:** Custom status should be successfully setted and saved.
    `);

    const profilePage = new ProfilePage(page);
    const status = `custom status - ${generateRandomString(10)}`;

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.step('Open custom status modal', async () => {
      await profilePage.openFooterProfileModal();
      await profilePage.openCustomStatusModal();
    });

    await AllureReporter.step('Fill new status and save', async () => {
      await profilePage.setCustomStatus(status);
    });

    await AllureReporter.step('Verify custom status setted in short profile', async () => {
      await profilePage.verifyCustomStatusSettedInShortProfile(status);
    });

    await AllureReporter.step('Verify custom status setted in footer profile', async () => {
      await profilePage.verifyCustomStatusSettedInFooterProfile(status);
    });
  });

  test('Set custom status and verify on member list and short profile open from message', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63571',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully set custom status.

      **Test Steps:**
      1. Open custom status modal
      2. Enter new custom status
      3. Save the changes
      4. Verify the user status has been setted

      **Expected Result:** Custom status should be successfully setted and saved.
    `);

    const profilePage = new ProfilePage(page);
    const status = `custom status - ${generateRandomString(10)}`;
    const channelSettingsPage = new ChannelSettingPage(page);
    const clanPage = new ClanPage(page);

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.step('Open custom status modal', async () => {
      await profilePage.openFooterProfileModal();
      await profilePage.openCustomStatusModal();
    });

    await AllureReporter.step('Fill new status and save', async () => {
      await profilePage.setCustomStatus(status);
    });

    await AllureReporter.step('Verify custom status setted in member list', async () => {
      await channelSettingsPage.openMemberList();
      await clanPage.verifyCustomStatusSettedInMemberList(userName, status);
    });

    await AllureReporter.step(
      'Verify custom status updated in short profile open from message',
      async () => {
        await profilePage.sendMessage('text message to open short profile');
        await profilePage.openShortProfileFromUsernameOnChat(userName);
        await profilePage.verifyCustomStatusSettedInShortProfile(status);
      }
    );
  });

  test('Set custom status and verify on preview setting page', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63571',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully set custom status.

      **Test Steps:**
      1. Open custom status modal
      2. Enter new custom status
      3. Save the changes
      4. Verify the user status has been setted

      **Expected Result:** Custom status should be successfully setted and saved.
    `);

    const profilePage = new ProfilePage(page);
    const status = `custom status - ${generateRandomString(10)}`;
    const channelSettingsPage = new ChannelSettingPage(page);
    const clanPage = new ClanPage(page);

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.step('Open custom status modal', async () => {
      await profilePage.openFooterProfileModal();
      await profilePage.openCustomStatusModal();
    });

    await AllureReporter.step('Fill new status and save', async () => {
      await profilePage.setCustomStatus(status);
    });

    await AllureReporter.step('Open user setting page', async () => {
      await profilePage.openUserSettingProfile();
      await profilePage.openProfileTab();
    });

    await AllureReporter.step('Verify custom status setted on preview setting page', async () => {
      await channelSettingsPage.openMemberList();
      await clanPage.verifyCustomStatusSettedInMemberList(userName, status);
    });

    await AllureReporter.step(
      'Verify custom status updated in short profile open from message',
      async () => {
        await profilePage.sendMessage('text message to open short profile');
        await profilePage.openShortProfileFromUsernameOnChat(userName);
        await profilePage.verifyCustomStatusSettedInShortProfile(status);
      }
    );
  });
});
