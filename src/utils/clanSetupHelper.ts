import { Browser, Page } from '@playwright/test';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { AuthHelper } from '@/utils/authHelper';
import { WEBSITE_CONFIGS } from '@/config/environment';

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
    const clanName = `${clanNamePrefix}_${timestamp}`;

    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      // Authenticate the user
      await AuthHelper.setAuthForSuite(page, suiteName);

      // Navigate to home page
      await page.goto(MEZON_BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      const clanPage = new ClanPageV2(page);

      // Navigate to the clan creation area
      await clanPage.navigate('/chat/direct/friends');
      await page.waitForTimeout(2000);

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

      console.log(`✅ Created test clan: ${clanName}`);
      console.log(`🔗 Clan URL: ${clanUrl}`);

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
      console.log('⚠️ No clan name or URL provided for cleanup');
      return;
    }

    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      // Authenticate the user
      await AuthHelper.setAuthForSuite(page, suiteName);

      // Navigate to the specific clan URL to ensure we're in the right context
      await page.goto(clanUrl);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      const clanPage = new ClanPageV2(page);

      // Delete the test clan
      await clanPage.deleteClan(clanName);
      await page.waitForTimeout(3000);

      console.log(`🗑️ Deleted test clan: ${clanName}`);
    } catch (error) {
      console.error(`❌ Failed to cleanup test clan: ${error}`);
      // Don't throw error in cleanup to avoid affecting test results
    } finally {
      await context.close();
    }
  }

  /**
   * Cleans up all clans created by this helper instance
   */
  async cleanupAllClans(): Promise<void> {
    console.log(`🧹 Starting cleanup of ${this.cleanupFunctions.length} clans...`);

    for (const cleanup of this.cleanupFunctions) {
      try {
        await cleanup();
      } catch (error) {
        console.error(`❌ Error during clan cleanup: ${error}`);
      }
    }

    this.cleanupFunctions = [];
    console.log('✅ Clan cleanup completed');
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
    messageTests: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message',
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
