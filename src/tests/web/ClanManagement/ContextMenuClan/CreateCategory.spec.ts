import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanInviteFriendModal } from '@/pages/Clan/ClanInviteFriendModal';
import { ClanInviteModal } from '@/pages/Modal/ClanInviteModal';
import { MezonCredentials } from '@/types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, test } from '@playwright/test';

test.describe('Clan Context Menu - Create Category', () => {
  const clanFactory = new ClanFactory();
  const credentials: MezonCredentials = AccountCredentials.account3;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.clanManagement2,
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

  test('Create category with valid name', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Create a valid category from the Clan context menu and display it in the sidebar.

      **Test Steps:**
      1. Generate a valid category name, ensuring it's short (< 64 characters)
      2. Open the context menu, select Create Category, enter the name, and confirm
      3. Confirm the new category appears in the sidebar category list

      **Expected Result:** The category is successfully created and displayed in the list.
    `);

    await AllureReporter.addLabels({
      tag: ['category', 'context-menu', 'creation'],
    });

    const categoryName = `category-valid-${Date.now().toString(36).slice(-8)}`;
    const menuPanel = new ClanMenuPanel(page);

    await AllureReporter.addParameter('categoryName', categoryName);

    await AllureReporter.step(`Create category: ${categoryName}`, async () => {
      await menuPanel.createCategory(categoryName);
    });

    await AllureReporter.step('Confirm category appears in sidebar', async () => {
      const isPresent = await menuPanel.isCategoryPresent(categoryName);
      expect(isPresent).toBeTruthy();
    });

    await AllureReporter.attachScreenshot(page, `Category Created - ${categoryName}`);
  });

  test('Create category with allowed special characters', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Create a category using the allowed mix of characters (letters, spaces, hyphen, underscore, emoji).

      **Test Steps:**
      1. Open the context menu and launch the Create Category modal
      2. Enter a name that includes supported special characters
      3. Submit and verify the category renders in the sidebar

      **Expected Result:** Category creation succeeds and the name with special characters appears in the list.
    `);

    await AllureReporter.addLabels({
      tag: ['category', 'validation', 'special-characters'],
    });

    const categoryName = `Category ✨ Mix_${Date.now().toString(36).slice(-6)}-1`;
    const menuPanel = new ClanMenuPanel(page);

    await AllureReporter.addParameter('categoryName', categoryName);

    await AllureReporter.step(`Create category with special characters: ${categoryName}`, async () => {
      await menuPanel.createCategory(categoryName);
    });

    await AllureReporter.step('Verify category appears with special characters intact', async () => {
      const isPresent = await menuPanel.isCategoryPresent(categoryName);
      expect(isPresent).toBeTruthy();
    });

    await AllureReporter.attachScreenshot(page, `Category Special Characters - ${categoryName}`);
  });

  test('Create category option requires manageClan permission', async ({ page, browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Ensure the Create Category action is visible only to members with manageClan permission.

      **Test Steps:**
      1. Open the context menu as a clan manager and confirm the Create Category entry is visible
      2. Generate an invite link and join the clan with a non-manager account
      3. Open the context menu as the non-manager and confirm the Create Category entry is hidden

      **Expected Result:** Only the manager sees the Create Category option; non-manager members do not.
    `);

    await AllureReporter.addLabels({
      tag: ['category', 'context-menu', 'permissions'],
    });

    const menuPanel = new ClanMenuPanel(page);
    const clanPage = new ClanPage(page);

    await AllureReporter.step('Manager sees Create Category entry in context menu', async () => {
      await menuPanel.openPanel();
      await expect(menuPanel.buttons.createCategory).toBeVisible();
      await page.keyboard.press('Escape');
    });

    const inviteLink = await AllureReporter.step(
      'Generate clan invite link for secondary account',
      async () => {
        await clanPage.clickButtonInvitePeopleFromMenu();
        const inviteModal = new ClanInviteFriendModal(page);
        const link = await inviteModal.getInviteLink();
        await clanPage.buttons.closeInviteModal.click();
        await expect(clanPage.buttons.closeInviteModal).toBeHidden({ timeout: 5000 });
        return link;
      }
    );

    await AllureReporter.addParameter('secondaryAccount', AccountCredentials.account4.email);

    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();

    try {
      await AllureReporter.step('Non-manager signs in and joins the clan', async () => {
        await AuthHelper.setupAuthWithEmailPassword(memberPage, AccountCredentials.account4);
        await memberPage.goto(inviteLink, { waitUntil: 'domcontentloaded' });
        const clanInviteModal = new ClanInviteModal(memberPage);
        await expect(clanInviteModal.button.acceptInvite).toBeVisible({ timeout: 15000 });
        await clanInviteModal.acceptInvite();
        await memberPage.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      });

      await AllureReporter.step('Non-manager context menu hides Create Category entry', async () => {
        const memberMenuPanel = new ClanMenuPanel(memberPage);
        await memberMenuPanel.openPanel();
        await expect(memberMenuPanel.buttons.invitePeople).toBeVisible();
        await expect(memberMenuPanel.buttons.createCategory).toHaveCount(0);
        await memberPage.keyboard.press('Escape');
      });

      await AllureReporter.attachScreenshot(memberPage, 'Context Menu Without ManageClan');
    } finally {
      await memberContext.close();
    }
  });

  test('Create Category action closes context menu cleanly', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Ensure the context menu closes and the Create Category modal opens without residual overlays when the option is selected.

      **Test Steps:**
      1. Open the clan context menu and select Create Category
      2. Verify the modal is displayed while the context menu is dismissed
      3. Close the modal to reset the state

      **Expected Result:** Only the modal remains; context menu items are hidden until the modal is closed.
    `);

    await AllureReporter.addLabels({
      tag: ['category', 'context-menu', 'ui-state'],
    });

    const menuPanel = new ClanMenuPanel(page);

    await AllureReporter.step('Open context menu and launch Create Category modal', async () => {
      await menuPanel.openPanel();
      await menuPanel.buttons.createCategory.click();
    });

    await AllureReporter.step('Verify modal is displayed and menu is dismissed', async () => {
      await expect(menuPanel.input.categoryName).toBeVisible({ timeout: 5000 });
      await expect(menuPanel.buttons.confirmCreateCategory).toBeVisible();
      await expect(menuPanel.buttons.invitePeople).not.toBeVisible();
      const contextMenuItems = page.locator(generateE2eSelector('clan_page.header.modal_panel.item'));
      await expect(contextMenuItems.first()).not.toBeVisible();
    });

    await AllureReporter.step('Close modal and ensure context menu remains hidden', async () => {
      await menuPanel.buttons.cancelCreateCategory.click();
      await expect(menuPanel.input.categoryName).not.toBeVisible({ timeout: 5000 });
      const contextMenuItems = page.locator(generateE2eSelector('clan_page.header.modal_panel.item'));
      await expect(contextMenuItems.first()).not.toBeVisible();
    });

    await AllureReporter.attachScreenshot(page, 'Create Category Modal Clean State');
  });

  test('Submit without entering a name', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Ensure submitting the Create Category form without a name is prevented.

      **Test Steps:**
      1. Open the clan context menu and launch Create Category modal
      2. Do not type any name
      3. Verify the Create/Confirm button remains disabled

      **Expected Result:** Confirm button is disabled; no submission occurs.
    `);

    await AllureReporter.addLabels({
      tag: ['category', 'validation', 'required-field'],
    });

    const menuPanel = new ClanMenuPanel(page);

    await AllureReporter.step('Open Create Category modal', async () => {
      await menuPanel.text.clanName.click();
      await menuPanel.buttons.showEmpty.click();
      await menuPanel.buttons.createCategory.click();
      await menuPanel.input.categoryName.waitFor({ state: 'visible', timeout: 5000 });
    });

    await AllureReporter.step('Verify confirm button is disabled when name is empty', async () => {
      await expect(menuPanel.buttons.confirmCreateCategory).toBeDisabled();
    });

    await AllureReporter.attachScreenshot(page, 'Create Category - Empty Name Disabled');
  });

  test('Attempt with an existing category name', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Prevent creating a duplicate category from the clan context menu.

      **Test Steps:**
      1. Create a category with a unique name
      2. Attempt to create another category with the same name
      3. Confirm the modal surfaces the duplicate warning and blocks submission

      **Expected Result:** A duplicate category cannot be created; the modal shows the duplicate name warning and keeps the Create button disabled.
    `);

    await AllureReporter.addLabels({
      tag: ['category', 'validation', 'duplicate'],
    });

    const categoryName = `category-duplicate-${Date.now().toString(36).slice(-8)}`;
    const duplicateErrorMessage = 'The category name already exists in the clan.';
    const menuPanel = new ClanMenuPanel(page);

    await AllureReporter.addParameter('categoryName', categoryName);

    await AllureReporter.step(`Create baseline category: ${categoryName}`, async () => {
      await menuPanel.createCategory(categoryName);
      const isPresent = await menuPanel.isCategoryPresent(categoryName);
      expect(isPresent).toBeTruthy();
    });

    await AllureReporter.step('Attempt to reuse the same category name', async () => {
      await menuPanel.text.clanName.click();
      await menuPanel.buttons.showEmpty.click();
      await menuPanel.buttons.createCategory.click();
      await menuPanel.input.categoryName.waitFor({ state: 'visible', timeout: 5000 });
      await menuPanel.input.categoryName.fill(categoryName);

      await expect
        .poll(async () => await menuPanel.buttons.confirmCreateCategory.isEnabled())
        .toBeTruthy();
      await expect(page.getByText(duplicateErrorMessage, { exact: false })).toBeVisible();
      await expect(menuPanel.buttons.confirmCreateCategory).toBeDisabled();
      const categoryLocator = page
        .locator(generateE2eSelector('clan_page.side_bar.channel_list.category'))
        .filter({ hasText: categoryName });
      await expect(categoryLocator).toHaveCount(1);

      await menuPanel.buttons.cancelCreateCategory.click();
    });

    await AllureReporter.attachScreenshot(page, `Duplicate Category Blocked - ${categoryName}`);
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
    const invalidMessage =
      'Please enter a valid category name (max 64 characters, only words, numbers, _ or -).';
    const menuPanel = new ClanMenuPanel(page);

    await AllureReporter.addParameter('categoryNameLength', longName.length.toString());

    await AllureReporter.step('Open modal and input over-length category name', async () => {
      await menuPanel.text.clanName.click();
      await menuPanel.buttons.showEmpty.click();
      await menuPanel.buttons.createCategory.click();
      await menuPanel.input.categoryName.waitFor({ state: 'visible', timeout: 5000 });
      await menuPanel.input.categoryName.fill(longName);
    });

    await AllureReporter.step('Verify validation message and disabled Create button', async () => {
      await expect(page.getByText(invalidMessage, { exact: false })).toBeVisible();
      await expect
        .poll(async () => await menuPanel.buttons.confirmCreateCategory.isEnabled())
        .toBeFalsy();
      await expect(menuPanel.buttons.confirmCreateCategory).toBeDisabled();
    });

    await AllureReporter.step('Confirm category is not added to the sidebar list', async () => {
      const categoryLocator = page
        .locator(generateE2eSelector('clan_page.side_bar.channel_list.category'))
        .filter({ hasText: longName });
      await expect(categoryLocator).toHaveCount(0);
    });

    await menuPanel.buttons.cancelCreateCategory.click();

    await AllureReporter.attachScreenshot(page, 'Category Over Length Validation');
  });
});
