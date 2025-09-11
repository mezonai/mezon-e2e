import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { expect, test } from '@playwright/test';
import { WEBSITE_CONFIGS } from '../../../config/environment';
import { joinUrlPaths } from '../../../utils/joinUrlPaths';
import { MessageTestHelpers } from '../../../utils/messageHelpers';

const MEZON_BASE_URL = WEBSITE_CONFIGS.MEZON.baseURL || '';
const DIRECT_CHAT_URL = joinUrlPaths(MEZON_BASE_URL, 'chat/direct/message/1955879210568388608/3');

export interface NavigationHelpers {
  navigateToHomePage(): Promise<void>;
  navigateToDirectChat(): Promise<void>;
  clickUserInChatList(username: string): Promise<void>;
  navigateToClanChannel(): Promise<void>;
}

export interface TestSuiteSetup {
  messageHelpers: MessageTestHelpers;
  clanSetupHelper: ClanSetupHelper;
  testClanName: string;
  testClanUrl: string;
}

export const setupChannelMessageSuite = (suiteName: string) => {
  let messageHelpers: MessageTestHelpers;
  let clanSetupHelper: ClanSetupHelper;
  let testClanName: string;
  let testClanUrl: string;

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);
    const setupResult = await clanSetupHelper.setupTestClan(ClanSetupHelper.configs.messageTests);

    testClanName = setupResult.clanName;
    testClanUrl = setupResult.clanUrl;
  });

  test.afterAll(async ({ browser }) => {
    if (clanSetupHelper) {
      await clanSetupHelper.cleanUpClan(
        browser,
        testClanUrl,
        ClanSetupHelper.configs.messageTests.suiteName
      );
    }
  });

  test.beforeEach(async ({ page, context }, testInfo) => {
    const accountUsed = await AuthHelper.setAuthForSuite(page, 'Channel Message');

    await AllureReporter.initializeTest(page, testInfo, {
      story: AllureConfig.Stories.TEXT_MESSAGING,
      severity: AllureConfig.Severity.CRITICAL,
      testType: AllureConfig.TestTypes.E2E,
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    messageHelpers = new MessageTestHelpers(page);
    const navigationHelpers = createNavigationHelpers(page, testClanUrl);

    await AllureReporter.step('Setup test environment', async () => {
      // await navigationHelpers.navigateToHomePage();
      // await navigationHelpers.navigateToDirectChat();
      await navigationHelpers.navigateToClanChannel();
    });
  });

  const getTestSuiteSetup = (): TestSuiteSetup => ({
    messageHelpers,
    clanSetupHelper,
    testClanName,
    testClanUrl,
  });

  return { getTestSuiteSetup };
};

export const createNavigationHelpers = (page: any, testClanUrl: string): NavigationHelpers => ({
  async navigateToHomePage(): Promise<void> {
    await page.goto(MEZON_BASE_URL);
    await page.waitForLoadState('domcontentloaded');
  },

  async navigateToDirectChat(): Promise<void> {
    const directFriendsUrl = joinUrlPaths(MEZON_BASE_URL, 'chat/direct/friends');
    await page.goto(directFriendsUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  },

  async clickUserInChatList(username: string): Promise<void> {
    const userSelectors = [
      `text=${username}`,
      `[data-testid*="${username}"]`,
      `div:has-text("${username}")`,
      `.user-item:has-text("${username}")`,
      `.direct-message:has-text("${username}")`,
    ];

    for (const selector of userSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 5000 })) {
        await element.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        return;
      }
    }

    await page.goto(DIRECT_CHAT_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  },

  async navigateToClanChannel(): Promise<void> {
    // Use the dynamically created clan URL
    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  },
});
