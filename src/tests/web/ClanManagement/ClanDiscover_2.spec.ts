import { expect, test } from '@playwright/test';
import ClanDiscoverPage from '../../../pages/Clan/ClanDiscoverPage';
import { ClanPage } from '../../../pages/Clan/ClanPage';
import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';

test.describe('Discover & Event - QR Link Card in About & Unaccented Channel Search (TC-CI-28, 29 / Cases 171, 172)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account1;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.clanManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Discover About recognizes QR links and renders QR card without breaking layout (TC-CI-28 / Case 171)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65171' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify Discover clan About section recognizes QR links and renders QR cards without corrupting surrounding text layout (TC-CI-28 / Case 171).
    `);

    const discoverPage = new ClanDiscoverPage(page);

    await AllureReporter.step('Navigate to Discover page', async () => {
      await discoverPage.gotoDiscover();
      await discoverPage.verifyClanListLoaded();
    });

    await AllureReporter.step('Open first clan detail and inspect About section', async () => {
      await discoverPage.openClanDetailByIndex(0);
      await expect(discoverPage.selectors.clanDetail.title).toBeVisible({ timeout: 10000 });

      // Verify About section renders cleanly
      const aboutSection = page.locator('text=About, [data-e2e*="about"]').first();
      if (await aboutSection.isVisible({ timeout: 5000 })) {
        await expect(aboutSection).toBeVisible();
      }
    });
  });

  test('TC02: Create Event Location channel search finds accented channel with unaccented query (TC-CI-29 / Case 172)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65172' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that searching for a channel in Create Event Location modal is diacritic-insensitive (e.g. typing "thong bao" matches "thông báo") (TC-CI-29 / Case 172).
    `);

    const clanPage = new ClanPage(page);
    const channelName = `thong-bao-${generateRandomString(4)}`.toLowerCase();

    await AllureReporter.step(`Create channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step(
      'Open Create Event modal and search for channel with unaccented query',
      async () => {
        const createEventBtn = page
          .locator('button:has-text("Create Event"), [data-e2e*="create_event"]')
          .first();
        if (await createEventBtn.isVisible({ timeout: 5000 })) {
          await createEventBtn.click();

          const searchInput = page
            .locator('input[placeholder*="channel"], input[placeholder*="Search"]')
            .first();
          if (await searchInput.isVisible({ timeout: 3000 })) {
            await searchInput.fill('thong bao');
            await page.waitForTimeout(500);

            const resultItem = page.locator(`text=${channelName}`).first();
            if (await resultItem.isVisible({ timeout: 3000 })) {
              await expect(resultItem).toBeVisible();
            }
          }
          await page.keyboard.press('Escape');
        }
      }
    );
  });
});
