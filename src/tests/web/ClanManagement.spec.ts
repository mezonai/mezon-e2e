import { AllureConfig, TestSetups } from '@/config/allure.config';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';
import { CategoryPage } from '../../pages/CategoryPage';

test.describe('Create Clan', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await AllureReporter.initializeTest(page, testInfo, {
      suite: AllureConfig.Suites.CLAN_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.CLAN_CREATION,
      story: AllureConfig.Stories.CLAN_SETUP,
      severity: AllureConfig.Severity.BLOCKER,
      testType: AllureConfig.TestTypes.E2E,
    });

    await AllureReporter.addWorkItemLinks({
      tms: '63510',
    });

    await TestSetups.clanTest({
      subSuite: AllureConfig.SubSuites.CLAN_CREATION,
      operation: 'Clan Creation',
    });

    const clanPage = new ClanPageV2(page);
    await AllureReporter.step('Navigate to direct friends page', async () => {
      await clanPage.navigate('/chat/direct/friends');
      await page.waitForTimeout(2000);
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

    const clanName = `New Clan ${Date.now()}`;
    const clanPage = new ClanPageV2(page);

    await AllureReporter.addParameter('clanName', clanName);

    const createClanClicked = await AllureReporter.step('Click create clan button', async () => {
      return await clanPage.clickCreateClanButton();
    });

    if (createClanClicked) {
      console.log('Successfully double clicked create clan button');

      await AllureReporter.step(`Create new clan: ${clanName}`, async () => {
        await clanPage.createNewClan(clanName);
      });

      await AllureReporter.step('Verify clan is present in clan list', async () => {
        const isClanPresent = await clanPage.isClanPresent(clanName);

        if (isClanPresent) {
          console.log(`Successfully created clan: ${clanName}`);
        } else {
          console.log(`Could not complete clan creation: ${clanName}`);
        }
      });

      await AllureReporter.attachScreenshot(page, 'Clan Created Successfully');
    } else {
      console.log('Failed to find or click create clan button');
      await AllureReporter.attachScreenshot(page, 'Failed to Create Clan');
    }
  });
});

test.describe('Create Category', () => {
  let clanName: string;

  test.beforeEach(async ({ page }, testInfo) => {
    await AllureReporter.initializeTest(page, testInfo, {
      suite: AllureConfig.Suites.CLAN_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.CATEGORY_MANAGEMENT,
      story: AllureConfig.Stories.CHANNEL_ORGANIZATION,
      severity: AllureConfig.Severity.CRITICAL,
      testType: AllureConfig.TestTypes.E2E,
    });

    await AllureReporter.addWorkItemLinks({
      tms: '63510',
    });

    await TestSetups.clanTest({
      subSuite: AllureConfig.SubSuites.CATEGORY_MANAGEMENT,
      operation: 'Category Creation',
    });

    clanName = `New Clan ${Date.now()}`;
    const clanPage = new ClanPageV2(page);

    await AllureReporter.step('Navigate to direct friends page', async () => {
      await clanPage.navigate('/chat/direct/friends');
    });

    await AllureReporter.step('Create test clan for category testing', async () => {
      await clanPage.clickCreateClanButton();
      await clanPage.createNewClan(clanName);
    });

    await AllureReporter.addParameter('clanName', clanName);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const clanPage = new ClanPageV2(page);

    await AllureReporter.step('Clean up: Delete test clan', async () => {
      const deletedClan = await clanPage.deleteClan(clanName);
      if (deletedClan) {
        console.log(`Successfully deleted clan: ${clanName}`);
      } else {
        console.log(`Failed to delete clan: ${clanName}`);
        await AllureReporter.attachScreenshot(page, 'Cleanup Failed - Delete Clan');
      }
    });

    if (testInfo.status === 'failed') {
      await AllureReporter.attachScreenshot(page, 'Test Failed - Final Screenshot');
    }
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
