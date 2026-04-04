import { ROUTES } from '@/selectors';
import { generateE2eSelector, generateHrefSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class HomePageSelector {
  constructor(private readonly page: Page) {
    this.page = page;
  }

  readonly container = {
    main: this.page.locator(generateE2eSelector('homepage.main_page.container')),
    header: this.page.locator(generateE2eSelector('homepage.header.container.navigation')),
  };
  readonly buttons = {
    login: this.page.locator(generateE2eSelector('homepage.header.button.login')),
    menu: this.page.locator(generateE2eSelector('homepage.header.button.menu')),
  };
  readonly links = {
    home: this.page.locator(
      `${generateE2eSelector('homepage.header.link')} ${generateHrefSelector(ROUTES.HOME)}`
    ),
    features: this.page.locator(
      `${generateE2eSelector('homepage.header.link')} ${generateHrefSelector(ROUTES.FEATURES)}`
    ),
    developers: this.page.locator(
      `${generateE2eSelector('homepage.header.link')} ${generateHrefSelector(ROUTES.DEVELOPERS)}`
    ),
  };
  readonly text = {
    copyright: this.page.locator(generateE2eSelector('homepage.footer.text.copyright')),
    features: this.page.locator(generateE2eSelector('homepage.layout.title.features')),
    title: this.page.locator(generateE2eSelector('homepage.main_page.heading.title')),
  };
}
