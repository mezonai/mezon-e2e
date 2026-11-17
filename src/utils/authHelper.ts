import { AccountCredentials, persistentAuthConfigs, WEBSITE_CONFIGS } from '@/config/environment';
import { LoginPage } from '@/pages/LoginPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { MezonCredentials } from '@/types';
import { Page, test } from '@playwright/test';
import ClanSelector from '@/data/selectors/ClanSelector';
import fs from 'fs';
import path from 'path';

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

    // Seed storage on a blank same-origin document. Loading the application before
    // injecting credentials starts its unauthenticated bootstrap, whose delayed
    // logout can overwrite the credentials and redirect an otherwise ready page
    // back to the login screen.
    const authBootstrapUrl = new URL('/__e2e_auth_bootstrap__', endpoint).toString();
    await page.route(authBootstrapUrl, route =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>E2E auth bootstrap</title>',
      })
    );

    try {
      await page.goto(authBootstrapUrl, { waitUntil: 'domcontentloaded' });
      await this.clearAuth(page);
      await this.setAuthForAccount(page, credentials);
    } finally {
      await page.unroute(authBootstrapUrl);
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

  static getWorkerIndex(): number {
    const envParallelIndex = process.env.TEST_PARALLEL_INDEX;
    if (envParallelIndex !== undefined) {
      const idx = parseInt(envParallelIndex, 10);
      if (!isNaN(idx)) return idx;
    }

    const envWorkerIndex = process.env.TEST_WORKER_INDEX;
    if (envWorkerIndex !== undefined) {
      const idx = parseInt(envWorkerIndex, 10);
      if (!isNaN(idx)) return idx;
    }

    try {
      const testInfo = test.info();
      if (testInfo) {
        if (typeof testInfo.parallelIndex === 'number') return testInfo.parallelIndex;
        if (typeof testInfo.workerIndex === 'number') return testInfo.workerIndex;
      }
    } catch {
      // test.info() throws when called outside an active test step
    }

    return 0;
  }

  static resolveWorkerCredentials(credentials: MezonCredentials): MezonCredentials {
    if (!credentials?.email) return credentials;

    if (process.env.WORKER_ACCOUNT_ISOLATION === 'false') {
      return credentials;
    }

    const workerIndex = Math.max(0, this.getWorkerIndex());

    const email = credentials.email.toLowerCase();

    // Map each primary account to a dedicated worker pool with existing clans and friends
    const pools: Record<string, MezonCredentials[]> = {
      [AccountCredentials.account1.email.toLowerCase()]: [
        AccountCredentials.account1,
        AccountCredentials.account8,
        AccountCredentials.account4,
        AccountCredentials.account6,
      ],
      [AccountCredentials.account2.email.toLowerCase()]: [
        AccountCredentials.account4,
        AccountCredentials.account6,
        AccountCredentials.account8,
        AccountCredentials.account5,
      ],
      [AccountCredentials.account3.email.toLowerCase()]: [
        AccountCredentials.account3,
        AccountCredentials.account5,
        AccountCredentials.account6,
        AccountCredentials.account4,
        AccountCredentials.account9,
      ],
      [AccountCredentials.account4.email.toLowerCase()]: [
        AccountCredentials.account4,
        AccountCredentials.account6,
        AccountCredentials.account3,
        AccountCredentials.account5,
        AccountCredentials.account9,
      ],
      [AccountCredentials.account5.email.toLowerCase()]: [
        AccountCredentials.account5,
        AccountCredentials.account3,
        AccountCredentials.account6,
        AccountCredentials.account9,
        AccountCredentials.account4,
      ],
      [AccountCredentials.account6.email.toLowerCase()]: [
        AccountCredentials.account6,
        AccountCredentials.account4,
        AccountCredentials.account5,
        AccountCredentials.account3,
        AccountCredentials.account9,
      ],
      [AccountCredentials.account7.email.toLowerCase()]: [
        AccountCredentials.account5,
        AccountCredentials.account9,
        AccountCredentials.account3,
        AccountCredentials.account6,
        AccountCredentials.account4,
      ],
      [AccountCredentials.account8.email.toLowerCase()]: [
        AccountCredentials.account8,
        AccountCredentials.account1,
        AccountCredentials.account5,
        AccountCredentials.account6,
      ],
      [AccountCredentials.account9.email.toLowerCase()]: [
        AccountCredentials.account9,
        AccountCredentials.account3,
        AccountCredentials.account5,
        AccountCredentials.account6,
        AccountCredentials.account4,
      ],
    };

    const targetPool = pools[email];
    if (targetPool && targetPool.length > 0) {
      return targetPool[workerIndex % targetPool.length];
    }

    return credentials;
  }

  static getStoragePathForCredentials(credentials: MezonCredentials): string | null {
    if (!credentials?.email) return null;
    const authDir = path.resolve('playwright/.auth');
    for (const [key, creds] of Object.entries(AccountCredentials)) {
      if (creds.email.toLowerCase() === credentials.email.toLowerCase()) {
        return path.join(authDir, `${key}.json`);
      }
    }
    const safeKey = credentials.email.replace(/[^a-zA-Z0-9]/g, '_');
    return path.join(authDir, `${safeKey}.json`);
  }

  static async injectStorageState(page: Page, authFilePath: string): Promise<boolean> {
    try {
      if (!fs.existsSync(authFilePath)) return false;
      const authData = JSON.parse(fs.readFileSync(authFilePath, 'utf-8'));
      if (authData.cookies && Array.isArray(authData.cookies)) {
        await page.context().addCookies(authData.cookies);
      }
      if (authData.origins && authData.origins.length > 0) {
        const originData = authData.origins[0];
        if (originData.localStorage && Array.isArray(originData.localStorage)) {
          await page.addInitScript(storageItems => {
            for (const item of storageItems) {
              try {
                window.localStorage.setItem(item.name, item.value);
              } catch {}
            }
          }, originData.localStorage);

          if (page.url() !== 'about:blank' && page.url().includes('mezon')) {
            await page
              .evaluate(storageItems => {
                for (const item of storageItems) {
                  try {
                    window.localStorage.setItem(item.name, item.value);
                  } catch {}
                }
              }, originData.localStorage)
              .catch(() => {});
          }
        }
      }
      return true;
    } catch (err) {
      console.warn(`Failed to inject storage state from ${authFilePath}:`, err);
      return false;
    }
  }

  static async setupAuthWithEmailPassword(
    page: Page,
    credentials: MezonCredentials,
    targetUrl?: string
  ) {
    const resolvedCredentials = this.resolveWorkerCredentials(credentials);
    const authFilePath = this.getStoragePathForCredentials(resolvedCredentials);
    const useFastAuth = process.env.FAST_AUTH !== 'false';

    if (useFastAuth && authFilePath && fs.existsSync(authFilePath)) {
      const injected = await this.injectStorageState(page, authFilePath);
      if (injected) {
        const destination = targetUrl || `${WEBSITE_CONFIGS.MEZON.baseURL}/chat/friends`;
        if (page.url() === 'about:blank') {
          await page.goto(destination, { waitUntil: 'domcontentloaded' });
          await new LoginPage(page).waitForAuthenticatedAppReady();
        }
        return {};
      }
    }

    const loginPage = new LoginPage(page);
    await loginPage.loginWithPassword(resolvedCredentials.email, resolvedCredentials.password);

    if (authFilePath) {
      try {
        const dir = path.dirname(authFilePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        await page.context().storageState({ path: authFilePath });
      } catch (e) {
        console.warn('Failed to save storageState:', e);
      }
    }

    if (isDevEnvironment()) {
      return {};
    }

    await page.waitForFunction(() => {
      try {
        const persistedAuth = localStorage.getItem('persist:auth');
        if (!persistedAuth) return false;
        const authState = JSON.parse(persistedAuth);
        if (!authState?.session) return false;
        const session = JSON.parse(authState.session);
        return Boolean(session?.session_id);
      } catch {
        return false;
      }
    });

    return await page.evaluate(() => {
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
    if (page.url() !== clanUrl && !page.url().includes(clanUrl)) {
      await page.goto(clanUrl, { waitUntil: 'domcontentloaded' });
    }
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

  static async logout(page: Page, waitBeforeNextTest: boolean = false) {
    const skipUiLogout = process.env.SKIP_UI_LOGOUT !== 'false';
    if (!skipUiLogout) {
      const profilePage = new ProfilePage(page);
      const logoutSuccess = await profilePage.clickLogout();

      if (!logoutSuccess) {
        console.warn('Logout encountered issues - ensuring session cleanup');
      }
    }

    try {
      await page.context().clearCookies();
      await page
        .evaluate(() => {
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch {}
        })
        .catch(() => {});
    } catch {
      // Ignored if page/context is already closed
    }

    if (waitBeforeNextTest && !skipUiLogout) {
      const testGapMs = Number.parseInt(process.env.TEST_GAP_MS || '0', 10);
      if (Number.isFinite(testGapMs) && testGapMs > 0) {
        console.log(`Waiting ${testGapMs}ms before the next test...`);
        await new Promise(resolve => setTimeout(resolve, testGapMs));
      }
    }
  }
}
