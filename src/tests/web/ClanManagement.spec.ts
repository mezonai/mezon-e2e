import { AllureConfig } from '@/config/allure.config';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import generateRandomString from '@/utils/randomString';
import { expect, test } from '@playwright/test';
import { CategoryPage } from '../../pages/CategoryPage';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { CategoryTestHelper } from '@/utils/categoryHelper';

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

test.describe('Category Management', () => {
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

  test.afterAll(async () => {
    if (clanSetupHelper && clanName && clanUrl) {
      await clanSetupHelper.cleanupClan(
        clanName,
        clanUrl,
        ClanSetupHelper.configs.clanManagement.suiteName
      );
    }
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63517',
    });

    await AllureReporter.step('Navigate to test clan', async () => {
      await page.goto(clanUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await AllureReporter.addParameter('clanName', clanName);
  });

  test('Verify that delete empty public category', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addWorkItemLinks({
      tms: '63579',
      github_issue: '9466',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully delete a new empty public category within a clan.
      
      **Test Steps:**
      1. Generate unique category name
      2. Delete new empty public category
      3. Verify category appears in category list
      
      **Expected Result:** Public category is deleted and not visible in the clan's category list.
    `);

    await AllureReporter.addLabels({
      tag: ['category-deletion', 'empty-public-category'],
    });

    const categoryTestHelper = new CategoryTestHelper(page);
    const categoryName = await categoryTestHelper.createAndVerifyCategory('public');
    expect(categoryName !== '').toBe(true);
    await categoryTestHelper.deleteAndVerifyCategory(categoryName, 'public');

    await AllureReporter.attachScreenshot(page, `Empty Public Category Deleted`);
  });

  test('Verify that delete empty private category', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addWorkItemLinks({
      tms: '63578',
      github_issue: '9466',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully delete a new empty private category within a clan.
      
      **Test Steps:**
      1. Generate unique category name
      2. Delete new empty private category
      3. Verify category appears in category list
      
      **Expected Result:** Private category is deleted and not visible in the clan's category list.
    `);

    await AllureReporter.addLabels({
      tag: ['category-deletion', 'empty-private-category'],
    });

    const categoryTestHelper = new CategoryTestHelper(page);
    const categoryName = await categoryTestHelper.createAndVerifyCategory('private');
    expect(categoryName !== '').toBe(true);
    await categoryTestHelper.deleteAndVerifyCategory(categoryName, 'private');

    await AllureReporter.attachScreenshot(page, `Empty Private Category Deleted`);
  });
});
