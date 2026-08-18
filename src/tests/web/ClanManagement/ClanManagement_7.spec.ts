import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import {
  CLAN_MANAGEMENT_TAG,
  CONTEXT_MENU_TAG,
  TEST_ENTITY_NAME_MAX_LENGTH,
} from '@/constants/ClanManagement';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - System Messages and Roles', () => {
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

  test('Verify clan update is sent to general when management system messages are enabled', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify clan management actions are logged in the configured system channel.

      **Test Steps:**
      1. Open Clan Settings > Overview
      2. Enable "Send a log when an action is applied to the clan"
      3. Update the clan name
      4. Open the general channel
      5. Verify system message chat.system_message.10 contains the updated clan name

      **Expected Result:** The general channel displays a system message for the clan-name update.
    `);
    await AllureReporter.addLabels({
      tag: [CLAN_MANAGEMENT_TAG, 'system-message', 'general-channel'],
    });

    const clanPage = new ClanPage(page);
    const originalClanName = clanFactory.getClanName();
    const updatedClanName = `SystemLog_${Date.now().toString(36)}`;
    let clanNameWasUpdated = false;

    await AllureReporter.step('Enable clan management system messages', async () => {
      await clanPage.enableClanManagementSystemMessages();
    });

    try {
      await AllureReporter.step(`Update clan name to ${updatedClanName}`, async () => {
        await clanPage.updateClanName(updatedClanName);
        clanNameWasUpdated = true;
        await clanPage.closeSettingsClan();
      });

      await AllureReporter.step('Verify the clan update system message in general', async () => {
        await clanPage.verifyClanUpdateSystemMessage('general', updatedClanName);
      });

      await AllureReporter.attachScreenshot(page, 'Clan management system message displayed');
    } finally {
      if (clanNameWasUpdated) {
        await clanPage.openClanSettings();
        await clanPage.updateClanName(originalClanName);
        await clanPage.closeSettingsClan();
      }
    }
  });

  test('Verify a clan role can be deleted', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify a clan owner can delete a custom role.

      **Test Steps:**
      1. Open Clan Settings > Roles
      2. Create a custom role
      3. Reopen Roles and delete the created role
      4. Confirm the deletion
      5. Verify the role no longer exists in the role list

      **Expected Result:** The deleted role is removed from the clan role list.
    `);
    await AllureReporter.addLabels({
      tag: [CLAN_MANAGEMENT_TAG, 'role', 'delete-role'],
    });

    const clanPage = new ClanPage(page);
    const roleName = `delete-role-${Date.now().toString(36)}`.slice(0, TEST_ENTITY_NAME_MAX_LENGTH);

    await AllureReporter.step(`Create role: ${roleName}`, async () => {
      const opened = await clanPage.openRoleSettingsPage();
      expect(opened).toBe(true);
      await clanPage.addNewRoleOnClan(roleName);
    });

    await AllureReporter.step(`Delete role: ${roleName}`, async () => {
      await clanPage.deleteRole(roleName);
      await clanPage.closeSettingsClan();
    });

    await AllureReporter.attachScreenshot(page, 'Clan role deleted successfully');
  });

  test('Verify Create Text Channel action preselects the text channel type', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify the channel context menu opens the create-channel modal with Text preselected.

      **Test Steps:**
      1. Create a text channel
      2. Right-click the channel in the channel list
      3. Click "Create Text Channel"
      4. Verify the create-channel modal is displayed with Text selected

      **Expected Result:** The create-channel modal opens with the Text option preselected.
    `);
    await AllureReporter.addLabels({
      tag: [CLAN_MANAGEMENT_TAG, 'channel', CONTEXT_MENU_TAG, 'text-channel'],
    });

    const clanPage = new ClanPage(page);
    const channelName = `context-text-${Date.now().toString(36)}`.slice(
      0,
      TEST_ENTITY_NAME_MAX_LENGTH
    );

    await AllureReporter.step(`Create text channel: ${channelName}`, async () => {
      expect(await clanPage.createNewChannel(ChannelType.TEXT, channelName)).toBe(true);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step(
      'Open Create Text Channel from the context menu and verify Text is preselected',
      async () => {
        await clanPage.verifyCreateChannelTypeFromContextMenu(channelName, ChannelType.TEXT);
      }
    );

    await AllureReporter.attachScreenshot(page, 'Text channel type preselected');
  });

  test('Verify Create Voice Channel action preselects the voice channel type', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify the channel context menu opens the create-channel modal with Voice preselected.

      **Test Steps:**
      1. Create a voice channel
      2. Right-click the channel in the channel list
      3. Click "Create Voice Channel"
      4. Verify the create-channel modal is displayed with Voice selected

      **Expected Result:** The create-channel modal opens with the Voice option preselected.
    `);
    await AllureReporter.addLabels({
      tag: [CLAN_MANAGEMENT_TAG, 'channel', CONTEXT_MENU_TAG, 'voice-channel'],
    });

    const clanPage = new ClanPage(page);
    const channelName = `context-voice-${Date.now().toString(36)}`.slice(
      0,
      TEST_ENTITY_NAME_MAX_LENGTH
    );

    await AllureReporter.step(`Create voice channel: ${channelName}`, async () => {
      expect(await clanPage.createNewChannel(ChannelType.VOICE, channelName)).toBe(true);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step(
      'Open Create Voice Channel from the context menu and verify Voice is preselected',
      async () => {
        await clanPage.verifyCreateChannelTypeFromContextMenu(channelName, ChannelType.VOICE);
      }
    );

    await AllureReporter.attachScreenshot(page, 'Voice channel type preselected');
  });

  test('Verify clan roles can be reordered by drag and drop', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify a clan owner can reorder custom roles by drag and drop.

      **Test Steps:**
      1. Create two custom roles
      2. Open Clan Settings > Roles
      3. Drag the first role onto the second role
      4. Verify their relative order changes
      5. Delete both test roles

      **Expected Result:** The dragged role moves across the target role in the role list.
    `);
    await AllureReporter.addLabels({
      tag: [CLAN_MANAGEMENT_TAG, 'role', 'drag-and-drop', 'reorder-role'],
    });

    const clanPage = new ClanPage(page);
    const unique = Date.now().toString(36).slice(-6);
    const sourceRoleName = `drag-a-${unique}`.slice(0, TEST_ENTITY_NAME_MAX_LENGTH);
    const targetRoleName = `drag-b-${unique}`.slice(0, TEST_ENTITY_NAME_MAX_LENGTH);

    try {
      for (const roleName of [sourceRoleName, targetRoleName]) {
        await AllureReporter.step(`Create role: ${roleName}`, async () => {
          expect(await clanPage.openRoleSettingsPage()).toBe(true);
          await clanPage.addNewRoleOnClan(roleName);
        });
      }

      await AllureReporter.step('Drag the first role onto the second role', async () => {
        await clanPage.reorderRolesByDragAndDrop(sourceRoleName, targetRoleName);
      });

      await AllureReporter.attachScreenshot(page, 'Clan roles reordered by drag and drop');
    } finally {
      for (const roleName of [sourceRoleName, targetRoleName]) {
        try {
          await clanPage.deleteRole(roleName);
          await clanPage.closeSettingsClan();
        } catch (error) {
          console.warn(`Failed to clean up role "${roleName}":`, error);
        }
      }
    }
  });
});
