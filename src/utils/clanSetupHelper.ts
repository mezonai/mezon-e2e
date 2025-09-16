import { WEBSITE_CONFIGS } from '@/config/environment';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { AuthHelper } from '@/utils/authHelper';
import { Browser } from '@playwright/test';
import generateRandomString from './randomString';

const MEZON_BASE_URL = WEBSITE_CONFIGS.MEZON.baseURL || '';

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

  constructor(browser: Browser) {
    this.browser = browser;
  }

  /**
   * Sets up a test clan
   * @param config Configuration options for clan setup
   * @returns Promise<ClanSetupResult> Setup result with clan details and cleanup function
   */
  async setupTestClan(config: ClanSetupConfig = {}): Promise<ClanSetupResult> {
    const { clanNamePrefix = 'TestClan', suiteName = 'Test Suite' } = config;

    const timestamp = Date.now();
    const clanName = `${clanNamePrefix}_${generateRandomString(10)}`;

    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      // Authenticate the user
      // await AuthHelper.setAuthForSuite(page, suiteName);

      // Navigate to home page
      await page.goto(MEZON_BASE_URL);
      await page.waitForLoadState('domcontentloaded');

      const clanPage = new ClanPageV2(page);

      // Navigate to the clan creation area
      await clanPage.navigate('/chat/direct/friends');
      await page.waitForLoadState('domcontentloaded');

      // Create new clan
      const createClanClicked = await clanPage.clickCreateClanButton();
      if (!createClanClicked) {
        throw new Error('Failed to click create clan button');
      }

      await clanPage.createNewClan(clanName);

      // Wait for clan creation and verify it exists
      await page.waitForTimeout(5000);
      const clanExists = await clanPage.isClanPresent(clanName);
      if (!clanExists) {
        throw new Error(`Failed to create clan: ${clanName}`);
      }

      // Get the clan URL
      const clanUrl = page.url();

      // Create cleanup function
      const cleanup = async () => {
        await this.cleanupClan(clanName, clanUrl, suiteName);
      };

      // Store cleanup function for batch cleanup
      this.cleanupFunctions.push(cleanup);

      await context.close();

      return {
        clanName,
        clanUrl,
        cleanup,
      };
    } catch (error) {
      await context.close();
      throw new Error(`Failed to setup test clan: ${error}`);
    }
  }

  /**
   * Cleans up a specific clan
   * @param clanName Name of the clan to delete
   * @param clanUrl URL of the clan to navigate to
   * @param suiteName Name of the test suite for authentication
   */
  async cleanupClan(
    clanName: string,
    clanUrl: string,
    suiteName: string = 'Cleanup'
  ): Promise<void> {
    if (!clanName || !clanUrl) {
      return;
    }

    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      await AuthHelper.setAuthForSuite(page, suiteName);

      await page.goto(clanUrl);
      await page.waitForLoadState('domcontentloaded');

      const clanPage = new ClanPageV2(page);

      await clanPage.deleteClan();
    } catch (error) {
      console.log(`Failed to cleanup test clan: ${error}`);
    } finally {
      await context.close();
    }
  }

  /**
   * Cleans up all clans created by this helper instance
   * @param browser Playwright browser instance
   * @param suiteName Name of the test suite for authentication (default: 'Cleanup')
   */
  async cleanupAllClans(browser: Browser, suiteName: string = 'Cleanup'): Promise<void> {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await AuthHelper.setAuthForSuite(page, suiteName);

      await page.goto(MEZON_BASE_URL);
      await page.waitForLoadState('domcontentloaded');

      const clanPage = new ClanPageV2(page);
      await clanPage.navigate('/chat/direct/friends');
      await page.waitForLoadState('networkidle');

      const clanItems = await clanPage.sidebar.clanItems;
      const clanItemsCount = await clanItems.clanName.count();

      if (clanItemsCount === 0) {
        return;
      }

      for (let i = clanItemsCount - 1; i >= 0; i--) {
        try {
          const currentClanItems = await clanPage.sidebar.clanItems;
          const currentCount = await currentClanItems.clanName.count();

          if (i >= currentCount) {
            continue;
          }

          const clanItem = currentClanItems.clanName.nth(i);

          await clanItem.click();
          const clanName = await clanPage.buttons.clanName.innerText();

          await clanPage.deleteClan();
        } catch (error) {
          console.error(`❌ Failed to delete clan at index ${i}: ${error}`);
          continue;
        }
      }

      console.log('✅ All clans cleanup completed successfully');
    } catch (error) {
      console.error(`❌ Error during cleanup process: ${error}`);
      throw error;
    } finally {
      await context.close();
      console.log('🔄 Browser context closed');
    }
  }

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

    channelManagement: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ChannelMgmtTest',
      suiteName: 'Channel Management',
    }),

    onboarding: ClanSetupHelper.createConfig({
      clanNamePrefix: 'OnboardingTest',
      suiteName: 'Onboarding Guide',
    }),

    userProfile: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ProfileTest',
      suiteName: 'User Profile',
    }),
    threadManagement: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ThreadMgmtTest',
      suiteName: 'Thread Management',
    }),
    channelMessageCore: ClanSetupHelper.createConfig({
      clanNamePrefix: 'CoreMessageTest',
      suiteName: 'Channel Message - Core',
    }),

    channelMessageSocial: ClanSetupHelper.createConfig({
      clanNamePrefix: 'SocialMessageTest',
      suiteName: 'Channel Message - Social',
    }),

    channelMessageMedia: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MediaMessageTest',
      suiteName: 'Channel Message - Media',
    }),
  };

  /**
   * Simple clan setup function for basic use cases
   * @param browser Playwright browser instance
   * @param config Configuration options
   * @returns Promise<ClanSetupResult> Setup result
   */
  static async setupTestClan(
    browser: Browser,
    config: ClanSetupConfig = {}
  ): Promise<ClanSetupResult> {
    const helper = new ClanSetupHelper(browser);
    return helper.setupTestClan(config);
  }

  /**
   * Simple clan cleanup function
   * @param browser Playwright browser instance
   * @param clanName Name of the clan to delete
   * @param clanUrl URL of the clan
   * @param suiteName Name of the test suite
   */
  static async cleanupTestClan(
    browser: Browser,
    clanName: string,
    clanUrl: string,
    suiteName: string = 'Cleanup'
  ): Promise<void> {
    const helper = new ClanSetupHelper(browser);
    return helper.cleanupClan(clanName, clanUrl, suiteName);
  }
}

/**
 * Convenience function to create a clan setup helper
 * @param browser Playwright browser instance
 * @returns ClanSetupHelper instance
 */
export const createClanSetupHelper = (browser: Browser): ClanSetupHelper => {
  return new ClanSetupHelper(browser);
};
