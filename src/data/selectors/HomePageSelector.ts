import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class HomePageSelector {
  constructor(private readonly page: Page) {}

  readonly buttons = {
    login: this.page.locator(generateE2eSelector('homepage.header.button.login')),
  };
}
