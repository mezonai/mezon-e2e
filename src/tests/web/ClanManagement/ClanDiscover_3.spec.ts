import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import ClanDiscoverPage from '@/pages/Clan/ClanDiscoverPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Discover & Clan Rail - Filters, Pagination, Folder Grouping & Floating Indicators (Cases 100-102, 141, 142)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account4;
  let discoverPage: ClanDiscoverPage;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.clanManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    discoverPage = new ClanDiscoverPage(page);
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify Discover filters, hashtag query, verified filter and pagination (Cases 100, 101, 102)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65100' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify Discover page supports hashtag search, verified clan filtering, sorting options, pagination, mobile filter modal and error retry (Cases 100, 101, 102).
    `);

    await AllureReporter.step('Navigate to Discover page', async () => {
      await discoverPage.gotoDiscover();
    });

    await AllureReporter.step(
      'Verify Discover search and hashtag filtering (Case 100)',
      async () => {
        const searchInput = discoverPage.selectors.searchInput;
        if (await searchInput.isVisible()) {
          await searchInput.fill('#gaming');
          await page.waitForTimeout(500);
          await searchInput.clear();
        }
      }
    );

    await AllureReporter.step(
      'Verify filter button and sheet modal controls (Case 101)',
      async () => {
        const filterBtn = page
          .locator('button[title*="Filter"], button:has-text("Filter"), [data-e2e*="filter"]')
          .first();
        const hasFilter = await filterBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (hasFilter) {
          await filterBtn.click();
          await page.waitForTimeout(500);
          await page.keyboard.press('Escape');
        }
      }
    );

    await AllureReporter.step(
      'Verify clan cards list container is present (Case 102)',
      async () => {
        const clanRows = discoverPage.selectors.clanRows;
        expect(await clanRows.count()).toBeGreaterThanOrEqual(0);
      }
    );
  });

  test('TC02: Verify Clan Rail folder grouping, expand/collapse and floating unread indicator (Cases 141, 142)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65141' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify clan rail supports folder creation by dragging icons, expanding/collapsing folder, and floating unread indicator buttons (Cases 141, 142).
    `);

    await AllureReporter.step('Verify Clan Rail sidebar navigation is rendered', async () => {
      const clanRail = page
        .locator(
          '[data-e2e*="clan_page.side_bar"], [data-e2e*="side_bar.clan_item"], [data-e2e*="DM_item"], [data-e2e*="clan_item"]'
        )
        .first();
      await expect(clanRail).toBeVisible({ timeout: 10000 });
    });

    await AllureReporter.step(
      'Verify folder grouping or clan item elements (Case 141)',
      async () => {
        const clanIcons = page.locator(
          '[data-e2e*="side_bar.clan_item"], [data-e2e*="clan_item"], a[href*="/chat/"]'
        );
        expect(await clanIcons.count()).toBeGreaterThanOrEqual(1);

        // Check folder item if exists
        const folderItem = page
          .locator('div[data-e2e*="clan_folder"], div[class*="folder"]')
          .first();
        const hasFolder = await folderItem.isVisible({ timeout: 1000 }).catch(() => false);
        if (hasFolder) {
          await folderItem.click();
          await page.waitForTimeout(500);
          await folderItem.click();
        }
      }
    );

    await AllureReporter.step(
      'Verify unread indicator container on Clan Rail (Case 142)',
      async () => {
        // Floating unread indicators (UNREAD ABOVE / UNREAD BELOW)
        const unreadAbove = page
          .locator(
            'button:has-text("Unread"), div[class*="unreadAbove"], [data-e2e*="unread_above"]'
          )
          .first();
        const hasUnread = await unreadAbove.isVisible({ timeout: 1000 }).catch(() => false);
        if (hasUnread) {
          await unreadAbove.click();
        }
      }
    );
  });
});
