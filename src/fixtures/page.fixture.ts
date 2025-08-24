import { Page } from '@playwright/test';
import { test as base, createBdd } from 'playwright-bdd';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';

export type PageObjects = {
  LoginPage: LoginPage;
  HomePage: HomePage;
};

const convertToPageObjects = (page: Page): PageObjects => {
  return {
    LoginPage: new LoginPage(page),
    HomePage: new HomePage(page),
  };
};

export type WorldObject = {
  DataTest: Record<string, string>;
};

export const test = base.extend<{
  PageObjects: PageObjects;
  WorldObject: WorldObject;
}>({
  PageObjects: async ({ page }, use) => {
    const pages: PageObjects = convertToPageObjects(page);
    await use(pages);
  },
  WorldObject: async (_, use) => {
    await use({
      DataTest: {},
    });
  },
});

export { expect } from '@playwright/test';

export const { Given, When, Then } = createBdd(test);
