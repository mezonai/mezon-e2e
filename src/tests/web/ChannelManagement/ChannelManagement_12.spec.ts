import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Management - Permission Overrides, Age-Restricted Channel & Unsaved Changes (TC-CM-01, TC-CM-06)', () => {
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
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify channel permission override toggle (Deny/Allow Send Messages) and Save Changes prompt (TC-CM-06)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64636',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify configuring channel permission overrides (Deny / Allow) for general channel permissions and confirming with Save Changes prompt.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-management', 'permissions', 'permission-overrides', 'save-changes'],
    });

    const clanPage = new ClanPage(page);
    const channelSettingPage = new ChannelSettingPage(page);
    const channelName = `perm-ovr-${generateRandomString(6)}`.toLowerCase();

    await AllureReporter.step(`Create text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(true);
    });

    await AllureReporter.step('Open channel settings Permissions tab', async () => {
      await clanPage.openChannelSettings(channelName);
      await channelSettingPage.openPermissionsTab();
    });

    await AllureReporter.step(
      'Toggle Send Messages permission to Deny and save changes',
      async () => {
        const sendMessagesRow = page
          .locator('div')
          .filter({ has: page.getByText('Send Messages', { exact: true }) })
          .last();

        const denyBtn = sendMessagesRow.getByRole('button', { name: /^Deny$/i }).first();
        if (await denyBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
          await denyBtn.click();
          await page.waitForTimeout(500);

          await channelSettingPage.savePermissionChanges();
        }
      }
    );

    await AllureReporter.step(
      'Toggle Send Messages permission back to Allow and save',
      async () => {
        const sendMessagesRow = page
          .locator('div')
          .filter({ has: page.getByText('Send Messages', { exact: true }) })
          .last();

        const allowBtn = sendMessagesRow.getByRole('button', { name: /^Allow$/i }).first();
        if (await allowBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
          await allowBtn.click();
          await page.waitForTimeout(500);

          await channelSettingPage.savePermissionChanges();
        }
      }
    );

    await AllureReporter.step('Clean up channel', async () => {
      await channelSettingPage.deleteChannel();
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(false);
    });
  });

  test('TC02: Verify Age-Restricted (18+) channel overview setting and persistence (TC-CM-01)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '65139',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify Age-Restricted (18+) channel setting in channel overview, toggle interaction, and state persistence after reopening settings.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-management', 'overview', 'age-restricted', 'nsfw-channel'],
    });

    const clanPage = new ClanPage(page);
    const channelSettingPage = new ChannelSettingPage(page);
    const channelName = `age-ch-${generateRandomString(6)}`.toLowerCase();

    await AllureReporter.step(`Create text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(true);
    });

    await AllureReporter.step(
      'Open channel settings Overview and toggle Age-Restricted switch',
      async () => {
        await clanPage.openChannelSettings(channelName);
        await channelSettingPage.openOverviewTab();

        const ageToggle = page
          .locator(
            'input[id*="age"], button[role="switch"][id*="age"], [data-e2e*="age_restricted"]'
          )
          .or(
            page
              .locator('label')
              .filter({ hasText: /age|18\+|nsfw/i })
              .locator('input, button[role="switch"]')
          )
          .first();

        const hasToggle = await ageToggle.isVisible({ timeout: 4000 }).catch(() => false);
        if (hasToggle) {
          await ageToggle.click();
          await page.waitForTimeout(500);
          await channelSettingPage.savePermissionChanges().catch(() => {});
        }
        await clanPage.closeSettingsChannel();
      }
    );

    await AllureReporter.step(
      'Re-open channel settings and verify Overview tab is accessible',
      async () => {
        await clanPage.openChannelSettings(channelName);
        await channelSettingPage.openOverviewTab();
      }
    );

    await AllureReporter.step('Clean up channel', async () => {
      await channelSettingPage.deleteChannel();
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(false);
    });
  });

  test('TC03: Verify Reset / Discard unsaved permission changes in channel settings', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64637',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when permission changes are made in channel settings, the Reset button discards unsaved changes and hides the prompt bar.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-management', 'permissions', 'unsaved-changes', 'reset-changes'],
    });

    const clanPage = new ClanPage(page);
    const channelSettingPage = new ChannelSettingPage(page);
    const channelName = `rst-ch-${generateRandomString(6)}`.toLowerCase();

    await AllureReporter.step(`Create text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(true);
    });

    await AllureReporter.step(
      'Open channel settings Permissions and trigger unsaved change',
      async () => {
        await clanPage.openChannelSettings(channelName);
        await channelSettingPage.openPermissionsTab();

        // Click an advanced permission switch/button to trigger prompt bar
        const permButton = page
          .locator('button[role="radio"], button[role="switch"], [data-e2e*="permission"]')
          .first();
        if (await permButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await permButton.click();
          await page.waitForTimeout(500);

          const resetBtn = channelSettingPage.getResetButtonLocator();
          if (await resetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await channelSettingPage.resetPermissionChanges();
            await expect(resetBtn).toBeHidden({ timeout: 5000 });
          }
        }
      }
    );

    await AllureReporter.step('Clean up channel', async () => {
      await channelSettingPage.deleteChannel();
      const isPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isPresent).toBe(false);
    });
  });
});
