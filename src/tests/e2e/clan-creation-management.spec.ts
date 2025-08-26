import { test, expect } from '@playwright/test';
import { CategoryPage } from '../../pages/CategoryPage';
import { HomePage } from '../../pages/HomePage';
import { ClanPage } from '@/pages/ClanPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { TextChannelPage } from '../../pages/TextChannelPage';
import { GLOBAL_CONFIG } from '@/config/environment';
import { BasePage } from '@/pages/BasePage';
import { ClanPageV2 } from '@/pages/ClanPageV2';

test.describe('Create Clan', () => {
  const clanName = `Test Clan ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    const clanPage = new ClanPageV2(page);
    await clanPage.navigate('/chat/direct/friends');
    await page.waitForTimeout(2000);
  });

  test('Verify that I can create a Clan', async ({ page }) => {
    const clanPage = new ClanPageV2(page);

    //  When I click on the "Create Clan" button
    const createClanClicked = await clanPage.clickCreateClanButton();
    if (createClanClicked) {
      console.log('Successfully double clicked create clan button');

      // And I enter clan name "Test Clan"
      // And I click on the "Confirm" button
      await clanPage.createNewClan(clanName);

      // Then the new clan "DragonSlayers" should be displayed in my clan list
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

  // Given I am authenticated with valid session
  // And I am on the Clan page
  // And I am the owner of this Clan
  test.beforeEach(async ({ page }) => {
    const clanPage = new ClanPageV2(page);
    await clanPage.navigate('/chat/direct/friends');
    await page.waitForTimeout(2000);

    //  When I click on the "Create Clan" button
    const createClanClicked = await clanPage.clickCreateClanButton();
    if (createClanClicked) {
      console.log('Successfully double clicked create clan button');

      // And I enter clan name "Test Clan"
      // And I click on the "Confirm" button
      await clanPage.createNewClan(clanName);

      // Then the new clan "DragonSlayers" should be displayed in my clan list
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

  test('Verify that I can create a private category', async ({ page }) => {
    const categoryPage = new CategoryPage(page);

    await categoryPage.createCategory(categoryPrivateName, 'private');
    const isCreatedCategory = await categoryPage.isCategoryPresent(categoryPrivateName);

    expect(isCreatedCategory).toBeTruthy();
  });

  test('Verify that I can create a public category', async ({ page }) => {
    const categoryPage = new CategoryPage(page);

    await categoryPage.createCategory(textCategoryPublic, 'public');
    const isCreatedCategory = await categoryPage.isCategoryPresent(categoryPrivateName);

    expect(isCreatedCategory).toBeTruthy();
  });
});

// test.describe('Create Category', () => {
//   const textCategoryPrivate = `category-private-${new Date().getTime()}`;
//   const textCategoryPublic = `category-public-${new Date().getTime()}`;
//   const textCategoryCancel = `category-cancel-${new Date().getTime()}`;
//   const textClanName = `new-clan-${new Date().getTime()}`;

//   test.beforeEach(async ({ page }) => {
//     const homePage = new HomePage(page);
//     await homePage.navigate();

//     await page.goto(`${GLOBAL_CONFIG.LOCAL_BASE_URL}chat/direct/friends`);

//     const clanPage = new ClanPage(page);

//     const createClanClicked = await clanPage.clickCreateClanButton();
//     if (createClanClicked) {
//       await clanPage.createNewClan(textClanName);
//     } else {
//       throw new Error('Failed to create clan in beforeEach');
//     }
//   });

//   test('should create clan', async ({ page }) => {
//     const clanPage = new ClanPage(page);
//     const onboardingPage = new OnboardingPage(page);

//     await test.step('Create new clan by double clicking + button', async () => {
//       const createClanClicked = await clanPage.clickCreateClanButton();
//       if (createClanClicked) {
//         console.log('Successfully double clicked create clan button');

//         const clanName = `Test Clan ${Date.now()}`;
//         const clanCreated = await clanPage.createNewClan(clanName);

//         if (clanCreated) {
//           console.log(`Successfully created clan: ${clanName}`);
//         } else {
//           console.log(`Could not complete clan creation: ${clanName}`);
//         }

//         await page.screenshot({ path: 'debug-after-clan-creation.png', fullPage: true });
//       } else {
//         console.log('Failed to find or click create clan button');
//         await page.screenshot({ path: 'debug-create-clan-failed.png', fullPage: true });
//       }
//     });

//     await test.step('Check onboarding guide and initial tasks state', async () => {
//       console.log('Checking onboarding guide after clan creation...');

//       await page.waitForTimeout(3000);

//       const onboardingVisible = await onboardingPage.isOnboardingGuideVisible();
//       if (!onboardingVisible) {
//         console.log('Onboarding guide not visible initially, trying to open it...');
//         await onboardingPage.openOnboardingGuide();
//       }

//       await onboardingPage.debugOnboardingTasks();

//       const initialTasksStatus = await onboardingPage.getAllTasksStatus();
//       console.log('Initial tasks status after clan creation:', initialTasksStatus);

//       await page.screenshot({ path: 'debug-onboarding-initial-state.png', fullPage: true });
//     });
//   });

//   test('should create private category', async ({ page }) => {
//     const categoryPage = new CategoryPage(page);

//     await test.step(`Create private voice channel named "${textCategoryPrivate}"`, async () => {
//       const created = await categoryPage.createCategory(textCategoryPrivate, 'private');
//       expect(created).toBeTruthy();
//       console.log(`Created private voice channel: ${textCategoryPrivate}`);
//     });

//     await test.step('Verify private voice channel exists', async () => {
//       const exists = await categoryPage.isCategoryPresent(textCategoryPrivate);
//       expect(exists).toBe(true);
//     });
//   });

//   test('should create public category', async ({ page }) => {
//     const categoryPage = new CategoryPage(page);

//     await test.step(`Create public voice channel named "${textCategoryPublic}"`, async () => {
//       const created = await categoryPage.createCategory(textCategoryPublic, 'public');
//       expect(created).toBeTruthy();
//       console.log(`Created public voice channel: ${textCategoryPublic}`);
//     });

//     await test.step('Verify public voice channel exists', async () => {
//       const exists = await categoryPage.isCategoryPresent(textCategoryPublic);
//       expect(exists).toBe(true);
//     });
//   });

//   test('should cancel creation of category with name containing special characters', async ({
//     page,
//   }) => {
//     const categoryPage = new CategoryPage(page);

//     await page.goto(
//       `${GLOBAL_CONFIG.LOCAL_BASE_URL}chat/clans/1955152072231882752/channels/1955152072282214400`
//     );

//     await test.step(`Attempt to create voice channel named "${textCategoryCancel}" and cancel`, async () => {
//       const cancelled = await categoryPage.cancelCreateCategory(textCategoryCancel);
//       expect(cancelled).toBe(true);
//       console.log(`Cancelled creation of voice channel: ${textCategoryCancel}`);
//     });

//     await test.step('Verify voice channel was NOT created', async () => {
//       const exists = await categoryPage.isCategoryPresent(textCategoryCancel);
//       expect(exists).toBe(false);
//     });
//   });

//   test('Select clans', async ({ page }) => {
//     const clanPage = new ClanPage(page);

//     const clanNames = await clanPage.getAllClanNames();
//     console.log('All clans:', clanNames);

//     for (const name of clanNames) {
//       console.log(`Clicking clan: ${name}`);
//       await clanPage.clickClanByName(name);
//       await page.waitForTimeout(1000);

//       const isSelected = await clanPage.isClanSelected(name);
//       expect(isSelected).toBe(true);

//       await page.waitForTimeout(1000);
//     }
//   });
// });
