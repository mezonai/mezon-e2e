import { test, expect } from '@playwright/test';
import { CategoryPage } from '../../pages/CategoryPage';
import { HomePage } from '../../pages/HomePage';
import { ClanPage } from '@/pages/ClanPage';
import { OnboardingPage } from '@/pages/OnboardingPage';

test.describe('Create Category', () => {
  test.beforeEach(async ({ _page }) => {
    const homePage = new HomePage(page);
    await homePage.navigate();

    const currentUrl = page.url();
    if (currentUrl.includes('dev-mezon.nccsoft.vn') && !currentUrl.includes('/chat')) {
      console.log('On landing page, clicking "Open Mezon" button...');

      const openMezonSelectors = [
        'button:has-text("Open Mezon")',
        'a:has-text("Open Mezon")',
        '[data-testid="open-mezon"]',
        '.open-mezon-btn',
        'button[class*="open"]',
        'a[href*="/chat"]',
      ];

      let buttonFound = false;
      for (const selector of openMezonSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.isVisible({ timeout: 3000 })) {
            console.log(`Found "Open Mezon" button using: ${selector}`);
            await button.click();
            buttonFound = true;
            break;
          }
        } catch {
          // Ignore errors
          continue;
        }
      }

      if (!buttonFound) {
        console.log('Button not found, trying direct navigation...');
        await page.goto('/chat');
      }

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      console.log(`After navigation: ${page.url()}`);
    }

    const finalUrl = page.url();
    expect(finalUrl).not.toMatch(/login|signin|authentication/);
  });

  const textCategorylPrivate = 'category-private';
  const textCategoryPublic = 'category-public';
  const textCategoryCancel = 'category-cancel';

  test('should create private category', async ({ _page }) => {
    const categoryPage = new CategoryPage(page);

    await page.goto(
      'https://dev-mezon.nccsoft.vn/chat/clans/1955152072231882752/channels/1955152072282214400'
    );

    await test.step(`Create private voice channel named "${textCategorylPrivate}"`, async () => {
      const created = await categoryPage.createCategory(textCategorylPrivate, 'private');
      expect(created).toBeTruthy();
      console.log(`Created private voice channel: ${textCategorylPrivate}`);
    });

    await test.step('Verify private voice channel exists', async () => {
      const exists = await categoryPage.isCategoryPresent(textCategorylPrivate);
      expect(exists).toBe(true);
    });
  });

  test('should create public category', async ({ _page }) => {
    const categoryPage = new CategoryPage(page);

    await page.goto(
      'https://dev-mezon.nccsoft.vn/chat/clans/1955152072231882752/channels/1955152072282214400'
    );

    await test.step(`Create public voice channel named "${textCategoryPublic}"`, async () => {
      const created = await categoryPage.createCategory(textCategoryPublic, 'public');
      expect(created).toBeTruthy();
      console.log(`Created public voice channel: ${textCategoryPublic}`);
    });

    await test.step('Verify public voice channel exists', async () => {
      const exists = await categoryPage.isCategoryPresent(textCategoryPublic);
      expect(exists).toBe(true);
    });
  });

  test('should cancel creation of category with name containing special characters', async ({
    page,
  }) => {
    const categoryPage = new CategoryPage(page);

    await page.goto(
      'https://dev-mezon.nccsoft.vn/chat/clans/1955152072231882752/channels/1955152072282214400'
    );

    await test.step(`Attempt to create voice channel named "${textCategoryCancel}" and cancel`, async () => {
      const cancelled = await categoryPage.cancelCreateCategory(textCategoryCancel);
      expect(cancelled).toBe(true);
      console.log(`Cancelled creation of voice channel: ${textCategoryCancel}`);
    });

    await test.step('Verify voice channel was NOT created', async () => {
      const exists = await categoryPage.isCategoryPresent(textCategoryCancel);
      expect(exists).toBe(false);
    });
  });

  test('shoud create clan', async ({ _page }) => {
    const clanPage = new ClanPage(page);
    const onboardingPage = new OnboardingPage(page);

    await test.step('Create new clan by double clicking + button', async () => {
      console.log('Starting clan creation process...');

      await page.screenshot({ path: 'debug-before-clan-creation.png', fullPage: true });

      const createClanClicked = await clanPage.clickCreateClanButton();
      if (createClanClicked) {
        console.log('Successfully double clicked create clan button');

        const clanName = `Test Clan ${Date.now()}`;
        const clanCreated = await clanPage.createNewClan(clanName);

        if (clanCreated) {
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

    await test.step('Check onboarding guide and initial tasks state', async () => {
      console.log('Checking onboarding guide after clan creation...');

      await page.waitForTimeout(3000);

      const onboardingVisible = await onboardingPage.isOnboardingGuideVisible();
      if (!onboardingVisible) {
        console.log('Onboarding guide not visible initially, trying to open it...');
        await onboardingPage.openOnboardingGuide();
      }

      await onboardingPage.debugOnboardingTasks();

      const initialTasksStatus = await onboardingPage.getAllTasksStatus();
      console.log('Initial tasks status after clan creation:', initialTasksStatus);

      await page.screenshot({ path: 'debug-onboarding-initial-state.png', fullPage: true });
    });
  });

  test('Select clans', async ({ _page }) => {
    const clanPage = new ClanPage(page);

    const clanNames = await clanPage.getAllClanNames();
    console.log('All clans:', clanNames);

    for (const name of clanNames) {
      console.log(`Clicking clan: ${name}`);
      await clanPage.clickClanByName(name);
      await page.waitForTimeout(1000);

      const isSelected = await clanPage.isClanSelected(name);
      expect(isSelected).toBe(true);

      await page.waitForTimeout(1000);
    }
  });
});
