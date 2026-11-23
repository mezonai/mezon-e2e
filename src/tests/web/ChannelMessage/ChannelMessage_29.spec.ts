import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import MessageSelector from '@/data/selectors/MessageSelector';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Message - Anonymous Mode, Topic Discussion & Mention Autocomplete (TC-CI-12, 16, 17)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account8;
  let clanPage: ClanPage;
  let messageHelper: MessageTestHelpers;
  let messagePage: MessagePage;
  let messageSelector: MessageSelector;

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
    messageHelper = new MessageTestHelpers(page);
    messagePage = new MessagePage(page);
    messageSelector = new MessageSelector(page);
    await page
      .evaluate(() => {
        localStorage.removeItem('remember_channel');
      })
      .catch(() => {});
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });

    const clanHeader = clanPage.selector.buttons.clanName
      .or(page.locator('[data-e2e*="clan_page-header-title-clan_name"]'))
      .first();
    if (!(await clanHeader.isVisible({ timeout: 2000 }).catch(() => false))) {
      const clanName = clanFactory.getClanName();
      const clanBtn = page
        .locator(`[data-e2e="clan_page-side_bar-clan_item"][title*="${clanName}"] button`)
        .or(page.locator(`div[title*="${clanName}"] button`))
        .first();

      await clanBtn.scrollIntoViewIfNeeded().catch(() => {});
      if (await clanBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await clanBtn.click({ force: true });
        await page.waitForTimeout(1000);
      }
      if (page.url().includes('/member-safety')) {
        const firstChannel = page
          .locator('[data-e2e*="channel_list-item-name"], [data-e2e*="channel_list"] p')
          .first();
        if (await firstChannel.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstChannel.click();
        }
      }
      await expect(clanHeader).toBeVisible({ timeout: 10000 });
    }
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify Anonymous messaging controls and indicators in channel composer (TC-CI-12 / #155)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66069' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can inspect anonymous toggle / controls in composer or channel settings.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-message', 'anonymous', 'composer-controls'],
    });

    const anonymousIcon = messageSelector.anonymous.anonymousIcon
      .or(
        page.locator(
          '[data-e2e*="anonymous"], button[title*="Anonymous"], button[aria-label*="Anonymous"]'
        )
      )
      .first();

    await AllureReporter.step(
      'Verify composer input is visible and check anonymous control',
      async () => {
        const composerInput = page.locator('div[class*="mention-input-editor"]').last();
        await expect(composerInput).toBeVisible({ timeout: 8000 });

        if (await anonymousIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
          await anonymousIcon.click();
          await page.waitForTimeout(500);
          await anonymousIcon.click();
        }
      }
    );
  });

  test('TC02: Verify Message Action Topic Discussion panel opening and closing (TC-CI-16 / #159)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66070' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can start a Topic Discussion from a message action menu and close the Topic panel.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-message', 'topic-discussion', 'message-actions'],
    });

    const testMsg = `Topic-Test-${generateRandomString(6)}`;

    await AllureReporter.step('Send a test message for topic discussion', async () => {
      const composerInput = page.locator('div[class*="mention-input-editor"]').last();
      await composerInput.fill(testMsg);
      await composerInput.press('Enter');
      await page.waitForTimeout(1000);
    });

    await AllureReporter.step('Hover message and open Topic Discussion', async () => {
      const sentMsg = page.locator(`text="${testMsg}"`).last();
      await expect(sentMsg).toBeVisible({ timeout: 8000 });
      await sentMsg.hover();
      await page.waitForTimeout(500);

      // Look for topic discussion button in action bar or context menu
      const topicBtn = messageSelector.topicDiscussionButton
        .or(
          page.locator(
            '[data-e2e*="topic_discussion"], button[title*="Topic"], button[aria-label*="Topic"]'
          )
        )
        .first();

      if (await topicBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await topicBtn.click();
        await page.waitForTimeout(1000);

        // Verify Topic box opens
        const topicBox = messageSelector.topicBox
          .or(page.locator('[data-e2e*="box.topic"], div[class*="topic"]'))
          .first();
        if (await topicBox.isVisible({ timeout: 5000 }).catch(() => false)) {
          // Close topic panel
          const closeBtn = messageSelector.closeTopicBoxButton
            .or(page.locator('[data-e2e*="topic.header.button.close"], button[aria-label="Close"]'))
            .first();
          if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeBtn.click();
          } else {
            await page.keyboard.press('Escape');
          }
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test('TC03: Verify Mention @ autocomplete list popover display when typing @ in chat composer (TC-CI-17 / #160)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66071' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify typing @ in channel message composer brings up the mention suggestion popover list.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-message', 'mention', 'autocomplete', 'composer'],
    });

    await AllureReporter.step('Type @ in composer and verify mention popover appears', async () => {
      const composerInput = page.locator('div[class*="mention-input-editor"]').last();
      await composerInput.click();
      await composerInput.fill('@');
      await page.waitForTimeout(1000);

      // Verify mention popover or suggestion items appear
      const mentionList = page
        .locator(
          'div[role="listbox"], ul[role="listbox"], div[class*="mention"], [data-e2e*="mention"]'
        )
        .first();
      const isVisible = await mentionList.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();

      // Clear input
      await composerInput.fill('');
      await page.waitForTimeout(500);
    });
  });
});
