import { HomePage } from './../pages/HomePage';
import { Page } from '@playwright/test';
import {
  getLocalAuthData,
  getAuthConfigBySuite,
  persistentAuthConfigs,
  WEBSITE_CONFIGS,
} from '@/config/environment';
import { LoginPage } from '@/pages/LoginPage';
import { ClanPageV2 } from '@/pages/ClanPageV2';

export type AccountKey = keyof typeof persistentAuthConfigs;

export class AuthHelper {
  /**
   * Set authentication data for a specific account
   * @param page Playwright page instance
   * @param accountKey The account key to use
   * @returns The account key that was set
   */
  static async setAuthForAccount(page: Page, credentials: any = null) {
    await page.addInitScript(
      ({ credentials }) => {
        localStorage.setItem('persist:auth', credentials.persistAuth);
        localStorage.setItem('mezon_session', credentials.mezonSession);
        localStorage.setItem('mezon_refresh_token', credentials.mezonRefreshToken);
      },
      { credentials }
    );
  }

  /**
   * Set authentication data based on suite name
   * @param page Playwright page instance
   * @param suiteName The test suite name
   * @returns The account key that was used
   */
  static async setAuthForSuite(page: Page, credentials: any = null) {
    await this.setAuthForAccount(page, credentials);
    await page.reload();
    await page.goto(WEBSITE_CONFIGS.MEZON.baseURL || '');
    await page.waitForLoadState('domcontentloaded');

    const clanPage = new ClanPageV2(page);

    await clanPage.navigate('/chat/direct/friends');
    await page.waitForLoadState('domcontentloaded');
  }

  /**
   * Clear authentication data
   * @param page Playwright page instance
   */
  static async clearAuth(page: Page) {
    await page.addInitScript(() => {
      localStorage.removeItem('persist:auth');
      localStorage.removeItem('mezon_session');
    });
  }

  static async setupAuthWithEmailPassword(page: Page, email: string, password: string) {
    const loginPage = new LoginPage(page);
    await loginPage.loginWithPassword(email, password);

    const persistAuth = await page.evaluate(() => {
      const persistAuth = localStorage.getItem('persist:auth');
      const mezonSession = localStorage.getItem('mezon_session');
      const mezonRefreshToken = localStorage.getItem('mezon_refresh_token');
      return { persistAuth, mezonSession, mezonRefreshToken };
    });

    return persistAuth;
  }

  /**
   * Prepare test environment before each test
   * @param page Playwright page instance
   * @param clanUrl URL of the clan to navigate to
   * @param clanName Name of the clan for parameters
   * @param email Email for authentication
   * @param password Password for authentication
   * @param suiteName Test suite name
   * @param parentIssue Parent issue for work item links
   */
  static async prepareBeforeTest(
    page: Page,
    clanUrl: string,
    clanName: string,
    accCredentials: any
  ) {
    // Setup authentication with email and password
    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      accCredentials.email,
      accCredentials.password
    );

    // Set auth for the suite
    await AuthHelper.setAuthForSuite(page, credentials);

    // Navigate to the clan URL
    await page.goto(clanUrl, { waitUntil: 'domcontentloaded' });
  }
}
