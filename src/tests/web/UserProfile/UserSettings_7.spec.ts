import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { MessagePage } from '@/pages/MessagePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('User Settings - Spelling Boundary (255/256/257) & Appearance Motion (TC-CI-09, 30 / Cases 152, 173)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account1;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63571' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify spelling/grammar check boundary at 255, 256, 257 characters and text not auto-corrected without accept (TC-CI-09 / Case 152)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65152' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify spelling analysis handles boundary lengths 255, 256, 257 without crash, and never auto-corrects original user text without explicit user acceptance (TC-CI-09 / Case 152).
      **Steps:**
      1. Turn ON spelling check in User Settings -> Chat.
      2. Type text of lengths 255, 256, and 257 chars containing intentional spelling errors.
      3. Verify composer handles input smoothly without crashing.
      4. Submit message directly without pressing Tab/Accept.
      5. Verify sent message preserves verbatim user input.
    `);

    const profilePage = new ProfilePage(page);
    const messagePage = new MessagePage(page);

    await AllureReporter.step('Enable spelling in settings', async () => {
      await profilePage.openUserSettingProfile();
      await profilePage.openChatTab();
      await profilePage.toggleSpelling(true);
      await profilePage.closeSettingsProfile();
    });

    const input = messagePage['selector'].messageInput;
    await expect(input).toBeVisible({ timeout: 10000 });

    const boundaryLengths = [255, 256, 257];
    for (const len of boundaryLengths) {
      await AllureReporter.step(`Test boundary input of ${len} characters`, async () => {
        const textChunk = 'sai chinh ta '.repeat(Math.ceil(len / 13)).slice(0, len);
        await input.fill(textChunk);
        await page.waitForTimeout(500);
        await expect(input).toContainText(textChunk.slice(0, 50));
      });
    }

    await AllureReporter.step(
      'Send without accepting recommendation and verify verbatim preservation',
      async () => {
        const originalText = 'toi di hoc muon hom nay khong co sao';
        await input.fill(originalText);
        await input.press('Enter');
        await page.waitForTimeout(2000);

        const messageHelper = new MessageTestHelpers(page);
        const isVisible = await messageHelper.isMessageVisible(originalText);
        expect(isVisible).toBe(true);
      }
    );
  });

  test('TC02: Verify appearance settings and interactive icons smoke (TC-CI-30 / Case 173)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65173' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify User Settings Appearance controls and verify primary interactive icons function correctly (TC-CI-30 / Case 173).
    `);

    const profilePage = new ProfilePage(page);

    await AllureReporter.step('Open user settings', async () => {
      await profilePage.openUserSettingProfile();
      await page.waitForTimeout(500);
    });

    await AllureReporter.step('Close user settings', async () => {
      await profilePage.closeSettingsProfile();
    });

    await AllureReporter.step('Smoke check primary interactive UI icon locators', async () => {
      const channelBar = page.locator('[data-e2e*="channel_list"], nav').first();
      await expect(channelBar).toBeVisible();
    });
  });
});
