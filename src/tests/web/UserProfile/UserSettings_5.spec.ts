import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { MessagePage } from '@/pages/MessagePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import { joinUrlPaths } from '@/utils/joinUrlPaths';
import { expect, test } from '@playwright/test';

test.describe('User Settings - Chat Grammar & Spelling Check', () => {
  const clanFactory = new ClanFactory();
  const account = AccountCredentials.account6;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await TestSetups.authenticationTest({
      suite: AllureConfig.Suites.USER_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.USER_PROFILE,
      story: AllureConfig.Stories.PROFILE_SETUP,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AuthHelper.setupAuthWithEmailPassword(page, account);
    await clanFactory.setupClan(ClanSetupHelper.configs.userProfileUserSetting, page);
    clanFactory.setClanUrl(
      joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, splitDomainAndPath(clanFactory.getClanUrl()).path)
    );
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63571' });

    // Handle CORS headers for ONNX model requests from localhost dev server
    await page.route('https://cdn.komu.vn/**', async route => {
      try {
        const response = await route.fetch();
        await route.fulfill({
          response,
          headers: {
            ...response.headers(),
            'access-control-allow-origin': '*',
          },
        });
      } catch {
        await route.continue();
      }
    });

    const credentials = await AuthHelper.setupAuthWithEmailPassword(page, account);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await AllureReporter.addParameter('clanName', clanFactory.getClanName());
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const credentials = await AuthHelper.setupAuthWithEmailPassword(page, account);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await clanFactory.cleanupClan(page);
    await AuthHelper.logout(page);
    await context.close();
  });

  test('TC01: Toggle Chat Spelling Check ON and OFF in User Settings', async ({ page }) => {
    const profilePage = new ProfilePage(page);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can toggle the Grammar & Spelling check switch in User Settings -> Chat tab.

      **Test Steps:**
      1. Open User Settings modal
      2. Navigate to Chat tab
      3. Toggle the Spelling switch ON and verify state
      4. Toggle the Spelling switch OFF and verify state

      **Expected Result:** Switch should toggle correctly between ON and OFF states.
    `);

    await AllureReporter.step('Open User Settings modal', async () => {
      await profilePage.openUserSettingProfile();
    });

    await AllureReporter.step('Open Chat settings tab', async () => {
      await profilePage.openChatTab();
    });

    await AllureReporter.step('Turn ON Spelling switch', async () => {
      await profilePage.toggleSpelling(true);
      expect(await profilePage.isSpellingChecked()).toBe(true);
    });

    await AllureReporter.step('Turn OFF Spelling switch', async () => {
      await profilePage.toggleSpelling(false);
      expect(await profilePage.isSpellingChecked()).toBe(false);
    });

    await AllureReporter.step('Close User Settings modal', async () => {
      await profilePage.closeSettingsProfile();
    });
  });

  test('TC02: Type unaccented text, press Tab to show preview, select via Tab and send message', async ({
    page,
  }) => {
    const profilePage = new ProfilePage(page);
    const messagePage = new MessagePage(page);

    await AllureReporter.addDescription(`
      **Test Objective:**
      1. Type unaccented Vietnamese text (e.g. 'chao ban').
      2. Press Tab once -> preview recommendation appears above the composer.
      3. Press Tab again -> select the recommendation into input.
      4. Press Enter -> send the message successfully.
    `);

    await AllureReporter.step('Enable Spelling in User Settings', async () => {
      await profilePage.openUserSettingProfile();
      await profilePage.openChatTab();
      await profilePage.toggleSpelling(true);
      expect(await profilePage.isSpellingChecked()).toBe(true);
      await profilePage.closeSettingsProfile();
    });

    const input = messagePage['selector'].messageInput;
    await AllureReporter.step('Type unaccented text in message composer', async () => {
      await expect(input).toBeVisible({ timeout: 10000 });
      await input.click();
      await input.fill('chao ban');
      await page.waitForTimeout(5000);
      await expect(input).toContainText('chao ban');
    });

    await AllureReporter.step('Press Tab once: preview recommendation appears', async () => {
      await input.press('Tab');
      const recommendation = messagePage['selector'].spellingRecommendation;
      await expect(recommendation).toBeVisible({ timeout: 5000 });
      await expect(recommendation).toContainText(/chào bạn/i);
    });

    await AllureReporter.step('Press Tab again: select recommendation into composer', async () => {
      await input.press('Tab');
      const recommendation = messagePage['selector'].spellingRecommendation;
      await expect(recommendation).toBeHidden({ timeout: 5000 });
      await expect(input).toContainText(/chào bạn/i);
    });

    await AllureReporter.step('Send message with Enter and verify delivery', async () => {
      await input.press('Enter');
      const sentMessage = page.locator(`div[class*="text-theme-message"]`, {
        hasText: /chào bạn/i,
      });
      await expect(sentMessage.last()).toBeVisible({ timeout: 8000 });
    });
  });

  test('TC03: Type different unaccented phrase (xin chao), preview and select via Tab then send', async ({
    page,
  }) => {
    const profilePage = new ProfilePage(page);
    const messagePage = new MessagePage(page);

    await AllureReporter.addDescription(`
      **Test Objective:**
      1. Type unaccented text ('xin chao').
      2. Press Tab once -> preview recommendation appears with 'Xin chào'.
      3. Press Tab again -> select recommendation into input.
      4. Press Enter -> send message successfully.
    `);

    await AllureReporter.step('Ensure Spelling is ON in User Settings', async () => {
      await profilePage.openUserSettingProfile();
      await profilePage.openChatTab();
      await profilePage.toggleSpelling(true);
      await profilePage.closeSettingsProfile();
    });

    const input = messagePage['selector'].messageInput;
    await AllureReporter.step('Type unaccented text in composer', async () => {
      await expect(input).toBeVisible({ timeout: 10000 });
      await input.click();
      await input.fill('xin chao');
      await page.waitForTimeout(3000);
    });

    await AllureReporter.step('Press Tab to trigger preview recommendation', async () => {
      await input.press('Tab');
      const recommendation = messagePage['selector'].spellingRecommendation;
      await expect(recommendation).toBeVisible({ timeout: 5000 });
      await expect(recommendation).toContainText(/xin chào/i);
    });

    await AllureReporter.step('Press Tab again to select recommendation', async () => {
      await input.press('Tab');
      const recommendation = messagePage['selector'].spellingRecommendation;
      await expect(recommendation).toBeHidden({ timeout: 5000 });
      await expect(input).toContainText(/xin chào/i);
    });

    await AllureReporter.step('Send message with Enter and verify delivery', async () => {
      await input.press('Enter');
      const sentMessage = page.locator(`div[class*="text-theme-message"]`, {
        hasText: /xin chào/i,
      });
      await expect(sentMessage.last()).toBeVisible({ timeout: 8000 });
    });
  });

  test('TC04: Verify preview recommendation does not appear when Spelling is OFF', async ({
    page,
  }) => {
    const profilePage = new ProfilePage(page);
    const messagePage = new MessagePage(page);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when Spelling is OFF in settings, pressing Tab on unaccented text does NOT show any recommendation.
    `);

    await AllureReporter.step('Disable Spelling in User Settings', async () => {
      await profilePage.openUserSettingProfile();
      await profilePage.openChatTab();
      await profilePage.toggleSpelling(false);
      expect(await profilePage.isSpellingChecked()).toBe(false);
      await profilePage.closeSettingsProfile();
    });

    const input = messagePage['selector'].messageInput;
    await AllureReporter.step('Type unaccented text in message input', async () => {
      await expect(input).toBeVisible({ timeout: 10000 });
      await input.click();
      await input.fill('chao ban');
      await page.waitForTimeout(500);
    });

    await AllureReporter.step(
      'Press Tab and verify preview recommendation is NOT displayed',
      async () => {
        await input.press('Tab');
        const recommendation = messagePage['selector'].spellingRecommendation;
        await expect(recommendation).toBeHidden();
      }
    );
  });

  test('TC05: Spelling check does not interfere with normal message typing and sending', async ({
    page,
  }) => {
    const profilePage = new ProfilePage(page);
    const messagePage = new MessagePage(page);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that spelling check does NOT prevent or affect typing and sending messages normally.
    `);

    await AllureReporter.step('Ensure Spelling is ON in User Settings', async () => {
      await profilePage.openUserSettingProfile();
      await profilePage.openChatTab();
      await profilePage.toggleSpelling(true);
      await profilePage.closeSettingsProfile();
    });

    const input = messagePage['selector'].messageInput;
    const testMessage = `Test normal message ${Date.now()}`;

    await AllureReporter.step('Type and send message directly with Enter', async () => {
      await expect(input).toBeVisible({ timeout: 10000 });
      await input.click();
      await input.fill(testMessage);
      await input.press('Enter');
    });

    await AllureReporter.step('Verify message is sent to channel successfully', async () => {
      const sentMessage = page.locator(`div[class*="text-theme-message"]`, {
        hasText: testMessage,
      });
      await expect(sentMessage.last()).toBeVisible({ timeout: 8000 });
    });
  });
});
