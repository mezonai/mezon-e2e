import { WEBSITE_CONFIGS } from '@/config/environment';
import { Browser } from '@playwright/test';

const MEZON_BASE_URL = WEBSITE_CONFIGS.MEZON.baseURL || '';
const MAX_RETRIES = 3;
const WAITING_TIME_MS = 5000;
export interface ClanSetupConfig {
  clanNamePrefix?: string;
  suiteName?: string;
}

export interface ClanSetupResult {
  clanName: string;
  clanUrl: string;
  cleanup: () => Promise<void>;
}

export class ClanSetupHelper {
  private browser: Browser;
  private cleanupFunctions: Array<() => Promise<void>> = [];
  private retryCount: number = 0;

  constructor(browser: Browser) {
    this.browser = browser;
  }

  /**
   * Sets up a test clan
   * @param config Configuration options for clan setup
   * @returns Promise<ClanSetupResult> Setup result with clan details and cleanup function
   */

  // async setupTestClan(config: ClanSetupConfig = {}, page: Page): Promise<ClanSetupResult> {
  //   const { clanNamePrefix = 'TestClan', suiteName = 'Test Suite' } = config;

  //   const now = new Date();
  //   now.setMinutes(now.getMinutes() + 30);
  //   const timestamp = now.getTime();
  //   const clanName = `${clanNamePrefix}_${generateRandomString(10)}_${timestamp}`;

  //   try {
  //     const clanPage = new ClanPage(page);
  //     const createClanClicked = await clanPage.clickCreateClanButton();
  //     if (!createClanClicked) {
  //       throw new Error('Failed to click create clan button');
  //     }

  //     await clanPage.createNewClan(clanName);

  //     await page.waitForTimeout(1000);
  //     const clanExists = await clanPage.isClanPresent(clanName);
  //     if (!clanExists) {
  //       throw new Error(`Failed to create clan: ${clanName}`);
  //     }

  //     const clanUrl = page.url();

  //     const cleanup = async () => {
  //       await this.cleanupClan(clanName, clanUrl, suiteName);
  //     };
  //     this.cleanupFunctions.push(cleanup);

  //     return {
  //       clanName,
  //       clanUrl,
  //       cleanup,
  //     };
  //   } catch (error) {
  //     if (this.retryCount >= MAX_RETRIES) {
  //       throw new Error(`Failed to setup test clan: ${error}`);
  //     }
  //     this.retryCount++;
  //     console.log(
  //       `Waiting ${WAITING_TIME_MS}ms for retrying setup clan with test suite: ${config.suiteName} - (${this.retryCount}/${MAX_RETRIES})...`
  //     );
  //     await sleep(WAITING_TIME_MS);
  //     return this.setupTestClan(config, page);
  //   }
  // }

  // /**
  //  * Cleans up a specific clan
  //  * @param clanName Name of the clan to delete
  //  * @param clanUrl URL of the clan to navigate to
  //  * @param suiteName Name of the test suite for authentication
  //  */
  // async cleanupClan(clanName: string, clanUrl: string, account: any): Promise<void> {
  //   if (!clanName || !clanUrl) {
  //     return;
  //   }

  //   const context = await this.browser.newContext();
  //   const page = await context.newPage();

  //   try {
  //     await AuthHelper.prepareBeforeTest(page, clanUrl, clanName, account);

  //     await page.waitForLoadState('domcontentloaded');

  //     const clanPage = new ClanPage(page);

  //     await clanPage.deleteClan(false);
  //   } catch (error) {
  //     console.log(`Failed to cleanup test clan: ${error}`);
  //   } finally {
  //     await context.close();
  //   }
  // }

  /**
   * Creates a setup configuration for different test scenarios
   */
  static createConfig(overrides: Partial<ClanSetupConfig> = {}): ClanSetupConfig {
    return {
      clanNamePrefix: 'TestClan',
      suiteName: 'Test Suite',
      ...overrides,
    };
  }

  /**
   * Predefined configurations for common test scenarios
   */
  static readonly configs = {
    channelMessage1: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message - Module 1',
    }),

    channelMessage2: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message - Module 2',
    }),

    channelMessage3: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message - Module 3',
    }),

    channelMessage4: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message - Module 4',
    }),

    channelMessage5: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message - Module 5',
    }),

    clanManagement: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ClanManagementTest',
      suiteName: 'Clan Management',
    }),

    clanManagement2: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ClanManagementTest',
      suiteName: 'Clan Management - Module 2',
    }),

    channelManagement: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ChannelMgmtTest',
      suiteName: 'Channel Management',
    }),

    onboarding: ClanSetupHelper.createConfig({
      clanNamePrefix: 'OnboardingTest',
      suiteName: 'Onboarding Guide',
    }),

    uploadFile: ClanSetupHelper.createConfig({
      clanNamePrefix: 'UploadFileTest',
      suiteName: 'Upload File',
    }),

    uploadFile2: ClanSetupHelper.createConfig({
      clanNamePrefix: 'UploadFileTest',
      suiteName: 'Upload File - Module 2',
    }),

    uploadFile3: ClanSetupHelper.createConfig({
      clanNamePrefix: 'UploadFileTest',
      suiteName: 'Upload File - Module 3',
    }),

    uploadFile4: ClanSetupHelper.createConfig({
      clanNamePrefix: 'UploadFileTest',
      suiteName: 'Upload File - Module 4',
    }),

    userProfile: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ProfileTest',
      suiteName: 'User Profile',
    }),

    userProfileUserSetting: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ProfileTest',
      suiteName: 'User Profile - User Setting',
    }),

    clanProfile: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ProfileTest',
      suiteName: 'Clan Profile',
    }),

    clanProfile2: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ProfileTest',
      suiteName: 'Clan Profile - Module 2',
    }),

    userProfile1: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ProfileTest1',
      suiteName: 'User Profile - Module 1',
    }),

    threadManagement: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ThreadMgmtTest',
      suiteName: 'Thread Management',
    }),
    standaloneClanManagement: ClanSetupHelper.createConfig({
      clanNamePrefix: 'StandaloneClanManagementTest',
      suiteName: 'Standalone - Clan Management',
    }),

    directMessage: ClanSetupHelper.createConfig({
      clanNamePrefix: 'DirectMessageTest',
      suiteName: 'Direct Message',
    }),

    topicMessage: ClanSetupHelper.createConfig({
      clanNamePrefix: 'TopicMessageTest',
      suiteName: 'Topic Message',
    }),

    blockUser: ClanSetupHelper.createConfig({
      clanNamePrefix: 'BlockUserTest',
      suiteName: 'Block User',
    }),
  };
}

/**
 * Convenience function to create a clan setup helper
 * @param browser Playwright browser instance
 * @returns ClanSetupHelper instance
 */
export const createClanSetupHelper = (browser: Browser): ClanSetupHelper => {
  return new ClanSetupHelper(browser);
};
