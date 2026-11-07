import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanSettingsPage } from '@/pages/ClanSettingsPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Settings - Community & Sound Effect', () => {
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

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('Case 39: Sound effect empty state and upload modal lifecycle', async ({ page }) => {
    const clanSettingsPage = new ClanSettingsPage(page);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can open Clan Settings -> Sound Effect, view the empty state, open the upload modal, and cancel without unintended changes.

      **Test Steps:**
      1. Open Clan Settings from clan header menu
      2. Navigate to Sound Effect tab
      3. Verify empty state text and Upload Voice Sticker button
      4. Click Upload Voice Sticker button to open modal
      5. Verify modal title and action controls (Cancel and Upload buttons)
      6. Click Cancel button to close upload modal
      7. Verify upload modal is dismissed and Sound Effect tab remains active
      8. Close Clan Settings modal

      **Expected Result:** Sound effect tab loads correctly, upload modal opens and dismisses cleanly.
    `);

    await AllureReporter.addLabels({
      tag: ['clan-settings', 'sound-effect', 'voice-stickers', 'coverage'],
    });

    await AllureReporter.step('Open Clan Settings', async () => {
      await clanSettingsPage.openClanSettings();
    });

    await AllureReporter.step('Navigate to Sound Effect tab', async () => {
      await clanSettingsPage.openSoundEffectTab();
      await clanSettingsPage.verifySoundEffectEmptyState();
    });

    await AllureReporter.step('Open Upload Voice Sticker modal', async () => {
      await clanSettingsPage.openUploadSoundModal();
    });

    await AllureReporter.step('Dismiss Upload modal via Cancel button', async () => {
      await clanSettingsPage.closeUploadSoundModal();
    });

    await AllureReporter.step(
      'Verify Sound Effect tab remains open and close Clan Settings',
      async () => {
        const selector = clanSettingsPage.getSelector();
        await expect(selector.soundEffect.uploadButton).toBeVisible();
        await clanSettingsPage.closeClanSettings();
      }
    );
  });

  test('Case 119: Community: validation when enabling without required fields', async ({
    page,
  }) => {
    const clanSettingsPage = new ClanSettingsPage(page);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that attempting to enable Community feature without mandatory fields (Banner, Description, About, Vanity URL, Hashtags) triggers error validation and blocks submission.

      **Test Steps:**
      1. Open Clan Settings from clan header menu
      2. Navigate to Enable Community tab
      3. Click Enable Community button to open setup modal
      4. Click Enable & Save button without filling mandatory fields
      5. Verify validation error toast is displayed
      6. Close setup modal via close button
      7. Verify setup modal is dismissed and initial Enable Community screen remains active
      8. Close Clan Settings modal

      **Expected Result:** Empty mandatory fields are blocked with clear validation, and canceling preserves initial state.
    `);

    await AllureReporter.addLabels({
      tag: ['clan-settings', 'community', 'validation', 'coverage'],
    });

    await AllureReporter.step('Open Clan Settings', async () => {
      await clanSettingsPage.openClanSettings();
    });

    await AllureReporter.step('Navigate to Enable Community tab', async () => {
      await clanSettingsPage.openCommunityTab();
    });

    await AllureReporter.step('Open Enable Community setup modal', async () => {
      await clanSettingsPage.openEnableCommunityModal();
    });

    await AllureReporter.step(
      'Submit without filling mandatory fields and verify validation',
      async () => {
        await clanSettingsPage.submitEnableCommunity();
        await clanSettingsPage.verifyCommunityRequiredFieldsValidation();
      }
    );

    await AllureReporter.step('Dismiss setup modal via close button', async () => {
      await clanSettingsPage.closeEnableCommunityModal();
    });

    await AllureReporter.step(
      'Verify Enable Community screen remains active and close Clan Settings',
      async () => {
        const selector = clanSettingsPage.getSelector();
        await expect(selector.community.enableButton).toBeVisible();
        await clanSettingsPage.closeClanSettings();
      }
    );
  });
});
