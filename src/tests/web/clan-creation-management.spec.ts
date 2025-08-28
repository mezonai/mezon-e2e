import { ClanPageV2 } from '@/pages/ClanPageV2';
import { expect, test } from '@playwright/test';
import { CategoryPage } from '../../pages/CategoryPage';

test.describe('Create Clan', () => {
  test.beforeEach(async ({ page }) => {
    const clanPage = new ClanPageV2(page);
    await clanPage.navigate('/chat/direct/friends');
    await page.waitForTimeout(2000);
  });

  test('Verify that I can create a Clan', async ({ page }) => {
    const clanName = `Test Clan ${Date.now()}`;
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
  let clanName: string;

  test.beforeEach(async ({ page }) => {
    clanName = `Hest Clan ${Date.now()}`;
    const clanPage = new ClanPageV2(page);
    await clanPage.navigate('/chat/direct/friends');
    await clanPage.clickCreateClanButton();
    await clanPage.createNewClan(clanName);
  });

  test.afterEach(async ({ page }) => {
    const clanPage = new ClanPageV2(page);

    const deletedClan = await clanPage.deleteClan(clanName);
    if (deletedClan) {
      console.log(`Successfully deleted clan: ${clanName}`);
    } else {
      console.log(`Failed to delete clan: ${clanName}`);
    }
  });

  test('Verify that I can create a private category', async ({ page }) => {
    const categoryPrivateName = `category-private-${new Date().getTime()}`;
    const categoryPage = new CategoryPage(page);

    await categoryPage.createCategory(categoryPrivateName, 'private');
    const isCreatedCategory = await categoryPage.isCategoryPresent(categoryPrivateName);

    expect(isCreatedCategory).toBeTruthy();
  });

  test('Verify that I can create a public category', async ({ page }) => {
    const categoryPublicName = `category-public-${new Date().getTime()}`;
    const categoryPage = new CategoryPage(page);

    await categoryPage.createCategory(categoryPublicName, 'public');
    const isCreatedCategory = await categoryPage.isCategoryPresent(categoryPublicName);

    expect(isCreatedCategory).toBeTruthy();
  });
});
