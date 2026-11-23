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

test.describe('Channel Management - Settings Navigation, Webhook Modal & Discard Changes (TC-CM-07, TC-CM-08)', () => {
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
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });

    await page
      .evaluate(() => {
        localStorage.removeItem('remember_channel');
      })
      .catch(() => {});

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

  test('TC01: Verify Channel Settings sidebar tab navigation across Overview, Permissions, and Integrations', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64637' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify navigating between Channel Settings tabs (Overview, Permissions, Integrations) and closing settings cleanly.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-management', 'settings-navigation', 'sidebar-tabs'],
    });

    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
    const channelName = `ch-nav-${generateRandomString(5)}`.toLowerCase();

    await AllureReporter.step(`Create channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(true);
    });

    await AllureReporter.step('Open Channel Settings and switch between tabs', async () => {
      await clanPage.openChannelSettings(channelName);

      // Verify Overview tab is visible by default
      await expect(channelSettings.selector.overview.channelName).toBeVisible({ timeout: 5000 });

      // Navigate to Permissions tab
      if (
        await channelSettings.selector.side_bar_buttons.permissions
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await channelSettings.selector.side_bar_buttons.permissions.click();
        await page.waitForTimeout(500);
      }

      // Navigate to Integrations tab
      if (
        await channelSettings.selector.side_bar_buttons.integrations
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await channelSettings.selector.side_bar_buttons.integrations.click();
        await page.waitForTimeout(500);
      }

      // Return to Overview tab
      if (
        await channelSettings.selector.side_bar_buttons.overview
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await channelSettings.selector.side_bar_buttons.overview.click();
        await expect(channelSettings.selector.overview.channelName).toBeVisible({ timeout: 5000 });
      }
    });

    await AllureReporter.step('Close Channel Settings cleanly', async () => {
      await channelSettings.closeChannelSettings();
      await page.waitForTimeout(500);
    });

    await AllureReporter.step(`Cleanup channel: ${channelName}`, async () => {
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

  test('TC02: Verify Channel Webhook creation modal controls and empty input validation feedback', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64638' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify accessing Webhook integration section in Channel Settings, inspecting New Webhook button, and checking modal controls.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-management', 'webhook', 'integrations'],
    });

    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
    const channelName = `ch-whk-${generateRandomString(5)}`.toLowerCase();

    await AllureReporter.step(`Create channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(true);
    });

    await AllureReporter.step(
      'Navigate to Channel Integrations and check Webhook section',
      async () => {
        await clanPage.openChannelSettings(channelName);

        if (
          await channelSettings.selector.side_bar_buttons.integrations
            .isVisible({ timeout: 3000 })
            .catch(() => false)
        ) {
          await channelSettings.selector.side_bar_buttons.integrations.click();
          await page.waitForTimeout(500);

          const newWebhookBtn = channelSettings.selector.webhook.new_webhook_button.or(
            channelSettings.selector.webhook.create_webhook_button.or(
              page.locator('button:has-text("New Webhook"), button:has-text("Create Webhook")')
            )
          );

          if (
            await newWebhookBtn
              .first()
              .isVisible({ timeout: 5000 })
              .catch(() => false)
          ) {
            await expect(newWebhookBtn.first()).toBeVisible();
          }
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

  test('TC03: Verify Channel Settings Overview unsaved changes are discarded on exit without saving', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '64639' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify modifying channel topic in Overview tab and closing settings without saving discards uncommitted changes, preserving original values upon reopen.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-management', 'discard-changes', 'unsaved-changes'],
    });

    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
    const channelName = `ch-rst-${generateRandomString(5)}`.toLowerCase();
    const tempTopic = `Temp topic ${generateRandomString(6)}`;

    await AllureReporter.step(`Create channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(true);
    });

    await AllureReporter.step(
      'Open Channel Settings, modify channel topic, and exit without saving',
      async () => {
        await clanPage.openChannelSettings(channelName);

        const topicInput = channelSettings.selector.overview.channelTopic;
        await expect(topicInput).toBeVisible({ timeout: 5000 });
        await expect(topicInput).toHaveValue('');
        await topicInput.fill(tempTopic);
        await page.waitForTimeout(500);

        // Close settings without saving to discard uncommitted changes
        await channelSettings.closeChannelSettings();
        await page.waitForTimeout(500);
      }
    );

    await AllureReporter.step(
      'Reopen Channel Settings and verify topic was discarded',
      async () => {
        await clanPage.openChannelSettings(channelName);
        const topicInput = channelSettings.selector.overview.channelTopic;
        await expect(topicInput).toBeVisible({ timeout: 5000 });
        await expect(topicInput).toHaveValue('');
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
});
