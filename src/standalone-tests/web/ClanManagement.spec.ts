import { AllureConfig } from '@/config/allure.config';
import { GLOBAL_CONFIG } from '@/config/environment';
import { ClanPage } from '@/pages/ClanPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import joinUrlPaths from '@/utils/joinUrlPaths';
import generateRandomString from '@/utils/randomString';
import { expect, test } from '@playwright/test';

test.describe('Create Clan', () => {
  test.use({ storageState: 'playwright/.auth/account8.json' });
  test.beforeEach(async ({ page }) => {
    await AllureReporter.step('Navigate to direct friends page', async () => {
      await page.goto(joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS));
      await page.waitForLoadState('domcontentloaded');
    });
  });

  test('Verify that show limit modal when create more than 50 clans', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.BLOCKER,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that show limit modal when create more than 50 clans.
      
      **Test Steps:**
      1. Create more than 50 clans
      2. Verify that show limit modal
      
      **Expected Result:** Show limit modal when create more than 50 clans.
    `);

    await AllureReporter.addLabels({
      tag: ['clan-creation', 'core-functionality', 'limit-modal'],
    });

    const clanPage = new ClanPage(page);
    let createClansCount: number;
    const limit = 50;
    const createdClans: string[] = [];
    const results: boolean[] = [];

    await AllureReporter.addParameter('Limit clans', limit.toString());

    await AllureReporter.step('Get all clans', async () => {
      await page.waitForLoadState('networkidle');
      const allClansCount = await clanPage.getAllClan();
      createClansCount = limit - allClansCount;
      await AllureReporter.addParameter('Clans present', allClansCount.toString());
      await AllureReporter.addParameter('Clans to create', createClansCount.toString());
    });

    await AllureReporter.step('Create 50 clans', async () => {
      for (let i = 0; i < createClansCount; i++) {
        const clanName = `Mezon E2E Clan ${createClansCount - i} ${generateRandomString(10)}`;

        const createClanClicked = await clanPage.clickCreateClanButton();
        if (createClanClicked) {
          await clanPage.createNewClan(clanName);
        }
        const isClanPresent = await clanPage.isClanPresent(clanName);
        if (isClanPresent) {
          createdClans.push(clanName);
        }
        results.push(isClanPresent);
      }
    });

    const allClansCreated = results.every(result => result === true);
    if (!allClansCreated) {
      await page.waitForLoadState('networkidle');
      const allClansCount = await clanPage.getAllClan();
      expect(allClansCount).toBe(limit);
      await AllureReporter.attachScreenshot(page, 'Failed to Create 50 Clans');
    } else {
      await AllureReporter.step('Verify that show limit modal when create clan 51', async () => {
        const clanName = `Mezon E2E Clan LIMIT ${generateRandomString(10)}`;
        const createClanClicked = await clanPage.clickCreateClanButton();
        if (createClanClicked) {
          await clanPage.createNewClan(clanName);
        }
        const isClanPresent = await clanPage.isClanPresent(clanName);
        expect(isClanPresent).toBe(false);
        const isLimitCreationModalPresent = await clanPage.isLimitCreationModalPresent();
        expect(isLimitCreationModalPresent).toBe(true);
      });
    }
  });
});
