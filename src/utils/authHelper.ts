import { persistentAuthConfigs, WEBSITE_CONFIGS } from '@/config/environment';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { MezonCredentials } from '@/types';
import { Page } from '@playwright/test';

export type AccountKey = keyof typeof persistentAuthConfigs;

export class AuthHelper {
  /**
   * Set authentication data for a specific account
   * @param page Playwright page instance
   * @param credentials Object containing all localStorage data
   * @returns The account key that was set
   */
  static async setAuthForAccount(page: Page, credentials: any = null) {
    await page.evaluate(
      ({ credentials }) => {
        // Set all localStorage data dynamically
        if (credentials && typeof credentials === 'object') {
          Object.keys(credentials).forEach(key => {
            if (credentials[key] !== null && credentials[key] !== undefined) {
              localStorage.setItem(key, credentials[key]);
            }
          });
        }
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
    const endpoint = WEBSITE_CONFIGS.MEZON.baseURL || '';
    await page.goto(endpoint);
    await page.waitForLoadState('domcontentloaded');
    this.clearAuth(page);
    await page.waitForLoadState('networkidle');
    await this.setAuthForAccount(page, credentials);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const homePage = new HomePage(page);
    await homePage.clickLogin();
    await page.waitForLoadState('domcontentloaded');
  }

  /**
   * Clear authentication data
   * @param page Playwright page instance
   */
  static async clearAuth(page: Page) {
    await page.evaluate(() => {
      localStorage.removeItem('persist:auth');
      localStorage.removeItem('mezon_session');
      localStorage.removeItem('mezon_refresh_session');
    });
  }

  static async setupAuthWithEmailPassword(page: Page, credentials: MezonCredentials) {
    const loginPage = new LoginPage(page);
    await loginPage.loginWithPassword(credentials.email, credentials.password);
    return await page.evaluate(() => {
      // Get all localStorage data
      const allLocalStorageData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          allLocalStorageData[key] = localStorage.getItem(key) || '';
        }
      }
      return allLocalStorageData;
    });
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
  static async prepareBeforeTest(page: Page, clanUrl: string, credentials: any) {
    await AuthHelper.setAuthForSuite(page, credentials);
    await page.goto(clanUrl, { waitUntil: 'domcontentloaded' });
  }

  static async logout(page: Page) {
    const profilePage = new ProfilePage(page);
    await profilePage.clickLogout();
  }
}
