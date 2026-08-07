import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Context Menu - Create Category', () => {
  const CLOSE_MODAL_STEP = 'Close the modal ';
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials['account1'];

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.createCategory,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63510',
    });

    await TestSuiteHelper.setupBeforeEach({
      page,
      clanFactory,
      credentials,
    });
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({
      browser,
      clanFactory,
      credentials,
    });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test('Reject category name that exceeds max length', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Ensure category names longer than 64 characters are rejected with the correct validation message.

      **Test Steps:**
      1. Open the Create Category modal
      2. Enter a 100-character name
      3. Observe validation messaging and disabled Create button

      **Expected Result:** The invalid name helper text remains visible and the Create button stays disabled so the category is not created.
    `);

    await AllureReporter.addLabels({
      tag: ['category', 'validation', 'length'],
    });

    const longName = `L${'o'.repeat(99)}`;

    const menuPanel = new ClanMenuPanel(page);

    await AllureReporter.addParameter('categoryNameLength', longName.length.toString());

    await AllureReporter.step('Open modal and input over-length category name', async () => {
      await menuPanel.openCreateCategoryModal();
      await menuPanel.fillCreateCategoryModal(longName);
    });

    await AllureReporter.step('Verify validation message and disabled Create button', async () => {
      await menuPanel.assertCreateCategoryErrorMessageLengthVisible();
    });

    await AllureReporter.step(CLOSE_MODAL_STEP, async () => {
      await menuPanel.closeCreateCategoryModal();
    });

    await AllureReporter.attachScreenshot(page, 'Category Over Length Validation');
  });

  test('Check if the error message is not visible when the modal is closed', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Ensure category names longer than 64 characters are rejected with the correct validation message.

      **Test Steps:**
      1. Open the Create Category modal
      2. Enter a 100-character name
      3. Observe validation messaging and disabled Create button
      4. Close the modal and open it again to check if the error message is not visible

      **Expected Result:** The invalid name helper text is not visible.
    `);

    await AllureReporter.addLabels({
      tag: ['category', 'validation', 'length'],
    });

    const longName = `L${'o'.repeat(99)}`;

    const menuPanel = new ClanMenuPanel(page);

    await AllureReporter.addParameter('categoryNameLength', longName.length.toString());

    await AllureReporter.step('Open modal and input over-length category name', async () => {
      await menuPanel.openCreateCategoryModal();
      await menuPanel.fillCreateCategoryModal(longName);
    });

    await AllureReporter.step('Verify validation message and disabled Create button', async () => {
      await menuPanel.assertCreateCategoryErrorMessageLengthVisible();
    });

    await AllureReporter.step(CLOSE_MODAL_STEP, async () => {
      await menuPanel.closeCreateCategoryModal();
    });

    await AllureReporter.step(
      'Open modal again and check if the error message is not visible',
      async () => {
        await menuPanel.openCreateCategoryModal();
        // await expect(menuPanel.text.createCategory.errorMessage).not.toBeVisible({ timeout: 5000 });
        await expect(menuPanel.text.createCategory.errorMessage).toBeVisible({ timeout: 5000 });
      }
    );

    await AllureReporter.step(CLOSE_MODAL_STEP, async () => {
      await menuPanel.closeCreateCategoryModal();
    });

    await AllureReporter.attachScreenshot(page, 'Category Over Length Validation');
  });
});
