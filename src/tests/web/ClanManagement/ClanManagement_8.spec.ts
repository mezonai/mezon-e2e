import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { CLAN_MANAGEMENT_TAG } from '@/constants/ClanManagement';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Category Order', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account5;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.clanManagement4,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63510' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => AuthHelper.logout(page));
  test.afterAll(async ({ browser }) =>
    TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials })
  );

  test('Verify clan categories can be reordered by drag and drop', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify a clan owner can reorder categories by drag and drop.

      **Test Steps:**
      1. Create two categories
      2. Open Clan Settings > Category Order
      3. Drag the first category onto the second category
      4. Verify their relative order changes in Category Order
      5. Close Clan Settings and verify the new order in the channel list

      **Expected Result:** The reordered categories keep their new relative order in the clan sidebar.
    `);
    await AllureReporter.addLabels({
      tag: [CLAN_MANAGEMENT_TAG, 'category', 'drag-and-drop', 'reorder-category'],
    });

    const clanPage = new ClanPage(page);
    const menuPanel = new ClanMenuPanel(page);
    const unique = Date.now().toString(36).slice(-6);
    const sourceCategoryName = `drag-a-${unique}`;
    const targetCategoryName = `drag-b-${unique}`;

    try {
      for (const categoryName of [sourceCategoryName, targetCategoryName]) {
        await AllureReporter.step(`Create category: ${categoryName}`, async () => {
          expect(await menuPanel.createCategory(categoryName)).toBe(true);
          expect(await menuPanel.isCategoryPresent(categoryName)).toBe(true);
        });
      }

      await AllureReporter.step(
        'Reorder categories and verify the order in Clan Settings and the channel list',
        async () => {
          await clanPage.reorderCategoriesByDragAndDrop(sourceCategoryName, targetCategoryName);
        }
      );

      await AllureReporter.attachScreenshot(page, 'Clan categories reordered by drag and drop');
    } finally {
      await clanPage.closeSettingsClanIfOpen();
      for (const categoryName of [sourceCategoryName, targetCategoryName]) {
        try {
          await clanPage.deleteCategory(categoryName);
        } catch (error) {
          console.warn(`Failed to clean up category "${categoryName}":`, error);
        }
      }
    }
  });

  test('Verify clan categories can be reordered directly from the sidebar', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify categories can be reordered directly from the clan sidebar.

      **Test Steps:**
      1. Create two categories
      2. Enable sidebar drag mode
      3. Verify the drag button displays its active green styles
      4. Drag the first category onto the second category
      5. Verify their relative order changes in the sidebar

      **Expected Result:** The categories are reordered while sidebar drag mode is active.
    `);
    await AllureReporter.addLabels({
      tag: [CLAN_MANAGEMENT_TAG, 'category', 'sidebar', 'drag-and-drop'],
    });

    const clanPage = new ClanPage(page);
    const menuPanel = new ClanMenuPanel(page);
    const unique = Date.now().toString(36).slice(-6);
    const sourceCategoryName = `side-a-${unique}`;
    const targetCategoryName = `side-b-${unique}`;

    try {
      for (const categoryName of [sourceCategoryName, targetCategoryName]) {
        await AllureReporter.step(`Create category: ${categoryName}`, async () => {
          expect(await menuPanel.createCategory(categoryName)).toBe(true);
          expect(await menuPanel.isCategoryPresent(categoryName)).toBe(true);
        });
      }

      await AllureReporter.step('Enable drag mode and reorder the sidebar categories', async () => {
        await clanPage.reorderSidebarCategoriesByDragAndDrop(
          sourceCategoryName,
          targetCategoryName
        );
      });

      await AllureReporter.attachScreenshot(page, 'Sidebar categories reordered by drag and drop');
    } finally {
      await clanPage.closeSettingsClanIfOpen();
      for (const categoryName of [sourceCategoryName, targetCategoryName]) {
        try {
          await clanPage.deleteCategory(categoryName);
        } catch (error) {
          console.warn(`Failed to clean up category "${categoryName}":`, error);
        }
      }
    }
  });

  test('Verify a clan channel can be muted for one hour from the context menu', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify a channel can be muted for a selected duration from its context menu.

      **Test Steps:**
      1. Create a text channel
      2. Right-click the channel and hover Mute Channel
      3. Verify the timed mute options are displayed
      4. Select For 1 hour
      5. Reopen the channel context menu
      6. Verify Unmute Channel and the Muted until timestamp are displayed

      **Expected Result:** The channel is muted for one hour and its context menu displays the mute expiry time.
    `);
    await AllureReporter.addLabels({
      tag: [CLAN_MANAGEMENT_TAG, 'channel', 'mute-channel', 'context-menu'],
    });

    const clanPage = new ClanPage(page);
    const channelName = `mute-hour-${Date.now().toString(36).slice(-6)}`;

    await AllureReporter.step(`Create text channel: ${channelName}`, async () => {
      expect(await clanPage.createNewChannel(ChannelType.TEXT, channelName)).toBe(true);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step('Mute the channel for one hour and verify its status', async () => {
      await clanPage.muteChannelForOneHourFromContextMenu(channelName);
    });

    await AllureReporter.attachScreenshot(page, 'Channel muted for one hour');
  });
});
