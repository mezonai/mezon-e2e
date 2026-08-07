import { persistentAuthConfigs, WEBSITE_CONFIGS } from '@/config/environment';
import { LoginPage } from '@/pages/LoginPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { MezonCredentials } from '@/types';
import { Page } from '@playwright/test';
import ClanSelector from '@/data/selectors/ClanSelector';

export type AccountKey = keyof typeof persistentAuthConfigs;
type LocalStorageCredentials = Record<string, string> | null;

const MEZON_DEV_ORIGIN = 'https://dev-mezon.nccsoft.vn';

const isDevEnvironment = (): boolean => {
  try {
    return new URL(WEBSITE_CONFIGS.MEZON.baseURL).origin === MEZON_DEV_ORIGIN;
  } catch {
    return false;
  }
};

export class AuthHelper {
  /**
   * Set authentication data for a specific account
   * @param page Playwright page instance
   * @param credentials Object containing all localStorage data
   * @returns The account key that was set
   */
  static async setAuthForAccount(page: Page, credentials: LocalStorageCredentials = null) {
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
  static async setAuthForSuite(page: Page, credentials: LocalStorageCredentials = null) {
    const endpoint = WEBSITE_CONFIGS.MEZON.baseURL || '';

    // Login is performed directly on dev, so its existing browser storage is
    // already valid and must not be cleared or overwritten.
    if (isDevEnvironment()) {
      return;
    }

    await page.goto(endpoint, { waitUntil: 'domcontentloaded' });
    await this.clearAuth(page);
    await this.setAuthForAccount(page, credentials);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.goto(`${endpoint}chat`, { waitUntil: 'domcontentloaded' });
    // const homePage = new HomePage(page);
    // await homePage.clickLogin();

    const clanSelector = new ClanSelector(page);
    try {
      if (await clanSelector.permissionModal.isVisible(4000)) {
        await clanSelector.permissionModal.cancel.first().click();
        console.log('Closed permission modal');
      }
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

    // Dev continues with the authenticated session on the same origin. Local
    // environments still need this data copied from dev before continuing.
    if (isDevEnvironment()) {
      return {};
    }

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
  static async prepareBeforeTest(
    page: Page,
    clanUrl: string,
    credentials: LocalStorageCredentials
  ) {
    await AuthHelper.setAuthForSuite(page, credentials);
    await page.goto(clanUrl, { waitUntil: 'domcontentloaded' });
    await new LoginPage(page).waitForAuthenticatedAppReady();

    const clanSelector = new ClanSelector(page);
    try {
      if (await clanSelector.permissionModal.isVisible(3000)) {
        await clanSelector.permissionModal.cancel.first().click();
        console.log('Closed permission modal');
      }
    } catch {
      // Ignored if modal does not appear
    }
  }

  static async logout(page: Page, waitBeforeNextTest: boolean = true) {
    const profilePage = new ProfilePage(page);
    await profilePage.clickLogout();

    const testGapMs = Number.parseInt(process.env.TEST_GAP_MS || '0', 10);
    if (waitBeforeNextTest && Number.isFinite(testGapMs) && testGapMs > 0) {
      console.log(`Waiting ${testGapMs}ms before the next test...`);
      await new Promise(resolve => setTimeout(resolve, testGapMs));
    }
  }
}
