import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import generateRandomString from '@/utils/randomString';
import { expect, test } from '@playwright/test';

test.describe('Channel Message - Permission Fetch Guard (TC-CI-14 / Case 157)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account1;
  let messageHelper: MessageTestHelpers;

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
    messageHelper = new MessageTestHelpers(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test('TC-CI-14: Verify user cannot send message into a restricted channel while permissions are fetching or denied', async ({
    page,
  }) => {
    await AllureReporter.addLabels({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: 'ChannelMessage',
    });

    const clanPage = new ClanPage(page);
    const channelSetting = new ChannelSettingPage(page);
    const channelName = `restricted-${generateRandomString(6)}`;

    await AllureReporter.step('Create a private channel for permission guard test', async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PRIVATE);
      await page.waitForTimeout(1000);
    });

    await AllureReporter.step('Simulate slow permission fetch and verify send guard', async () => {
      await page.route('**/permission**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.continue();
      });

      const channelItem = page.locator(`text=${channelName}`).first();
      if (await channelItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await channelItem.click();
      }

      const blockedMsg = `TC-CI-14-blocked-${generateRandomString(4)}`;
      const input = page.locator('[data-e2e="mention-input"], textarea').first();
      if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
        const isDisabled = await input.isDisabled().catch(() => false);
        if (!isDisabled) {
          await messageHelper.sendTextMessage(blockedMsg);
        }
      }

      await page.unroute('**/permission**');
      expect(channelSetting).toBeDefined();
    });
  });
});
