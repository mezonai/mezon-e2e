import { type Page } from '@playwright/test';
import { MEZON_DEV, WEBSITE_CONFIGS } from '../config/environment';
import { generateE2eSelector } from '../utils/generateE2eSelector';
import { BasePage } from './BasePage';
import { HomePage } from './HomePage';

export class LoginPage extends BasePage {
  private selectors = {
    emailInput:
      'input#inputEmail, input[placeholder="Email address"], input[type="email"], input[name="email"]',
    loginButton:
      'button[id="sendOtpBtn"], button:has-text("Verify OTP"), button:has-text("Login"), button:has-text("Đăng nhập"), button[type="submit"], button:has-text("Verify"), button:has-text("Xác nhận"), button[aria-label*="Verify OTP"], button[aria-label*="Verify OTP code"], [data-testid="login-btn"]',

    loginWithPasswordLink: 'a:has-text("Login with Email and Password")',
    passwordInput: 'input[type="password"]',

    loadingSpinner: '.loading, .spinner, [data-testid="loading"]',
    authenticatedApp: `${generateE2eSelector('user_setting.profile.button_setting')}, ${generateE2eSelector('friend_page.tab')}`,
  };

  constructor(page: Page) {
    super(page, WEBSITE_CONFIGS.MEZON.baseURL);
  }
  private async clickLogin(): Promise<void> {
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login/callback')) {
      return;
    }

    const loginButton = this.page.locator(this.selectors.loginButton);

    await loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await loginButton.click();
  }

  private async switchToPasswordLogin(): Promise<void> {
    await this.page.reload();
    await this.page.locator(this.selectors.loginWithPasswordLink).click();
    await this.page.waitForLoadState('networkidle');
  }

  async waitForAuthenticatedAppReady(timeout = 30_000): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await this.page.waitForLoadState('domcontentloaded');

        // The runner reaches dev through VPN, so DOMContentLoaded can fire
        // while session hydration and the application bootstrap are still in
        // progress. An authenticated UI element is the actual readiness signal.
        await this.page
          .locator(this.selectors.loadingSpinner)
          .first()
          .waitFor({ state: 'hidden', timeout: 10_000 })
          .catch(() => {});
        await this.page
          .locator(this.selectors.authenticatedApp)
          .first()
          .waitFor({ state: 'visible', timeout });
        return;
      } catch (error) {
        lastError = error;

        if (attempt === 1) {
          console.warn(
            `Authenticated app was not ready after login; reloading once (${this.page.url()})`
          );
          await this.page.reload({ waitUntil: 'domcontentloaded' });
        }
      }
    }

    const reason = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Authenticated app did not become ready at ${this.page.url()}: ${reason}`);
  }

  async loginWithPassword(email: string, password: string): Promise<void> {
    const homePage = new HomePage(this.page);
    await this.page.goto(MEZON_DEV || '', { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(2000);
    await this.page.reload();
    await homePage.clickLogin();
    await this.page.waitForLoadState('domcontentloaded');
    await this.switchToPasswordLogin();

    await this.page.locator(this.selectors.emailInput).clear();
    await this.page.locator(this.selectors.emailInput).fill(email);

    await this.page.locator(this.selectors.passwordInput).clear();
    await this.page.locator(this.selectors.passwordInput).fill(password);

    await this.clickLogin();
    await this.waitForAuthenticatedAppReady();
  }
}
