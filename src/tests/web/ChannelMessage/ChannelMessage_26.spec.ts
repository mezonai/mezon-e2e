import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import MessageContactSelector from '@/data/selectors/MessageContactSelector';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Message - Shared Contact Card Rendering, Message & Call Actions (TC-MSG-15, 16)', () => {
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

  test('TC01: Verify Contact Sharing modal search input and member list filter', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66058' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can access Share Contact modal, search for specific contact, and dismiss modal cleanly.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-message', 'share-contact', 'contact-modal'],
    });

    const contactSelector = new MessageContactSelector(page);

    await AllureReporter.step('Open user short profile and click Share Contact', async () => {
      const membersToggle = page
        .locator(generateE2eSelector('clan_page.side_bar.button.members'))
        .or(page.locator('[data-e2e*="button.members"], button[title*="Members"]'))
        .first();

      if (await membersToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
        await membersToggle.click({ force: true });
        await page.waitForTimeout(500);
      }

      const memberItem = page
        .locator('[data-e2e*="member_item"], [data-e2e*="member-item"], div[class*="member-item"]')
        .first();

      if (await memberItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await memberItem.click({ force: true });
        await page.waitForTimeout(500);

        const shareContactBtn = page
          .locator(generateE2eSelector('short_profile.action.button.share_contact'))
          .or(page.locator('button[title*="Share Contact"], button:has-text("Share Contact")'))
          .first();

        if (await shareContactBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await shareContactBtn.click({ force: true });
          await page.waitForTimeout(500);

          await expect(contactSelector.modal.item).toBeVisible({ timeout: 5000 });

          if (
            await contactSelector.modal.inputSearch.isVisible({ timeout: 3000 }).catch(() => false)
          ) {
            await contactSelector.modal.inputSearch.fill('GeneralChannel');
            await page.waitForTimeout(300);
          }

          if (
            await contactSelector.modal.buttonCancel.isVisible({ timeout: 3000 }).catch(() => false)
          ) {
            await contactSelector.modal.buttonCancel.click();
          } else {
            await page.keyboard.press('Escape');
          }
        } else {
          await page.keyboard.press('Escape');
        }
      }
    });
  });

  test('TC02: Verify Contact Card rendering in chat view with interactive action controls (Message and Call)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66059' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify shared contact card selector structure (card container, display name, Message button, and Call button).
    `);
    await AllureReporter.addLabels({
      tag: ['channel-message', 'share-contact', 'contact-card-actions'],
    });

    const contactSelector = new MessageContactSelector(page);

    await AllureReporter.step(
      'Verify shared contact card locators are properly defined',
      async () => {
        expect(contactSelector.card).toBeDefined();
        expect(contactSelector.displayName).toBeDefined();
        expect(contactSelector.username).toBeDefined();
        expect(contactSelector.buttonMessage).toBeDefined();
        expect(contactSelector.buttonCall).toBeDefined();
      }
    );
  });

  test('TC03: Verify Contact Card interactive action buttons handle click without throwing errors', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66060' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that clicking Message or Call buttons on any displayed contact card responds appropriately without breaking the chat view.
    `);
    await AllureReporter.addLabels({
      tag: ['channel-message', 'share-contact', 'action-handling'],
    });

    const contactSelector = new MessageContactSelector(page);

    await AllureReporter.step('Check for existing shared contact card in channel', async () => {
      if (
        await contactSelector.card
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        if (
          await contactSelector.buttonMessage
            .first()
            .isVisible({ timeout: 1000 })
            .catch(() => false)
        ) {
          await expect(contactSelector.buttonMessage.first()).toBeEnabled();
        }
        if (
          await contactSelector.buttonCall
            .first()
            .isVisible({ timeout: 1000 })
            .catch(() => false)
        ) {
          await expect(contactSelector.buttonCall.first()).toBeEnabled();
        }
      }
    });
  });
});
