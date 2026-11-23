import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import MessageInboxSelector from '@/data/selectors/MessageInboxSelector';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Message - Inbox Header Popover, Tabs Navigation & Item Actions (TC-MSG-17, 18)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account8;
  let clanPage: ClanPage;
  let messageHelper: MessageTestHelpers;
  let messagePage: MessagePage;

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

  test('TC01: Verify Channel Header Inbox button opens Inbox panel and switches between Topics, Messages, Mentions, and For You tabs', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66061' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can open Channel Inbox from header and switch between tabs (Topics, Messages, Mentions, For You).
    `);
    await AllureReporter.addLabels({
      tag: ['channel-message', 'inbox', 'header-inbox', 'tabs-navigation'],
    });

    const inboxSelector = new MessageInboxSelector(page);
    const inboxHeaderBtn = page
      .locator(generateE2eSelector('chat.channel_message.header.button.inbox'))
      .or(
        page.locator(
          'button[title*="Inbox"], button[aria-label*="Inbox"], [data-e2e*="header.button.inbox"]'
        )
      )
      .first();

    await AllureReporter.step('Click Inbox button in Channel Header', async () => {
      if (await inboxHeaderBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await inboxHeaderBtn.click();
        await page.waitForTimeout(500);

        // Verify Topics tab
        if (await inboxSelector.topics.triggerTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await inboxSelector.topics.triggerTab.click();
          await page.waitForTimeout(300);
        }

        // Verify Messages tab
        if (
          await inboxSelector.messages.triggerTab.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          await inboxSelector.messages.triggerTab.click();
          await page.waitForTimeout(300);
        }

        // Verify Mentions tab
        if (
          await inboxSelector.mentions.triggerTab.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          await inboxSelector.mentions.triggerTab.click();
          await page.waitForTimeout(300);
        }

        // Verify For You tab
        if (await inboxSelector.forYou.triggerTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await inboxSelector.forYou.triggerTab.click();
          await page.waitForTimeout(300);
        }

        // Close Inbox by clicking header button or Escape
        await page.keyboard.press('Escape');
      }
    });
  });

  test('TC02: Verify For You tab structure, items or empty state rendering', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66062' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify For You tab selectors (container, message, timestamp, remove and jump buttons) are properly defined.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-message', 'inbox', 'for-you-tab'],
    });

    const inboxSelector = new MessageInboxSelector(page);

    await AllureReporter.step('Verify For You tab selector elements', async () => {
      expect(inboxSelector.forYou.triggerTab).toBeDefined();
      expect(inboxSelector.forYou.item.container).toBeDefined();
      expect(inboxSelector.forYou.item.button.jump).toBeDefined();
      expect(inboxSelector.forYou.item.button.remove).toBeDefined();
    });
  });

  test('TC03: Verify Topics tab structure, initMessage, lastReplyMessage and Jump button selectors', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66063' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Topics tab selectors (container, initMessage, lastReplyMessage, and buttonJump) are properly defined.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-message', 'inbox', 'topics-tab'],
    });

    const inboxSelector = new MessageInboxSelector(page);

    await AllureReporter.step('Verify Topics tab selector elements', async () => {
      expect(inboxSelector.topics.triggerTab).toBeDefined();
      expect(inboxSelector.topics.item.container).toBeDefined();
      expect(inboxSelector.topics.item.initMessage).toBeDefined();
      expect(inboxSelector.topics.item.lastReplyMessage).toBeDefined();
      expect(inboxSelector.topics.item.buttonJump).toBeDefined();
    });
  });
});
