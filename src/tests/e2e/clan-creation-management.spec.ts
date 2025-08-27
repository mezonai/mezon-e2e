import { ClanPageV2 } from '@/pages/ClanPageV2';
import { expect, test } from '@playwright/test';
import { CategoryPage } from '../../pages/CategoryPage';

test.describe('Create Clan', () => {
  const clanName = `Test Clan ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    const clanPage = new ClanPageV2(page);
    await clanPage.navigate('/chat/direct/friends');
    await page.waitForTimeout(2000);
  });

  test('Verify that I can create a Clan', async ({ page }) => {
    const clanPage = new ClanPageV2(page);
    const createClanClicked = await clanPage.clickCreateClanButton();
    
    if (createClanClicked) {
      console.log('Successfully double clicked create clan button');

      await clanPage.createNewClan(clanName);

      const isClanPresent = await clanPage.isClanPresent(clanName);

      if (isClanPresent) {
        console.log(`Successfully created clan: ${clanName}`);
      } else {
        console.log(`Could not complete clan creation: ${clanName}`);
      }

      await page.screenshot({ path: 'debug-after-clan-creation.png', fullPage: true });
    } else {
      console.log('Failed to find or click create clan button');
      await page.screenshot({ path: 'debug-create-clan-failed.png', fullPage: true });
    }
  });
});

test.describe('Create Category', () => {
  const clanName = `Test Clan ${Date.now()}`;
  const categoryPrivateName = `category-private-${new Date().getTime()}`;
  const textCategoryPublic = `category-public-${new Date().getTime()}`;

  test.beforeEach(async ({ page }) => {
    const clanPage = new ClanPageV2(page);
    await clanPage.navigate('/chat/direct/friends');
    await page.waitForTimeout(2000);

    const createClanClicked = await clanPage.clickCreateClanButton();
    if (createClanClicked) {
      console.log('Successfully double clicked create clan button');


      await clanPage.createNewClan(clanName);

      const isClanPresent = await clanPage.isClanPresent(clanName);

      await page.screenshot({ path: 'debug-after-clan-creation.png', fullPage: true });
      if (isClanPresent) {
        console.log(`Successfully created clan: ${clanName}`);
      } else {
        console.log(`Could not complete clan creation: ${clanName}`);
      }
    } else {
      console.log('Failed to find or click create clan button');
      await page.screenshot({ path: 'debug-create-clan-failed.png', fullPage: true });
    }
  });

  // test('Verify that I can create a private category', async ({ page }) => {
  //   const categoryPage = new CategoryPage(page);

  //   await categoryPage.createCategory(categoryPrivateName, 'private');
  //   const isCreatedCategory = await categoryPage.isCategoryPresent(categoryPrivateName);

  //   expect(isCreatedCategory).toBeTruthy();
  // });

  // test('Verify that I can create a public category', async ({ page }) => {
  //   const categoryPage = new CategoryPage(page);

  //   await categoryPage.createCategory(textCategoryPublic, 'public');
  //   const isCreatedCategory = await categoryPage.isCategoryPresent(categoryPrivateName);

  //   expect(isCreatedCategory).toBeTruthy();
  // });
});
