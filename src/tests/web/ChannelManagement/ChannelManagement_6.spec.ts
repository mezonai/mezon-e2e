import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { expect } from '@playwright/test';

test.describe('Channel Management - Copy Channel Link', () => {
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

  test.afterEach(async ({ page }) => AuthHelper.logout(page));

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('Verify that user can copy a text channel link from the channel-list popover', async ({
    page,
    context,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can copy a text channel link from its channel-list popover.

      **Test Steps:**
      1. Create a public text channel
      2. Right-click the channel in the channel list
      3. Click Copy Link in the popover
      4. Read the copied value from the clipboard
      5. Open the copied link and verify it navigates to the selected channel

      **Expected Result:** The clipboard contains a valid link that opens the selected channel.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-management', 'channel-list', 'context-menu', 'copy-link'],
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const clanPage = new ClanPage(page);
    const channelName = `copy-link-${Date.now().toString(36)}`.slice(0, 20);

    await AllureReporter.step(`Create public text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    const copiedLink = await AllureReporter.step(
      'Right-click the channel and select Copy Link from the popover',
      async () => clanPage.copyChannelLinkFromChannelList(channelName)
    );

    await AllureReporter.step('Verify the clipboard contains a valid URL', async () => {
      expect(copiedLink).toBeTruthy();
      expect(() => new URL(copiedLink)).not.toThrow();
      expect(new URL(copiedLink).origin).toBe(new URL(page.url()).origin);
    });

    await AllureReporter.step('Open the copied URL and verify the selected channel', async () => {
      await page.goto(copiedLink, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(channelName, { exact: true }).first()).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
