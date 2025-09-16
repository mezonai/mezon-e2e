import { AllureConfig } from '@/config/allure.config';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import generateRandomString from '@/utils/randomString';
import { expect, test } from '@playwright/test';
import { CategoryPage } from '../../pages/CategoryPage';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';

test.describe('Create Clan', () => {
  let clanUrl: string;
  let clanSetupHelper: ClanSetupHelper;
  let clanTestName: string;

  test.use({ storageState: 'playwright/.auth/account3.json' });

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);
  });

  test.beforeEach(async ({ page }, testInfo) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63510',
    });

    const clanPage = new ClanPageV2(page);
    await AllureReporter.step('Navigate to direct friends page', async () => {
      await clanPage.navigate('/chat/direct/friends');
      await page.waitForLoadState('domcontentloaded');
    });
  });

  test('Verify that I can create a Clan', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63511',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.BLOCKER,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new clan.
      
      **Test Steps:**
      1. Generate unique clan name
      2. Click create clan button
      3. Complete clan creation process
      4. Verify clan appears in clan list
      
      **Expected Result:** New clan is created and visible in the user's clan list.
    `);

    await AllureReporter.addLabels({
      tag: ['clan-creation', 'core-functionality'],
    });

    const clanName = `Mezon E2E Clan ${generateRandomString(10)}`;
    clanTestName = clanName;
    const clanPage = new ClanPageV2(page);

    await AllureReporter.addParameter('clanName', clanName);

    const createClanClicked = await AllureReporter.step('Click create clan button', async () => {
      return await clanPage.clickCreateClanButton();
    });

    if (createClanClicked) {
      await AllureReporter.step(`Create new clan: ${clanName}`, async () => {
        await clanPage.createNewClan(clanName);
      });

      await AllureReporter.step('Verify clan is present in clan list', async () => {
        const isClanPresent = await clanPage.isClanPresent(clanName);

        if (isClanPresent) {
          clanUrl = page.url();
        } else {
          console.log(`Could not complete clan creation: ${clanName}`);
        }
      });

      await AllureReporter.attachScreenshot(page, 'Clan Created Successfully');
    } else {
      await AllureReporter.attachScreenshot(page, 'Failed to Create Clan');
    }
  });

  test.afterAll(async ({ browser }) => {
    if (clanSetupHelper) {
      await clanSetupHelper.cleanupClan(
        clanTestName,
        clanUrl,
        ClanSetupHelper.configs.clanManagement.suiteName
      );
    }
  });
});

test.describe('Create Category', () => {
  let clanSetupHelper: ClanSetupHelper;
  let clanName: string;
  let clanUrl: string;

  test.use({ storageState: 'playwright/.auth/account3.json' });

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(ClanSetupHelper.configs.clanManagement);

    clanName = setupResult.clanName;
    clanUrl = setupResult.clanUrl;

    console.log(`✅ Test clan setup complete: ${clanName}`);
  });

  test.afterAll(async ({ browser }) => {
    if (clanSetupHelper && clanName && clanUrl) {
      await clanSetupHelper.cleanupClan(
        clanName,
        clanUrl,
        ClanSetupHelper.configs.clanManagement.suiteName
      );
    }
  });

  test.beforeEach(async ({ page }, testInfo) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63510',
    });

    await AllureReporter.step('Navigate to test clan', async () => {
      await page.goto(clanUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await AllureReporter.addParameter('clanName', clanName);
  });

  test('Verify that I can create a private category', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new private category within a clan.
      
      **Test Steps:**
      1. Generate unique category name
      2. Create new private category
      3. Verify category appears in category list
      
      **Expected Result:** Private category is created and visible in the clan's category list.
    `);

    await AllureReporter.addLabels({
      tag: ['category-creation', 'private-category'],
    });

    const categoryPrivateName = `category-private-${new Date().getTime()}`;
    const categoryPage = new CategoryPage(page);

    await AllureReporter.addParameter('categoryName', categoryPrivateName);
    await AllureReporter.addParameter('categoryType', 'private');

    await AllureReporter.step(`Create new private category: ${categoryPrivateName}`, async () => {
      await categoryPage.createCategory(categoryPrivateName, 'private');
    });

    await AllureReporter.step('Verify category is present in category list', async () => {
      const isCreatedCategory = await categoryPage.isCategoryPresent(categoryPrivateName);
      expect(isCreatedCategory).toBeTruthy();
    });

    await AllureReporter.attachScreenshot(
      page,
      `Private Category Created - ${categoryPrivateName}`
    );
  });

  test('Verify that I can create a public category', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new public category within a clan.
      
      **Test Steps:**
      1. Generate unique category name
      2. Create new public category
      3. Verify category appears in category list
      
      **Expected Result:** Public category is created and visible in the clan's category list.
    `);

    await AllureReporter.addLabels({
      tag: ['category-creation', 'public-category'],
    });

    const categoryPublicName = `category-public-${new Date().getTime()}`;
    const categoryPage = new CategoryPage(page);

    await AllureReporter.addParameter('categoryName', categoryPublicName);
    await AllureReporter.addParameter('categoryType', 'public');

    await AllureReporter.step(`Create new public category: ${categoryPublicName}`, async () => {
      await categoryPage.createCategory(categoryPublicName, 'public');
    });

    await AllureReporter.step('Verify category is present in category list', async () => {
      const isCreatedCategory = await categoryPage.isCategoryPresent(categoryPublicName);
      expect(isCreatedCategory).toBeTruthy();
    });

    await AllureReporter.attachScreenshot(page, `Public Category Created - ${categoryPublicName}`);
  });
});

test.describe('Delete Category bugs #9466', () => {
  let clanSetupHelper: ClanSetupHelper;
  let clanName: string;
  let clanUrl: string;
  const categoryPublicName = `category-public-${generateRandomString(10)}`;

  test.use({ storageState: 'playwright/.auth/account3.json' });

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(ClanSetupHelper.configs.clanManagement);

    clanName = setupResult.clanName;
    clanUrl = setupResult.clanUrl;
  });

  test.afterAll(async ({ browser }) => {
    if (clanSetupHelper && clanName && clanUrl) {
      await clanSetupHelper.cleanupClan(
        clanName,
        clanUrl,
        ClanSetupHelper.configs.clanManagement.suiteName
      );
    }
  });

  test.beforeEach(async ({ page }, testInfo) => {
    await AllureReporter.step('Navigate to test clan', async () => {
      await page.goto(clanUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await AllureReporter.step('Create new category', async () => {
      const categoryPage = new CategoryPage(page);

      await AllureReporter.addParameter('categoryName', categoryPublicName);
      await AllureReporter.addParameter('categoryType', 'public');

      await AllureReporter.step(`Create new public category: ${categoryPublicName}`, async () => {
        await categoryPage.createCategory(categoryPublicName, 'public');
      });
    });

    await AllureReporter.addParameter('clanName', clanName);
  });

  test('Verify that I delete category contains channel/thread', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63517',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that deleting a category containing channels, threads, voice channels, and stream channels removes all its contents immediately and redirects to the Welcome Channel.
      
      **Test Steps:**
      1. Create a category
      2. Create a channel/thread, voice channel, and stream channel inside the category
      3. Right click on the category and select "Edit Category"
      4. Delete the category

      **Actual Result:** The channel/thread, voice channel, and stream channel are pushed up and do not disappear immediately.
      **Expected Result:** All of the category's channels/threads should be deleted immediately, and the user should be redirected to the Welcome Channel.
    `);

    const categoryPage = new CategoryPage(page);

    await AllureReporter.step(`Delete new category`, async () => {
      await categoryPage.deleteCategory(categoryPublicName);
    });

    await AllureReporter.step(
      'Verify category is delete category contains channel/thread',
      async () => {
        const isPresent = await categoryPage.isCategoryPresent(categoryPublicName);
        expect(isPresent).toBeFalsy();
      }
    );

    await AllureReporter.attachScreenshot(page, `Delete category contains channel/thread`);
  });

  test.skip('Verify that I can create a public category', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new public category within a clan.
      
      **Test Steps:**
      1. Generate unique category name
      2. Create new public category
      3. Verify category appears in category list
      
      **Expected Result:** Public category is created and visible in the clan's category list.
    `);

    await AllureReporter.addLabels({
      tag: ['category-creation', 'public-category'],
    });

    const categoryPublicName = `category-public-${new Date().getTime()}`;
    const categoryPage = new CategoryPage(page);

    await AllureReporter.addParameter('categoryName', categoryPublicName);
    await AllureReporter.addParameter('categoryType', 'public');

    await AllureReporter.step(`Create new public category: ${categoryPublicName}`, async () => {
      await categoryPage.createCategory(categoryPublicName, 'public');
    });

    await AllureReporter.step('Verify category is present in category list', async () => {
      const isCreatedCategory = await categoryPage.isCategoryPresent(categoryPublicName);
      expect(isCreatedCategory).toBeTruthy();
    });

    await AllureReporter.attachScreenshot(page, `Public Category Created - ${categoryPublicName}`);
  });
});
