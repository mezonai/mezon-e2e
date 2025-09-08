import { Page } from '@playwright/test';
import { getLocalAuthData, getAuthConfigBySuite } from '@/config/environment';

export type AccountKey = 'account1' | 'account2' | 'account3';

export class AuthHelper {
  /**
   * Set authentication data for a specific account
   * @param page Playwright page instance
   * @param accountKey The account key to use
   * @returns The account key that was set
   */
  static async setAuthForAccount(page: Page, accountKey: AccountKey) {
    const authData = getLocalAuthData(accountKey);

    await page.addInitScript(authData => {
      localStorage.setItem(authData.persist.key, JSON.stringify(authData.persist.value));
      localStorage.setItem(authData.mezonSession.key, authData.mezonSession.value);
    }, authData);

    return accountKey;
  }

  /**
   * Set authentication data based on suite name
   * @param page Playwright page instance
   * @param suiteName The test suite name
   * @returns The account key that was used
   */
  static async setAuthForSuite(page: Page, suiteName: string) {
    const { config, accountKey } = getAuthConfigBySuite(suiteName);
    await this.setAuthForAccount(page, accountKey as AccountKey);
    return accountKey;
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
}
