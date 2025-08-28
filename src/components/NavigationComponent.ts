import { BaseComponent } from './BaseComponent';
import { expect } from '@playwright/test';

/**
 * Navigation Component
 * Handles navigation elements and user authentication state
 */
export class NavigationComponent extends BaseComponent {
  // Selectors
  private readonly selectors = {
    signupLoginLink: 'a[href="/login"]',
    logoutLink: 'a[href="/logout"]',
    loggedInUser: 'a:has(b)',
    homeLink: 'a[href="/"]',
    contactUsLink: 'a[href="/contact_us"]',
    testCasesLink: 'a[href="/test_cases"]',
    apiTestingLink: 'a[href="/api_list"]',
    videoTutorialsLink: 'a[href="/video_tutorials"]',
    cartLink: 'a[href="/view_cart"]',
    productsLink: 'a[href="/products"]',
  };

  /**
   * Click on Signup/Login link
   */
  async clickSignupLogin(): Promise<void> {
    await this.clickElement(this.selectors.signupLoginLink);
  }

  /**
   * Click on Logout link
   */
  async clickLogout(): Promise<void> {
    await this.clickElement(this.selectors.logoutLink);
  }

  /**
   * Click on Home link
   */
  async clickHome(): Promise<void> {
    await this.clickElement(this.selectors.homeLink);
  }

  /**
   * Click on Products link
   */
  async clickProducts(): Promise<void> {
    await this.clickElement(this.selectors.productsLink);
  }

  /**
   * Click on Cart link
   */
  async clickCart(): Promise<void> {
    await this.clickElement(this.selectors.cartLink);
  }

  /**
   * Click on Contact Us link
   */
  async clickContactUs(): Promise<void> {
    await this.clickElement(this.selectors.contactUsLink);
  }

  /**
   * Check if user is logged in
   */
  async isUserLoggedIn(): Promise<boolean> {
    return await this.isVisible(this.selectors.loggedInUser);
  }

  /**
   * Check if Signup/Login link is visible (user not logged in)
   */
  async isSignupLoginVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.signupLoginLink);
  }

  /**
   * Get logged in username
   */
  async getLoggedInUsername(): Promise<string> {
    if (await this.isUserLoggedIn()) {
      const userText = await this.getElementText(this.selectors.loggedInUser);
      // Extract username from "Logged in as {username}"
      const match = userText.match(/Logged in as (.+)/);
      return match ? match[1].trim() : userText;
    }
    throw new Error('User is not logged in');
  }

  /**
   * Verify user is logged in with specific username
   */
  async verifyLoggedInAsUser(expectedUsername: string): Promise<void> {
    await this.waitForVisible(this.selectors.loggedInUser);
    const actualUsername = await this.getLoggedInUsername();
    expect(actualUsername).toBe(expectedUsername);
  }

  /**
   * Verify user is not logged in
   */
  async verifyUserNotLoggedIn(): Promise<void> {
    await this.waitForVisible(this.selectors.signupLoginLink);
    await expect(this.getLocator(this.selectors.loggedInUser)).not.toBeVisible();
  }

  /**
   * Navigate to different sections
   */
  async navigateToSection(section: keyof typeof this.selectors): Promise<void> {
    const selector = this.selectors[section];
    if (!selector) {
      throw new Error(`Unknown navigation section: ${section}`);
    }
    await this.clickElement(selector);
  }

  /**
   * Get current navigation state
   */
  async getNavigationState(): Promise<{
    isLoggedIn: boolean;
    username?: string;
    availableLinks: string[];
  }> {
    const isLoggedIn = await this.isUserLoggedIn();
    const username = isLoggedIn ? await this.getLoggedInUsername() : undefined;

    const availableLinks: string[] = [];
    for (const [key, selector] of Object.entries(this.selectors)) {
      if (await this.isVisible(selector)) {
        availableLinks.push(key);
      }
    }

    return {
      isLoggedIn,
      username,
      availableLinks,
    };
  }
}
