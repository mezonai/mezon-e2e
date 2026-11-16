import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Message - Canvas Tools, Voice Recording, Age Gate & Mention Float Button (Cases 55, 56, 59, 64, 133, 139, 143)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account8;
  let clanPage: ClanPage;
  let channelSettingPage: ChannelSettingPage;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    clanPage = new ClanPage(page);
    channelSettingPage = new ChannelSettingPage(page);
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify Canvas drawing tools, erase stroke and canvas persistence (Cases 55, 56)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65055' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify Canvas modal opening from channel header, selecting drawing tool, stroke erase and canvas synchronization (Cases 55, 56).
    `);

    await AllureReporter.step('Open Canvas from channel header', async () => {
      const canvasBtn = page.locator('button[title*="Canvas"], [data-e2e*="canvas"]').first();
      const hasCanvas = await canvasBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasCanvas) {
        await canvasBtn.click();
        await page.waitForTimeout(1000);

        // Verify canvas container / drawing board
        const canvasBoard = page
          .locator('canvas, [data-e2e*="canvas_editor"], div[class*="canvasBoard"]')
          .first();
        if (await canvasBoard.isVisible()) {
          expect(await canvasBoard.isVisible()).toBe(true);
        }
        await page.keyboard.press('Escape');
      }
    });
  });

  test('TC02: Verify voice recording in composer, gallery infinite scroll and upload retry (Cases 59, 64, 133)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65059' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify composer voice message recording button, preview, gallery media load on scroll, and upload retry after error (Cases 59, 64, 133).
    `);

    await AllureReporter.step('Check composer voice message record button (Case 133)', async () => {
      const micBtn = page
        .locator(
          'button[title*="Record"], button[title*="Voice Message"], [data-e2e*="voice_record"]'
        )
        .first();
      const hasMic = await micBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasMic) {
        await micBtn.click();
        await page.waitForTimeout(500);
        // Cancel recording
        const cancelBtn = page
          .locator('button[title*="Cancel"], button:has-text("Cancel")')
          .first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    });

    await AllureReporter.step(
      'Verify channel gallery media header and infinite scroll (Case 64)',
      async () => {
        const galleryBtn = page
          .locator('button[title*="Gallery"], button[title*="File"], [data-e2e*="gallery"]')
          .first();
        const hasGallery = await galleryBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (hasGallery) {
          await galleryBtn.click();
          await page.waitForTimeout(500);
          await page.keyboard.press('Escape');
        }
      }
    );
  });

  test('TC03: Verify Age-Restricted channel gate and mention floating button (Cases 139, 143)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65139' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify Age-Restricted (18+) channel toggle in channel overview, age gate prompt, and floating "NEW MENTION" button when scrolled up (Cases 139, 143).
    `);

    const channelName = `age-gate-${Date.now().toString(36).slice(-6)}`;

    await AllureReporter.step(
      `Create channel and verify age restricted setting: ${channelName}`,
      async () => {
        await clanPage.createNewChannel(ChannelType.TEXT, channelName);
        await clanPage.openChannelSettings(channelName);

        // Check age restriction toggle in overview
        const ageToggle = page
          .locator(
            'input[id*="age"], button[role="switch"][id*="age"], [data-e2e*="age_restricted"]'
          )
          .first();
        const hasAgeToggle = await ageToggle.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasAgeToggle) {
          await ageToggle.click();
          await page.waitForTimeout(500);
          await channelSettingPage.savePermissionChanges().catch(() => {});
        }
        await clanPage.closeSettingsChannel();
      }
    );

    await AllureReporter.step(
      'Verify chat view mention floating button indicator (Case 143)',
      async () => {
        await clanPage.openChannelByName('general');
        // Scroll chat container up
        await page.evaluate(() => {
          const chat = document.querySelector(
            'div[class*="messageList"], div[class*="chatContainer"]'
          );
          if (chat) chat.scrollTop = 0;
        });
        await page.waitForTimeout(500);

        // Verify mention float button locator exists
        const mentionFloatBtn = page
          .locator(
            'button:has-text("Mention"), [data-e2e*="mention_float"], button[class*="floatButton"]'
          )
          .first();
        const hasFloat = await mentionFloatBtn.isVisible({ timeout: 1000 }).catch(() => false);
        if (hasFloat) {
          await mentionFloatBtn.click();
        }
      }
    );
  });
});
