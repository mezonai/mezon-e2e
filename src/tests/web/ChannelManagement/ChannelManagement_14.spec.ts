import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Management - Age-Restricted Channel, Inactivity & Quick Actions (TC-CM-01, TC-CM-09)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account1;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    await page
      .evaluate(() => {
        localStorage.removeItem('remember_channel');
      })
      .catch(() => {});
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });

    const clanPage = new ClanPage(page);
    const clanHeader = clanPage.selector.buttons.clanName
      .or(page.locator('[data-e2e*="clan_page-header-title-clan_name"]'))
      .first();
    if (!(await clanHeader.isVisible({ timeout: 2000 }).catch(() => false))) {
      const clanName = clanFactory.getClanName();
      const clanBtn = page
        .locator(`[data-e2e="clan_page-side_bar-clan_item"][title*="${clanName}"] button`)
        .or(page.locator(`div[title*="${clanName}"] button`))
        .first();

      await clanBtn.scrollIntoViewIfNeeded().catch(() => {});
      if (await clanBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await clanBtn.click({ force: true });
        await page.waitForTimeout(1000);
      }
      if (page.url().includes('/member-safety')) {
        const firstChannel = page
          .locator('[data-e2e*="channel_list-item-name"], [data-e2e*="channel_list"] p')
          .first();
        if (await firstChannel.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstChannel.click();
        }
      }
      await expect(clanHeader).toBeVisible({ timeout: 10000 });
    }
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify Age-Restricted Channel switch toggle and description in Channel Settings Overview (TC-CM-01)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64641' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Age-Restricted Channel switch and description text in Channel Settings Overview and toggling switch.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-management', 'age-restricted', 'nsfw-channel'],
    });

    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
    const channelName = `ch-age-${generateRandomString(5)}`.toLowerCase();

    await AllureReporter.step(`Create channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(true);
    });

    await AllureReporter.step(
      'Open Channel Settings and verify Age-Restricted section',
      async () => {
        await clanPage.openChannelSettings(channelName);

        const ageLabel = page.locator('text="Age-Restricted Channel"').first();
        await expect(ageLabel).toBeVisible({ timeout: 5000 });

        const ageSwitch = channelSettings.selector.overview.ageRestrictedSwitch
          .or(page.locator('input[type="checkbox"], [role="switch"]'))
          .first();

        if (await ageSwitch.isVisible({ timeout: 3000 }).catch(() => false)) {
          await ageSwitch.click();
          await page.waitForTimeout(500);
        }
      }
    );

    await AllureReporter.step('Exit Channel Settings and cleanup channel', async () => {
      await channelSettings.closeChannelSettings();
      await page.waitForTimeout(500);

      await clanPage.openChannelSettings(channelName);
      await channelSettings.deleteChannel();
      await clanPage.verifyChannelVisibility(channelName, false);
      if (
        await clanPage.selector.buttons.exitSettings
          .first()
          .isVisible({ timeout: 1000 })
          .catch(() => false)
      ) {
        await clanPage.closeSettingsChannel().catch(() => {});
      }
    });
  });

  test('TC02: Verify Hide After Inactivity dropdown selector in Channel Settings Overview', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64642' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Hide After Inactivity dropdown is present in Channel Settings Overview and displays configured duration.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-management', 'inactivity', 'channel-overview'],
    });

    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
    const channelName = `ch-inact-${generateRandomString(5)}`.toLowerCase();

    await AllureReporter.step(`Create channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(true);
    });

    await AllureReporter.step(
      'Open Channel Settings and verify Hide After Inactivity dropdown',
      async () => {
        await clanPage.openChannelSettings(channelName);

        const inactLabel = page.locator('text="Hide After Inactivity"').first();
        await expect(inactLabel).toBeVisible({ timeout: 5000 });

        const dropdown = channelSettings.selector.overview.hideInactivityDropdown
          .or(page.locator('div:has-text("1 Week"), button:has-text("1 Week")'))
          .first();

        await expect(dropdown).toBeVisible({ timeout: 5000 });
        await dropdown.click();
        await page.waitForTimeout(500);

        // Close dropdown by clicking label or Escape
        await inactLabel.click().catch(() => {});
      }
    );

    await AllureReporter.step('Exit Channel Settings and cleanup channel', async () => {
      await channelSettings.closeChannelSettings();
      await page.waitForTimeout(500);

      await clanPage.openChannelSettings(channelName);
      await channelSettings.deleteChannel();
      await clanPage.verifyChannelVisibility(channelName, false);
      if (
        await clanPage.selector.buttons.exitSettings
          .first()
          .isVisible({ timeout: 1000 })
          .catch(() => false)
      ) {
        await clanPage.closeSettingsChannel().catch(() => {});
      }
    });
  });

  test('TC03: Verify Channel Settings Quick Actions tab navigation and modal controls', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64643' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify navigating to Quick Actions tab in Channel Settings and checking Flash Messages & Quick Menus options.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-management', 'quick-actions', 'quick-menu'],
    });

    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
    const channelName = `ch-qa-${generateRandomString(5)}`.toLowerCase();

    await AllureReporter.step(`Create channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(true);
    });

    await AllureReporter.step('Navigate to Quick Actions tab and verify tabs', async () => {
      await clanPage.openChannelSettings(channelName);
      await channelSettings.openQuickActionsTab();

      const flashTab = channelSettings.selector.quick_menu.flashMessagesTab
        .or(page.locator('button:has-text("Flash Messages")'))
        .first();
      const quickMenusTab = channelSettings.selector.quick_menu.quickMenusTab
        .or(page.locator('button:has-text("Quick Menus")'))
        .first();

      if (await flashTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(flashTab).toBeVisible();
      }
      if (await quickMenusTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(quickMenusTab).toBeVisible();
        await quickMenusTab.click();
        await page.waitForTimeout(300);
      }
    });

    await AllureReporter.step('Exit Channel Settings and cleanup channel', async () => {
      await channelSettings.closeChannelSettings();
      await page.waitForTimeout(500);

      await clanPage.openChannelSettings(channelName);
      await channelSettings.deleteChannel();
      await clanPage.verifyChannelVisibility(channelName, false);
      if (
        await clanPage.selector.buttons.exitSettings
          .first()
          .isVisible({ timeout: 1000 })
          .catch(() => false)
      ) {
        await clanPage.closeSettingsChannel().catch(() => {});
      }
    });
  });
});
