import HomePageSelector from '@/data/selectors/HomePageSelector';
import { type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  private selector: HomePageSelector;

  constructor(page: Page) {
    super(page);
    this.selector = new HomePageSelector(page);
  }

  async clickLogin(): Promise<void> {
    const loginBtn = this.selector.buttons.login;
    await loginBtn.waitFor({ state: 'visible', timeout: 10000 });
    await loginBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
