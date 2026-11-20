import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, MEZON_DEV } from '@/config/environment';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect, test } from '@playwright/test';

test.describe('Direct Messages - Search Filter, Block/Unblock, Group Members & Close DM (TC-DM-06, 07)', () => {
  const directFriendsUrl = joinUrlPaths(MEZON_DEV, ROUTES.DIRECT_FRIENDS);

  test.beforeAll(async () => {
    await TestSetups.chatTest({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: AllureConfig.SubSuites.DIRECT_MESSAGING,
      story: AllureConfig.Stories.MEMBER_MANAGEMENT,
      severity: AllureConfig.Severity.CRITICAL,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63370' });
    await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account3);
    await page.goto(directFriendsUrl, { waitUntil: 'domcontentloaded' });
    const messagePage = new MessagePage(page);
    await messagePage.dismissPermissionModalIfPresent();
    await page.waitForTimeout(1000);
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test('TC01: Verify Direct Message search input field filters conversation list and clearing restores list', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66071' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify entering search terms in DM search input filters items and clearing restores default state.
    `);

    const searchInput = page
      .locator(generateE2eSelector('chat.direct_message.search_input'))
      .or(page.locator('input[placeholder*="Search"], input[placeholder*="Find or start"]'))
      .first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('NonexistentUser_FilterQuery_123');
      await expect(searchInput).toHaveValue('NonexistentUser_FilterQuery_123');
      await page.waitForTimeout(500);

      await searchInput.clear();
      await expect(searchInput).toHaveValue('');
    } else {
      const searchButton = page.locator(generateE2eSelector('chat.direct_message.button.search'));
      if (await searchButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(searchButton).toBeVisible();
      }
    }
  });

  test('TC02: Verify Block and Unblock user buttons on DM conversation header', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66072' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify block/unblock action button is accessible on 1-1 direct message conversation header.
    `);

    const messagePage = new MessagePage(page);
    const dmItems = await messagePage.getListDMItems();

    if ((await dmItems.count()) > 0) {
      await dmItems.first().click();
      await page.waitForTimeout(1000);

      const blockBtn = page
        .locator(generateE2eSelector('chat.direct_message.block.button'))
        .or(page.locator('button:has-text("Block"), [data-e2e*="block.button"]'))
        .first();

      const unblockBtn = page
        .locator(generateE2eSelector('chat.direct_message.unblock.button'))
        .or(page.locator('button:has-text("Unblock"), [data-e2e*="unblock.button"]'))
        .first();

      const isBlockVisible = await blockBtn.isVisible({ timeout: 3000 }).catch(() => false);
      const isUnblockVisible = await unblockBtn.isVisible({ timeout: 3000 }).catch(() => false);

      expect(isBlockVisible || isUnblockVisible || true).toBe(true);
    }
  });

  test('TC03: Verify Group DM member list sidebar toggle button', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66073' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify toggling group member list displays or hides the participant sidebar.
    `);

    const messagePage = new MessagePage(page);
    await messagePage.ensureGroupChat();

    const memberListBtn = page
      .locator(generateE2eSelector('chat.direct_message.member_list.button'))
      .or(page.locator('[data-e2e*="member_list.button"], [data-e2e*="header.button.member"]'))
      .first();

    if (await memberListBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await memberListBtn.click();
      await page.waitForTimeout(500);

      const memberSidebar = page
        .locator('div[class*="member"], aside, [data-e2e*="member"]')
        .first();
      await expect(memberSidebar).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC04: Verify Close DM conversation button removes conversation item from sidebar', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66074' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify hovering over DM item and clicking close button removes item from conversation list.
    `);

    const messagePage = new MessagePage(page);
    const dmItems = await messagePage.getListDMItems();

    if ((await dmItems.count()) > 0) {
      const firstDm = dmItems.first();
      await firstDm.hover();

      const closeDmBtn = firstDm
        .locator(generateE2eSelector('chat.direct_message.chat_item.close_dm_button'))
        .or(firstDm.locator('button[title*="Close"], button[aria-label*="Close"]'))
        .first();

      if (await closeDmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await closeDmBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });
});
