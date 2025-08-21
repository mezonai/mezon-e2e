
import { test, expect } from '@playwright/test';
import { CategoryPage } from '../../pages/CategoryPage';
import { HomePage } from '../../pages/HomePage';
import { ClanPage } from '@/pages/ClanPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { OnboardingHelpers } from '@/utils/onboardingHelpers';
import { environment } from '@/config/environment';

test.describe('Create Category', () => {
    test.beforeEach(async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();

        const helpers = new OnboardingHelpers(page);
        await helpers.navigateToApp();

        const finalUrl = page.url();
        expect(finalUrl).not.toMatch(environment.authPageRegex);
    });

    const now = new Date();
    const dateTimeString = now.toISOString().replace(/[:.]/g, '-');

    const textCategorylPrivate = `category-private-${dateTimeString}`;
    const textCategoryPublic = `category-public-${dateTimeString}`;
    const textCategoryCancel = `category-cancel-${dateTimeString}`;
    const clanName = `test-clan-${dateTimeString}`;

    test('shoud create a clan', async ({ page }) => {
        const clanPage = new ClanPage(page);
        const clanCount = await clanPage.countClans();

        await test.step('Click button create clan', async () => {
            await page.screenshot({ path: 'debug-before-clan-creation.png', fullPage: true });
            await clanPage.clickCreateClanButton();
        });

        await test.step('Create new clan', async () => {
            await clanPage.createNewClan(clanName);
            await page.screenshot({ path: 'debug-after-clan-creation.png', fullPage: true });
        });

        await test.step('Verify clan is created', async () => {
            await page.waitForTimeout(3000);
            const isClanCreated = await clanPage.isNewClanCreated(clanCount);
            expect(isClanCreated).toBeTruthy();
        });
    });

    test('shoud select a clan', async ({ page }) => {
        const clanPage = new ClanPage(page);

        await test.step('Select a clan', async () => {
            await clanPage.selectClan();
            await page.waitForTimeout(3000);
        });

        await test.step('Verify clan is selected', async () => {
            const isClanSelected = await clanPage.isClanSelected();
            expect(isClanSelected).toBeTruthy();
        });
    });

    test('should create private category', async ({ page }) => {
        const categoryPage = new CategoryPage(page);

        await test.step(`Show all categories`, async () => {
            await categoryPage.showCategory();
            await page.waitForTimeout(3000); 
        });

        const prevCategoryCount = await categoryPage.countCategories();

        await test.step(`Create private category`, async () => {
            await categoryPage.createCategory(textCategorylPrivate, 'private');
            await page.waitForTimeout(3000); 
        });

        await test.step('Verify private category exists', async () => {
            const exists = await categoryPage.isCategoryPresent(textCategorylPrivate,prevCategoryCount);
            expect(exists).toBe(true);
        });
    });

    test('should create public category', async ({ page }) => {
        const categoryPage = new CategoryPage(page);

        await test.step(`Show all categories`, async () => {
            await categoryPage.showCategory();
            await page.waitForTimeout(3000); 
        });

        const prevCategoryCount = await categoryPage.countCategories();

        await test.step(`Create public category`, async () => {
            await categoryPage.createCategory(textCategoryPublic, 'public');
            await page.waitForTimeout(3000); 
        });

        await test.step('Verify public category exists', async () => {
            const exists = await categoryPage.isCategoryPresent(textCategoryPublic,prevCategoryCount);
            expect(exists).toBe(true);
        });
    });

    test('should cancel creation of category with name containing special characters', async ({ page }) => {
        const categoryPage = new CategoryPage(page);

        await test.step(`Show all categories`, async () => {
            await categoryPage.showCategory();
            await page.waitForTimeout(3000);
        });

        const prevCategoryCount = await categoryPage.countCategories();

        await test.step(`Attempt to create voice channel named "${textCategoryCancel}" and cancel`, async () => {
            const cancelled = await categoryPage.cancelCreateCategory(textCategoryCancel);
            expect(cancelled).toBe(true);
            console.log(`Cancelled creation of voice channel: ${textCategoryCancel}`);
        });

        await test.step('Verify voice channel was NOT created', async () => {
            const exists = await categoryPage.isCategoryPresent(textCategoryCancel, prevCategoryCount);
            expect(exists).toBe(false);
        });
    });
});



