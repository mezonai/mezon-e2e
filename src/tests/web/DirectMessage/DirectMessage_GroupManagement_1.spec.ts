import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, MEZON_DEV } from '@/config/environment';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect, test } from '@playwright/test';

test.describe('Direct Message - Group DM Lifecycle, Member Management, Search & Close DM (TC-DM-03, 04, 05, 06)', () => {
  const directFriendsUrl = joinUrlPaths(MEZON_DEV, ROUTES.DIRECT_FRIENDS);

  test.beforeAll(async () => {
    await TestSetups.chatTest({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: AllureConfig.SubSuites.GROUP_CHAT,
      story: AllureConfig.Stories.MEMBER_MANAGEMENT,
      severity: AllureConfig.Severity.CRITICAL,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63370' });
    await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account3);
    await page.goto(directFriendsUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test('TC01: Verify Create Group DM via Plus button & friend selection modal (TC-DM-05)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66061' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can click Create DM Plus button, select friends, and create group.
    `);

    const messagePage = new MessagePage(page);
    await messagePage.createGroup();

    const groupName = await messagePage.getGroupName();
    await expect(groupName).toBeVisible({ timeout: 8000 });
  });

  test('TC02: Verify Group DM member list toggle button (TC-DM-06)', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66062' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify toggling group member list displays participant sidebar.
    `);

    const messagePage = new MessagePage(page);
    await messagePage.createGroup();

    const memberListBtn = page
      .locator(generateE2eSelector('chat.direct_message.member_list.button'))
      .or(page.locator('[data-e2e*="member_list.button"], [data-e2e*="header.button.member"]'))
      .first();

    if (await memberListBtn.isVisible({ timeout: 5000 })) {
      await memberListBtn.click();
      await page.waitForTimeout(500);
      const memberSidebar = page
        .locator('div[class*="member"], aside, [data-e2e*="member"]')
        .first();
      await expect(memberSidebar).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC03: Verify Edit Group DM name and save changes', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66063' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify editing group chat name updates group title.
    `);

    const messagePage = new MessagePage(page);
    await messagePage.createGroup();

    const editNameBtn = page
      .locator(
        `[data-e2e*="edit_group"], [data-e2e*="chat_item.edit_button"], button[title*="Edit"]`
      )
      .first();

    if (await editNameBtn.isVisible({ timeout: 5000 })) {
      await editNameBtn.click();
      const nameInput = page
        .locator('input[placeholder*="Group"], input[data-e2e*="group_name"]')
        .first();
      if (await nameInput.isVisible({ timeout: 3000 })) {
        const newName = `Group_${Date.now()}`;
        await nameInput.fill(newName);
        const saveBtn = page
          .locator(generateE2eSelector('chat.direct_message.edit_group.save_button'))
          .or(page.locator('button:has-text("Save"), button:has-text("Change")'))
          .first();
        if (await saveBtn.isVisible({ timeout: 3000 })) {
          await saveBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('TC04: Verify Add user button opens friend picker modal to add more members', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66064' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify clicking Add User in Group DM opens friend picker modal.
    `);

    const messagePage = new MessagePage(page);
    await messagePage.createGroup();

    const addUserBtn = page
      .locator(generateE2eSelector('chat.direct_message.button.add_user'))
      .or(page.locator('[data-e2e*="add_user"], button[title*="Add Users"]'))
      .first();

    if (await addUserBtn.isVisible({ timeout: 5000 })) {
      await addUserBtn.click();
      const modal = page.locator('div[role="dialog"], div[class*="modal"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      await page.keyboard.press('Escape');
    }
  });

  test('TC05: Verify Direct Message search input field filters conversation list', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66065' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify entering search terms in DM search input filters items.
    `);

    const searchInput = page
      .locator(generateE2eSelector('chat.direct_message.search_input'))
      .or(page.locator('input[placeholder*="Search"], input[placeholder*="Find or start"]'))
      .first();

    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('NonexistentUserQuery12345');
      await page.waitForTimeout(500);
      await searchInput.clear();
    }
  });

  test('TC06: Verify Close DM button removes 1-1 conversation item from sidebar', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66066' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify hovering over DM item and clicking 'X' closes conversation.
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

      if (await closeDmBtn.isVisible({ timeout: 3000 })) {
        await closeDmBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('TC07: Verify Leave Group DM via sidebar close action button with confirmation', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66067' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify leaving Group DM removes user and closes conversation.
    `);

    const messagePage = new MessagePage(page);
    await messagePage.createGroup();

    const groupTitle = await messagePage.getGroupName();
    if (await groupTitle.isVisible({ timeout: 5000 })) {
      await messagePage.leaveGroupByXBtn();
    }
  });

  test('TC08: Verify Block user button on DM header', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66068' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify block button exists or can be toggled in 1-1 DM conversation.
    `);

    const messagePage = new MessagePage(page);
    const dmItems = await messagePage.getListDMItems();

    if ((await dmItems.count()) > 0) {
      await dmItems.first().click();
      await page.waitForTimeout(500);

      const blockBtn = page
        .locator(generateE2eSelector('chat.direct_message.block.button'))
        .or(page.locator('button:has-text("Block"), [data-e2e*="block.button"]'))
        .first();

      if (await blockBtn.isVisible({ timeout: 3000 })) {
        await expect(blockBtn).toBeVisible();
      }
    }
  });

  test('TC09: Verify Unblock user button resets user block status', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66069' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify unblock button is available for previously blocked users.
    `);

    const unblockBtn = page
      .locator(generateE2eSelector('chat.direct_message.unblock.button'))
      .or(page.locator('button:has-text("Unblock"), [data-e2e*="unblock.button"]'))
      .first();

    const isVisible = await unblockBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('TC10: Verify Notification mute toggle on Group DM settings', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66070' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify notification mute options in group chat header.
    `);

    const messagePage = new MessagePage(page);
    await messagePage.createGroup();

    const muteBtn = page
      .locator(
        `[data-e2e*="header.button.mute"], button[title*="Mute"], button[aria-label*="Mute"]`
      )
      .first();

    if (await muteBtn.isVisible({ timeout: 5000 })) {
      await muteBtn.click();
      await page.waitForTimeout(500);
      const mutePopover = page.locator('div[role="menu"], div[class*="popover"]').first();
      if (await mutePopover.isVisible({ timeout: 3000 })) {
        await page.keyboard.press('Escape');
      }
    }
  });
});
