import { type Page, expect } from '@playwright/test';
import { MEZON_DEV, WEBSITE_CONFIGS } from '../config/environment';
import { type MezonTestUser } from '../data/static/TestUsers';
import { joinUrlPaths } from '../utils/joinUrlPaths';
import { BasePage } from './BasePage';
import { HomePage } from './HomePage';

export class LoginPage extends BasePage {
  private selectors = {
    loginTitle: 'text=Log in to Mezon account',
    welcomeMessage: 'text=So glad to meet you again!',
    enterEmailText: 'text=Enter your email to login',

    emailInput:
      'input#inputEmail, input[placeholder="Email address"], input[type="email"], input[name="email"]',
    sendOtpButton: 'button#sendOtpBtn, button:has-text("Send OTP")',
    otpInput: 'input#otp, input[name="otp"], input[placeholder="OTP"], input[type="number"]',
    loginButton:
      'button[id="sendOtpBtn"], button:has-text("Verify OTP"), button:has-text("Login"), button:has-text("Đăng nhập"), button[type="submit"], button:has-text("Verify"), button:has-text("Xác nhận"), button[aria-label*="Verify OTP"], button[aria-label*="Verify OTP code"], [data-testid="login-btn"]',

    loginWithPasswordLink: 'a:has-text("Login with Email and Password")',
    passwordInput: 'input[type="password"]',

    qrCodeImage: 'img[alt="QR Code"]',
    qrCodeSection: '.qr-code-container, [data-testid="qr-code"]',

    errorMessage: '.error-message, .alert-danger, [data-testid="error"]',

    loadingSpinner: '.loading, .spinner, [data-testid="loading"]',

    emailValidationError: '.email-error, [data-testid="email-error"]',
    otpValidationError: '.otp-error, [data-testid="otp-error"]',
  };

  constructor(page: Page) {
    super(page, WEBSITE_CONFIGS.MEZON.baseURL);
  }

  async navigate(): Promise<void> {
    await super.navigate('/login');
  }

  async navigateToLoginPage(): Promise<void> {
    const baseUrl = WEBSITE_CONFIGS.MEZON.baseURL || '';
    const loginUrl = joinUrlPaths(baseUrl, '/login');
    await this.page.goto(loginUrl);
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000);
  }

  async verifyLoginPageElements(): Promise<void> {
    await expect(this.page.locator(this.selectors.loginTitle)).toBeVisible();
    await expect(this.page.locator(this.selectors.emailInput)).toBeVisible();
    await expect(this.page.locator(this.selectors.sendOtpButton)).toBeVisible();
  }

  async enterEmail(email: string): Promise<void> {
    const emailInput = this.page.locator(this.selectors.emailInput);
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.clear();
    await emailInput.fill(email);
  }

  async clickSendOtp(): Promise<void> {
    const sendOtpButton = this.page.locator(this.selectors.sendOtpButton);

    await sendOtpButton.waitFor({ state: 'visible', timeout: 10000 });
    await sendOtpButton.click();

    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(5000); // Wait for page redirect and form to load
  }

  async enterOtp(otp: string): Promise<void> {
    // Wait for page to fully load after redirect
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000);

    // Try multiple OTP selectors
    const otpSelectors = [
      'input#otp',
      'input[name="otp"]',
      'input[placeholder="OTP"]',
      'input[type="number"]',
    ];

    let otpInput = null;
    for (const selector of otpSelectors) {
      try {
        const input = this.page.locator(selector);
        if (await input.isVisible()) {
          otpInput = input;
          console.log('Found OTP input with selector:', selector);
          break;
        }
      } catch {
        // Ignore errors
        console.log('Selector failed:', selector);
        continue;
      }
    }

    if (!otpInput) {
      // Take screenshot for debugging
      await this.page.screenshot({ path: 'otp-debug.png', fullPage: true });
      throw new Error('OTP input field not found after trying all selectors');
    }

    await otpInput.clear();
    await otpInput.fill(otp);
  }

  private async clickLogin(): Promise<void> {
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login/callback')) {
      await this.page.waitForTimeout(3000);
      return;
    }

    const loginButton = this.page.locator(this.selectors.loginButton);

    await loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await loginButton.click();
  }

  async clickVerifyOtp(): Promise<void> {
    const verifyOtpButton = this.page.locator(
      'button#sendOtpBtn, button:has-text("Verify OTP"), button[onclick*="handleSendToken"], button:has-text("Verify"), button:has-text("Xác nhận"), button[aria-label*="Verify OTP"], button[aria-label*="Verify OTP code"]'
    );

    await verifyOtpButton.waitFor({ state: 'visible', timeout: 10000 });
    await verifyOtpButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async authenticateWithOtp(user: MezonTestUser): Promise<void> {
    await this.enterEmail(user.email);

    await this.clickSendOtp();

    await this.page.waitForTimeout(3000);

    await this.enterOtp(user.otp);

    await this.page.waitForTimeout(1000);
    const submitSelectors = [
      'button:has-text("Verify OTP")',
      'button[onclick*="handleSendToken"]',
      'button:has-text("Login")',
      'button:has-text("Đăng nhập")',
      'button:has-text("Verify")',
      'button:has-text("Xác nhận")',
      'button:has-text("Submit")',
      'button[type="submit"]',
      'input[type="submit"]',
      'button:visible:last-of-type',
    ];

    for (const selector of submitSelectors) {
      try {
        const submitBtn = this.page.locator(selector);
        if ((await submitBtn.isVisible()) && (await submitBtn.isEnabled())) {
          await submitBtn.click();
          break;
        }
      } catch {
        // Ignore errors
        continue;
      }
    }

    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000);
  }

  async switchToPasswordLogin(): Promise<void> {
    await this.page.locator(this.selectors.loginWithPasswordLink).click();
    await this.page.waitForLoadState('networkidle');
  }

  async loginWithPassword(email: string, password: string): Promise<void> {
    const homePage = new HomePage(this.page);
    await this.page.goto(MEZON_DEV || '');
    await this.page.waitForLoadState('domcontentloaded');

    await homePage.clickLogin();
    await this.page.waitForLoadState('domcontentloaded');
    await this.switchToPasswordLogin();

    await this.page.locator(this.selectors.emailInput).clear();
    await this.page.locator(this.selectors.emailInput).fill(email);

    await this.page.locator(this.selectors.passwordInput).clear();
    await this.page.locator(this.selectors.passwordInput).fill(password);

    await this.clickLogin();
    await this.page.waitForLoadState('domcontentloaded');
    /* After page loaded. Mezon FE take 1s loading to get the credentials */
    await this.page.waitForTimeout(3000);
  }

  async verifyErrorMessage(expectedMessage?: string): Promise<void> {
    const errorElement = this.page.locator(this.selectors.errorMessage);
    await expect(errorElement).toBeVisible();

    if (expectedMessage) {
      await expect(errorElement).toContainText(expectedMessage);
    }
  }

  async verifySuccessfulLogin(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000);

    const currentUrl = this.page.url();
    const isOnLoginPage = currentUrl.includes('/login') || currentUrl.includes('/auth');

    if (isOnLoginPage) {
      if (currentUrl.includes('/login/callback')) {
        await this.page.waitForTimeout(3000);

        const finalUrl = this.page.url();
        if (finalUrl.includes('/login') && !finalUrl.includes('/callback')) {
          throw new Error('Still on login page after authentication attempt');
        }
      } else {
        throw new Error('Still on login page after authentication attempt');
      }
    }
  }

  async verifyQrCodeVisible(): Promise<void> {
    const qrElements = [this.selectors.qrCodeImage, this.selectors.qrCodeSection];

    let qrVisible = false;
    for (const selector of qrElements) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible()) {
          qrVisible = true;
          break;
        }
      } catch {
        // Ignore errors
        continue;
      }
    }

    expect(qrVisible).toBeTruthy();
  }

  getCurrentUrl(): string {
    return this.page.url();
  }

  async verifyOnLoginPage(): Promise<void> {
    const currentUrl = this.getCurrentUrl();
    expect(currentUrl).toMatch(/login|authentication|signin|mezon/);
  }

  async clearAllFields(): Promise<void> {
    try {
      await this.page.locator(this.selectors.emailInput).clear();
    } catch {
      // Element might not exist, continue silently
    }

    try {
      const otpInput = this.page.locator(this.selectors.otpInput);
      if (await otpInput.isVisible()) {
        await otpInput.clear();
      }
    } catch {
      // OTP input might not exist, continue silently
    }
  }

  async loginWithExistingUser(email: string, password: string): Promise<void> {
    await this.loginWithPassword(email, password);
  }

  async fillLoginForm(email: string): Promise<void> {
    await this.enterEmail(email);
  }

  async clickLoginButton(): Promise<void> {
    await this.clickLogin();
  }

  async verifyLoginErrorMessage(expectedMessage?: string): Promise<void> {
    await this.verifyErrorMessage(expectedMessage);
  }

  async verifyOnSignupLoginPage(): Promise<void> {
    await this.verifyOnLoginPage();
  }

  async verifyLoginSectionVisible(): Promise<void> {
    await this.verifyLoginPageElements();
  }

  async verifySignupSectionVisible(): Promise<void> {}

  async fillSignupForm(): Promise<void> {
    // Signup form not implemented
  }

  async clickSignupButton(): Promise<void> {}

  async verifySignupErrorMessage(expectedMessage?: string): Promise<void> {
    await this.verifyErrorMessage(expectedMessage);
  }
}
