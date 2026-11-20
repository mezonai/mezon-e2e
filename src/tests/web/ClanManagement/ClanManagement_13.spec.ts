import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanSettingsPage } from '@/pages/ClanSettingsPage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Role Lifecycle, Category Channel Creation & Settings Navigation (TC-CLAN-02, TC-CLAN-06)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account1;
  let clanPage: ClanPage;
  let clanSettingsPage: ClanSettingsPage;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    clanPage = new ClanPage(page);
    clanSettingsPage = new ClanSettingsPage(page);
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify Role lifecycle: create new custom role, update role name, and delete role with confirmation', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65122' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify role management lifecycle in Clan Settings:
      1. Open Role Settings page
      2. Create a new custom role
      3. Update role name
      4. Delete the role with confirmation dialog
      5. Verify role is removed from the list
    `);
    await AllureReporter.addLabels({
      tag: ['clan-management', 'roles', 'role-lifecycle', 'role-settings'],
    });

    const initialRoleName = `role-init-${generateRandomString(4)}`.toLowerCase();
    const updatedRoleName = `role-upd-${generateRandomString(4)}`.toLowerCase();

    await AllureReporter.step(
      `Open Role Settings and create new role: ${initialRoleName}`,
      async () => {
        const opened = await clanPage.openRoleSettingsPage();
        expect(opened).toBe(true);
        await clanPage.addNewRoleOnClan(initialRoleName);
      }
    );

    await AllureReporter.step(`Update role name to: ${updatedRoleName}`, async () => {
      await clanPage.updateRoleName(initialRoleName, updatedRoleName);
    });

    await AllureReporter.step(`Delete role ${updatedRoleName} and confirm removal`, async () => {
      await clanPage.deleteRole(updatedRoleName);
      await clanPage.closeSettingsClan();
    });
  });

  test('TC02: Verify Category creation with valid name, channel creation inside category, and category deletion', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65123' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify creating a new category, adding a text channel inside it, and deleting the empty category.
    `);
    await AllureReporter.addLabels({
      tag: ['clan-management', 'category', 'channel-creation'],
    });

    const menuPanel = new ClanMenuPanel(page);
    const channelSettings = new ChannelSettingPage(page);
    const categoryName = `cat-${generateRandomString(5)}`.toLowerCase();
    const channelName = `ch-in-cat-${generateRandomString(5)}`.toLowerCase();

    await AllureReporter.step(`Create category: ${categoryName}`, async () => {
      await menuPanel.createCategory(categoryName);
      const isCatPresent = await menuPanel.isCategoryPresent(categoryName);
      expect(isCatPresent).toBe(true);
    });

    await AllureReporter.step(`Create channel inside category: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, undefined, true);
      const isChPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isChPresent).toBe(true);
    });

    await AllureReporter.step(`Delete channel ${channelName}`, async () => {
      await clanPage.openChannelSettings(channelName);
      await channelSettings.deleteChannel();
      const isChPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isChPresent).toBe(false);
    });

    await AllureReporter.step(`Delete category ${categoryName}`, async () => {
      await clanPage.deleteCategory(categoryName);
      const isCatPresent = await menuPanel.isCategoryPresent(categoryName);
      expect(isCatPresent).toBe(false);
    });
  });

  test('TC03: Verify Clan settings sidebar navigation across tabs and clean exit (TC-CLAN-06)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65124' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify opening clan settings and switching between Overview, Roles, and Emoji tabs, then closing settings cleanly.
    `);
    await AllureReporter.addLabels({
      tag: ['clan-management', 'settings-navigation', 'sidebar-tabs'],
    });

    await AllureReporter.step('Open Clan Settings and navigate between tabs', async () => {
      await clanPage.openClanSettings();
      await clanSettingsPage.openOverviewTab();
      await clanSettingsPage.openRolesTab();
      await clanSettingsPage.openEmojiTab();
    });

    await AllureReporter.step('Exit Clan Settings and verify chat view is displayed', async () => {
      await clanPage.closeSettingsClan();
      const firstClanItem = page.locator('a[href*="/chat/clans/"]').first();
      await expect(firstClanItem).toBeVisible({ timeout: 5000 });
    });
  });
});
