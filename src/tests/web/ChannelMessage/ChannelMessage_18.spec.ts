import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { Page } from '@playwright/test';

test.describe('Channel Messages - Quick Menu Management', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account8;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage6,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await new ChannelSettingPage(page).closeChannelSettingsIfVisible();
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  async function openQuickMenuSettings(page: Page): Promise<ChannelSettingPage> {
    const clanPage = new ClanPage(page);
    const settings = new ChannelSettingPage(page);
    await clanPage.openChannelSettings('general');
    await settings.openQuickMenuSettings();
    await settings.openQuickMenuModal();
    return settings;
  }

  test('Create a Quick Menu that triggers a bot event', async ({ page }) => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify a Quick Menu can be created for a channel.

      **Test Steps:**
      1. Open Quick Actions and the Quick Menus tab
      2. Create a Quick Menu
      3. Verify its name, type, and bot-event behavior in the list

      **Expected Result:** The new item is displayed as a Quick Menu that triggers a bot event.
    `);
    await AllureReporter.addLabels({ tag: ['channel-message', 'quick-menu', 'create'] });

    const menuName = `qm${Date.now().toString(36).slice(-6)}`;
    const settings = await openQuickMenuSettings(page);
    await settings.createQuickMenu(menuName);
    await settings.deleteQuickMenu(menuName);
  });

  test('Edit a Quick Menu name', async ({ page }) => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify an existing Quick Menu can be renamed.

      **Test Steps:**
      1. Create a Quick Menu
      2. Edit its name
      3. Verify the old item disappears and the updated item remains a bot-event Quick Menu

      **Expected Result:** The Quick Menu is displayed with its updated name and correct type.
    `);
    await AllureReporter.addLabels({ tag: ['channel-message', 'quick-menu', 'edit'] });

    const suffix = Date.now().toString(36).slice(-5);
    const originalName = `qa${suffix}`;
    const editedName = `qb${suffix}`;
    const settings = await openQuickMenuSettings(page);
    await settings.createQuickMenu(originalName);
    await settings.editQuickMenu(originalName, editedName);
    await settings.deleteQuickMenu(editedName);
  });

  test('Delete a Quick Menu', async ({ page }) => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify a Quick Menu can be deleted after confirmation.

      **Test Steps:**
      1. Create a Quick Menu
      2. Click its delete action
      3. Confirm deletion
      4. Verify the item disappears from the list

      **Expected Result:** The deleted Quick Menu is no longer displayed.
    `);
    await AllureReporter.addLabels({ tag: ['channel-message', 'quick-menu', 'delete'] });

    const menuName = `qd${Date.now().toString(36).slice(-6)}`;
    const settings = await openQuickMenuSettings(page);
    await settings.createQuickMenu(menuName);
    await settings.deleteQuickMenu(menuName);
  });

  test('Update Flash Message count after create and delete', async ({ page }) => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify the Flash Messages tab count reflects its items.

      **Test Steps:**
      1. Record the initial Flash Messages count
      2. Create one Flash Message and verify its count increases by one
      3. Delete the Flash Message and verify the count returns to its initial value

      **Expected Result:** The Flash Messages counter updates correctly after creating and deleting an item.
    `);
    await AllureReporter.addLabels({ tag: ['channel-message', 'flash-message', 'count'] });

    const clanPage = new ClanPage(page);
    const settings = new ChannelSettingPage(page);
    const suffix = Date.now().toString(36).slice(-5);
    const flashCommand = `fc${suffix}`;
    const flashContent = `Flash count message ${suffix}`;

    await clanPage.openChannelSettings('general');
    await settings.openQuickMenuSettings();
    const initialFlashCount = await settings.getQuickActionTabCount('flash-message');

    await AllureReporter.step('Create a Flash Message and verify its count', async () => {
      await settings.openFlashMessageModal();
      await settings.createFlashMessage(flashCommand, flashContent);
      await settings.verifyQuickActionTabCount('flash-message', initialFlashCount + 1);
    });

    await AllureReporter.step('Delete the Flash Message and verify its count', async () => {
      await settings.deleteFlashMessage(flashCommand);
      await settings.verifyQuickActionTabCount('flash-message', initialFlashCount);
    });
  });

  test('Update Quick Menu count after create and delete', async ({ page }) => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify the Quick Menus tab count reflects its items.

      **Test Steps:**
      1. Record the initial Quick Menus count
      2. Create one Quick Menu and verify its count increases by one
      3. Delete the Quick Menu and verify the count returns to its initial value

      **Expected Result:** The Quick Menus counter updates correctly after creating and deleting an item.
    `);
    await AllureReporter.addLabels({ tag: ['channel-message', 'quick-menu', 'count'] });

    const settings = await openQuickMenuSettings(page);
    const suffix = Date.now().toString(36).slice(-5);
    const quickMenuName = `qc${suffix}`;
    const initialQuickMenuCount = await settings.getQuickActionTabCount('quick-menu');

    await AllureReporter.step('Create a Quick Menu and verify its count', async () => {
      await settings.createQuickMenu(quickMenuName);
      await settings.verifyQuickActionTabCount('quick-menu', initialQuickMenuCount + 1);
    });

    await AllureReporter.step('Delete the Quick Menu and verify its count', async () => {
      await settings.deleteQuickMenu(quickMenuName);
      await settings.verifyQuickActionTabCount('quick-menu', initialQuickMenuCount);
    });
  });
});
