import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Cancel Creation Flows for Clan and Category', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account4;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.clanManagement2,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63510' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('Verify that user can cancel clan creation and category creation flows', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64690',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that clicking Cancel in Clan creation and Category creation modals aborts the process without creating any items.

      **Test Steps:**
      1. Open Create Clan modal and choose template
      2. Enter clan name and click Cancel
      3. Verify modal closes and clan is not created
      4. Open Clan Menu Panel and click Create Category
      5. Enter category name and click Cancel
      6. Verify modal closes and category is not created

      **Expected Result:** Both cancellation flows close modals cleanly and leave no unwanted items.
    `);

    await AllureReporter.addLabels({
      tag: ['clan-management', 'create-clan-cancel', 'create-category-cancel'],
    });

    const clanPage = new ClanPage(page);
    const clanMenuPanel = new ClanMenuPanel(page);

    const uniqueClan = generateRandomString(6);
    const clanName = `Cancel-Clan-${uniqueClan}`;

    await AllureReporter.step(`Cancel clan creation modal with name "${clanName}"`, async () => {
      await clanPage.clickCreateClanButton();
      await clanPage.clickCreateMyOwnClan();
      await clanPage.selector.input.clanName.waitFor({ state: 'visible', timeout: 5000 });
      await clanPage.selector.input.clanName.fill(clanName);

      const modal = page.locator(generateE2eSelector('clan_page.modal.create_clan'));
      const closeClanBtn = modal
        .locator('button')
        .filter({ has: page.locator('svg') })
        .first();
      const cancelClanBtn = modal.locator('button', { hasText: 'Cancel' });

      if (await cancelClanBtn.isVisible({ timeout: 1000 })) {
        await cancelClanBtn.click();
      } else if (await closeClanBtn.isVisible({ timeout: 1000 })) {
        await closeClanBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }

      await expect(clanPage.selector.input.clanName).toBeHidden({ timeout: 5000 });
      expect(await clanPage.isClanPresent(clanName)).toBe(false);
    });

    const uniqueCat = generateRandomString(6);
    const categoryName = `Cancel-Cat-${uniqueCat}`;

    await AllureReporter.step(
      `Cancel category creation modal with name "${categoryName}"`,
      async () => {
        await clanMenuPanel.openPanel();
        await clanMenuPanel.buttons.createCategory.click();
        await clanMenuPanel.input.categoryName.waitFor({ state: 'visible', timeout: 5000 });
        await clanMenuPanel.input.categoryName.fill(categoryName);

        await clanMenuPanel.buttons.cancelCreateCategory.click();
        await expect(clanMenuPanel.input.categoryName).toBeHidden({ timeout: 5000 });
        expect(await clanMenuPanel.isCategoryPresent(categoryName)).toBe(false);
      }
    );
  });
});
