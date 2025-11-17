import { type Page, expect } from '@playwright/test';
import { WEBSITE_CONFIGS } from '../config/environment';
import { BasePage } from './BasePage';
import HomePageSelector from '@/data/selectors/HomePageSelector';

export class HomePage extends BasePage {
  private selector: HomePageSelector;

  constructor(page: Page) {
    super(page);
    this.selector = new HomePageSelector(page);
  }

  async navigate(): Promise<void> {
    if (!WEBSITE_CONFIGS.MEZON.baseURL) {
      throw new Error('Base URL is not defined');
    }
    const baseUrl = WEBSITE_CONFIGS.MEZON.baseURL;
    await this.page.goto(baseUrl);
    await this.page.waitForLoadState('networkidle');
  }

  async verifyOnHomepage(): Promise<void> {
    const currentUrl = this.page.url();
    const baseUrl = WEBSITE_CONFIGS.MEZON.baseURL;
    expect(currentUrl).toContain(baseUrl);

    await expect(this.selector.container.main).toBeVisible();
  }

  async verifyNavigationMenu(): Promise<void> {
    await expect(this.selector.container.header).toBeVisible();
  }

  async clickLogin(): Promise<void> {
    const loginBtn = this.selector.buttons.login;
    await loginBtn.waitFor({ state: 'visible', timeout: 10000 });
    await loginBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifyLinkExists(linkText: string): Promise<void> {
    const link = this.page.locator(`a:has-text("${linkText}")`);
    await expect(link).toBeVisible();
  }

  async verifyHeroSection(): Promise<void> {
    await expect(this.selector.text.title).toBeVisible();
  }

  async verifyFeaturesSection(): Promise<void> {
    await expect(this.selector.text.features).toBeVisible();
  }

  async verifyFooterSection(): Promise<void> {
    await expect(this.selector.text.copyright).toBeVisible();
  }

  async verifyMobileNavigation(): Promise<void> {
    const mobileToggle = this.selector.buttons.menu;
    const navigation = this.selector.container.header;
    const isMobileToggleVisible = await mobileToggle.isVisible();
    const isNavigationVisible = await navigation.isVisible();

    expect(isMobileToggleVisible || isNavigationVisible).toBeTruthy();
  }

  async verifyResponsiveLayout(): Promise<void> {
    await expect(this.selector.container.main).toBeVisible();
    const viewport = await this.page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(375);
  }

  async verifyCriticalElements(): Promise<void> {
    await expect(this.selector.container.main).toBeVisible();
    await expect(this.selector.container.header).toBeVisible();
    await expect(this.selector.buttons.login).toBeVisible();
  }

  async verifyNoBrokenLinks(): Promise<void> {
    const links = await this.page.locator('a[href]').all();
    let brokenLinksCount = 0;

    for (const link of links.slice(0, 5)) {
      try {
        const href = await link.getAttribute('href');
        if (href && href.startsWith('http')) {
          const response = await this.page.request.get(href);
          if (response.status() >= 400) {
            brokenLinksCount++;
          }
        }
      } catch (error) {
        // Ignore errors
        console.log(`Could not check link: ${error}`);
      }
    }

    expect(brokenLinksCount).toBe(0);
  }

  async isUserLoggedIn(): Promise<boolean> {
    try {
      const loginBtn = this.selector.buttons.login;
      return !(await loginBtn.isVisible());
    } catch {
      return false;
    }
  }

  async verifyLoginButton(): Promise<void> {
    await expect(this.selector.buttons.login).toBeVisible();
  }
}
