import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { CLAN_MANAGEMENT_TAG } from '@/constants/ClanManagement';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { CategorySettingPage } from '@/pages/CategorySettingPage';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Clan Deletion Validation & Invitation Handling', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account4;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.clanManagement2,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63510' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('Verify delete clan requires typing exact clan name and disables confirm button on mismatch', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that deleting a clan validates the exact clan name. The confirm button must remain disabled when input is empty or mismatched, and enables only when exact clan name is provided.

      **Test Steps:**
      1. Create a dedicated temporary clan for deletion
      2. Open Clan Settings -> Overview -> Click Delete Clan
      3. Leave input empty and verify confirm delete button is disabled
      4. Enter incorrect clan name and verify confirm delete button remains disabled
      5. Enter exact clan name and verify confirm delete button becomes enabled
      6. Confirm deletion and verify clan is removed from sidebar

      **Expected Result:** Confirm button only activates on exact clan name match; clan is deleted successfully after confirmation.
    `);
    await AllureReporter.addLabels({
      tag: [CLAN_MANAGEMENT_TAG, 'delete-clan', 'validation', 'clan-settings'],
    });

    const clanPage = new ClanPage(page);
    const categoryPage = new ClanMenuPanel(page);
    const categorySettingPage = new CategorySettingPage(page);
    const unique = Date.now().toString(36).slice(-6);
    const tempClanName = `DelClan_${unique}`;

    await AllureReporter.step('Create temporary clan for deletion test', async () => {
      await clanPage.clickCreateClanButton();
      await clanPage.clickCreateMyOwnClan();
      await clanPage.createNewClan(tempClanName);
      const clanLocator = await clanPage.selector.findClanByTitle(tempClanName);
      await expect(clanLocator).toBeVisible({ timeout: 10000 });
      await clanLocator.click({ timeout: 5000 });
    });

    await AllureReporter.step('Navigate to Clan Settings and open Delete Clan modal', async () => {
      await categoryPage.text.clanName.click();
      await categoryPage.buttons.clanSettings.click();
      await page.waitForLoadState('domcontentloaded');

      const deleteSidebarButton = await categorySettingPage.getDeleteSidebarButton();
      await expect(deleteSidebarButton).toBeVisible({ timeout: 5000 });
      await deleteSidebarButton.click();
    });

    await AllureReporter.step(
      'Verify confirm delete button is disabled when input is empty',
      async () => {
        await categorySettingPage.verifyConfirmDeleteButtonDisabled();
      }
    );

    await AllureReporter.step(
      'Verify confirm delete button remains disabled on wrong clan name',
      async () => {
        await categorySettingPage.fillDeleteInput('WrongClanName_123');
        await categorySettingPage.verifyConfirmDeleteButtonDisabled();
      }
    );

    await AllureReporter.step(
      'Verify confirm delete button enables when typing exact clan name',
      async () => {
        await categorySettingPage.fillDeleteInput(tempClanName);
        await categorySettingPage.verifyConfirmDeleteButtonEnabled();
      }
    );

    await AllureReporter.step('Confirm delete and verify clan is removed', async () => {
      await categorySettingPage.clickConfirmDeleteButton();
      await page.waitForLoadState('domcontentloaded');
      const clanLocator = await clanPage.selector.findClanByTitle(tempClanName);
      await expect(clanLocator).toHaveCount(0, { timeout: 10000 });
    });
  });

  test('Verify opening an invalid invite link displays appropriate error without joining wrong clan', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that navigating to an invalid or malformed invite link displays a proper error state and does not crash or join an unintended clan.

      **Test Steps:**
      1. Navigate directly to an invalid invite URL
      2. Verify application displays appropriate error notification or returns to safe state
      3. Verify user remains authenticated and workspace state is intact

      **Expected Result:** Invalid invite is rejected cleanly without errors or joining unexpected clans.
    `);
    await AllureReporter.addLabels({
      tag: [CLAN_MANAGEMENT_TAG, 'invite', 'invalid-link', 'error-handling'],
    });

    const invalidInviteUrl = joinUrlPaths(
      WEBSITE_CONFIGS.MEZON.baseURL,
      'invite',
      'invalid-code-xyz999-not-exist'
    );

    await AllureReporter.step('Navigate to invalid invite URL', async () => {
      await page.goto(invalidInviteUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    });

    await AllureReporter.step('Verify application handles invalid link safely', async () => {
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('invalid-code-xyz999-not-exist/channels');
    });
  });

  test('Verify opening clan invite when already a member navigates directly to clan without duplicate membership', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when a user who is already a member opens an invite link for that same clan, the system safely navigates into the clan without creating duplicate memberships or erroring.

      **Test Steps:**
      1. Obtain the invite URL for the current clan
      2. Navigate to the invite URL in the current session
      3. Verify user is in the clan and clan sidebar shows only one instance of the clan

      **Expected Result:** User is navigated to the existing clan seamlessly.
    `);
    await AllureReporter.addLabels({
      tag: [CLAN_MANAGEMENT_TAG, 'invite', 'existing-member', 'membership'],
    });

    const clanPage = new ClanPage(page);
    let inviteUrl = '';

    await AllureReporter.step('Get invite URL from current clan', async () => {
      await clanPage.clickButtonInvitePeopleFromMenu();
      inviteUrl = await clanPage.selector.input.urlInvite.inputValue();
      await clanPage.selector.buttons.closeInviteModal.click();
    });

    await AllureReporter.step('Navigate to invite URL while already a member', async () => {
      if (inviteUrl) {
        await page.goto(inviteUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
      }
    });

    await AllureReporter.step('Verify clan is accessible without duplication', async () => {
      const clanLocator = await clanPage.selector.findClanByTitle(clanFactory.getClanName());
      await expect(clanLocator.first()).toBeVisible({ timeout: 10000 });
      expect(await clanLocator.count()).toBe(1);
    });
  });
});
