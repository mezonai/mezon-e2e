import { persistentAuthConfigs, WEBSITE_CONFIGS } from '@/config/environment';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { MezonCredentials } from '@/types';
import { Page } from '@playwright/test';
import ClanSelector from '@/data/selectors/ClanSelector';

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
    await page.waitForTimeout(1000);
    await page.goto(`${endpoint}`);
    await page.waitForLoadState('domcontentloaded');
    this.clearAuth(page);
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
    await this.setAuthForAccount(page, credentials);
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.goto(`${endpoint}chat`);
    // const homePage = new HomePage(page);
    // await homePage.clickLogin();
    await page.waitForTimeout(1500);
    await page.waitForLoadState('domcontentloaded');

    const clanSelector = new ClanSelector(page);
    try {
      const permissionModalLocator = page.locator(
        '[data-e2e="clan_page-settings-modal-permission"]'
      );
      await permissionModalLocator.waitFor({ state: 'visible', timeout: 4000 });
      await clanSelector.permissionModal.cancel.first().click();
      console.log('Closed permission modal');
    } catch {
      // Ignored if modal does not appear
    }
  }

  /**
   * Clear authentication data
   * @param page Playwright page instance
   */
  static async clearAuth(page: Page) {
    await page.evaluate(() => {
      localStorage.removeItem('persist:auth');
      localStorage.removeItem('persist:wallet');
      // localStorage.removeItem('mezon_session');
      // localStorage.removeItem('mezon_refresh_session');
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

    // Guard: if session was invalidated, the app redirects to OAuth/login.
    // Wait for the OAuth flow to resolve (up to 15s) then re-navigate to clan.
    const currentUrl = page.url();
    const isRedirectedToAuth =
      currentUrl.includes('oauth2.mezon.ai') ||
      currentUrl.includes('account.mezon.ai') ||
      currentUrl.includes('/login') ||
      currentUrl.includes('/authentication');

    if (isRedirectedToAuth) {
      console.log(
        `[AuthHelper] Session redirect detected: ${currentUrl} — waiting for OAuth to resolve...`
      );
      try {
        await page.waitForURL(
          url =>
            !url.toString().includes('oauth2.mezon.ai') &&
            !url.toString().includes('account.mezon.ai') &&
            !url.toString().includes('/login') &&
            !url.toString().includes('/authentication'),
          { timeout: 15000 }
        );
        console.log('[AuthHelper] OAuth resolved, re-navigating to clan URL...');
        await page.goto(clanUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
      } catch {
        console.warn('[AuthHelper] OAuth did not resolve in time — proceeding anyway');
      }
    }

    const clanSelector = new ClanSelector(page);
    try {
      const permissionModalLocator = page.locator(
        '[data-e2e="clan_page-settings-modal-permission"]'
      );
      await permissionModalLocator.waitFor({ state: 'visible', timeout: 3000 });
      await clanSelector.permissionModal.cancel.first().click();
      console.log('Closed permission modal');
    } catch {
      // Ignored if modal does not appear
    }
  }

  static async logout(page: Page) {
    const profilePage = new ProfilePage(page);
    await profilePage.clickLogout();
  }
}
