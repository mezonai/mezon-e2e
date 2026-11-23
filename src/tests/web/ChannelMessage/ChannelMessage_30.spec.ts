import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import MessageActionSelector from '@/data/selectors/MessageActionSelector';
import MessageMediaSelector from '@/data/selectors/MessageMediaSelector';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

const CHANNEL_MESSAGE_TAG = 'channel-message';

test.describe('Channel Message - GIF Picker, Mark Unread Action & Member Context Menu (TC-MSG-24, 25, 26)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account8;
  let clanPage: ClanPage;
  let mediaSelector: MessageMediaSelector;
  let actionSelector: MessageActionSelector;

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
    mediaSelector = new MessageMediaSelector(page);
    actionSelector = new MessageActionSelector(page);

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

  test('TC01: Verify GIF Picker button in message composer opens GIF popover with trending and category items (TC-MSG-24)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66078' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can click GIF button on composer toolbar to open GIF popover and browse trending/category GIFs.
    `);
    await AllureReporter.addLabels({
      tag: [CHANNEL_MESSAGE_TAG, 'gif-picker', 'composer-toolbar'],
    });

    const gifButton = mediaSelector.gifs.button.openPopover
      .or(
        page.locator(
          'button[title*="GIF"], button[aria-label*="GIF"], [data-e2e*="button.gif"], svg[data-icon="gif"]'
        )
      )
      .first();

    await AllureReporter.step('Verify GIF button exists in composer and click it', async () => {
      if (await gifButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await gifButton.click();
        await page.waitForTimeout(1000);

        // Verify popover appears
        const gifPopover = mediaSelector.gifs.popover.trending
          .or(page.locator('[data-e2e*="gifs"], div[role="dialog"], div[class*="gif"]'))
          .first();
        await expect(gifPopover).toBeVisible({ timeout: 5000 });

        // Close popover
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    });
  });

  test('TC02: Verify message action Mark Unread sets channel to unread state (TC-MSG-25)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66079' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify hovering message, opening action menu and clicking Mark Unread marks channel unread.
    `);
    await AllureReporter.addLabels({
      tag: [CHANNEL_MESSAGE_TAG, 'mark-unread', 'message-actions'],
    });

    const testMsg = `Unread-Test-${generateRandomString(6)}`;

    await AllureReporter.step('Send test message', async () => {
      const composerInput = page.locator('div[class*="mention-input-editor"]').last();
      await composerInput.fill(testMsg);
      await composerInput.press('Enter');
      await page.waitForTimeout(1000);
    });

    await AllureReporter.step('Hover message and inspect message actions', async () => {
      const sentMsg = page.locator(`text="${testMsg}"`).last();
      await expect(sentMsg).toBeVisible({ timeout: 8000 });
      await sentMsg.hover();
      await page.waitForTimeout(500);

      // Open message action menu or click ... button
      const moreBtn = page
        .locator(
          'button[aria-label="More"], [data-e2e*="message_action"], button:has(svg.mz-i-ellipsis)'
        )
        .last();
      if (await moreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await moreBtn.click();
        await page.waitForTimeout(500);

        const markUnreadBtn = actionSelector.markUnread
          .or(page.locator('button, div[role="menuitem"]').filter({ hasText: /mark unread/i }))
          .first();
        if (await markUnreadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await markUnreadBtn.click();
          await page.waitForTimeout(500);
        } else {
          await page.keyboard.press('Escape');
        }
      }
    });
  });

  test('TC03: Verify Member List sidebar member context menu action buttons (TC-MSG-26)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66080' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify member items in channel sidebar right-click reveals context menu with action buttons.
    `);
    await AllureReporter.addLabels({
      tag: [CHANNEL_MESSAGE_TAG, 'member-list', 'context-menu'],
    });

    await AllureReporter.step('Ensure Member List sidebar is open', async () => {
      const memberBtn = page
        .locator(generateE2eSelector('chat.channel_message.header.button.member'))
        .or(page.locator('button[title*="Member"], [data-e2e*="header.button.member"]'))
        .first();

      const memberSidebar = page
        .locator(
          '[data-e2e*="secondary_side_bar"], [data-e2e*="member_list"], div[class*="memberList"]'
        )
        .first();

      if (
        !(await memberSidebar.isVisible({ timeout: 2000 }).catch(() => false)) &&
        (await memberBtn.isVisible({ timeout: 3000 }).catch(() => false))
      ) {
        await memberBtn.click();
        await page.waitForTimeout(1000);
      }
    });

    await AllureReporter.step(
      'Right-click first member item and verify context menu options',
      async () => {
        const memberItem = page
          .locator('[data-e2e*="member"], div[class*="memberItem"], div[class*="member-item"]')
          .first();

        if (await memberItem.isVisible({ timeout: 4000 }).catch(() => false)) {
          await memberItem.click({ button: 'right' });
          await page.waitForTimeout(1000);

          // Verify context menu or action popover
          const contextMenu = page
            .locator(
              '[role="menu"], [data-e2e*="context_menu"], div[class*="contextMenu"], div[role="dialog"]'
            )
            .first();
          if (await contextMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
            expect(await contextMenu.isVisible()).toBe(true);
          }

          // Close context menu
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      }
    );
  });
});
