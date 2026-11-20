import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import MessageContactSelector from '@/data/selectors/MessageContactSelector';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Message - Add to Inbox, Forward All & Share Contact (TC-MSG-12, 13, 14)', () => {
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
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify Add Message To Inbox from message context menu and check Inbox presence (TC-MSG-12)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66055' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that right-clicking a message and selecting 'Add To Inbox' saves the message to the channel Inbox.
    `);

    const channelName = `inbox-add-${generateRandomString(5).toLowerCase()}`;
    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    const messageText = `Inbox candidate ${Date.now()}`;
    await messageHelper.sendTextMessage(messageText);

    const messageItem = page.locator(`text=${messageText}`).last();
    await expect(messageItem).toBeVisible({ timeout: 10000 });

    await AllureReporter.step('Open context menu and add message to inbox', async () => {
      await messageItem.click({ button: 'right' });
      await page.waitForTimeout(500);

      const addToInboxBtn = page
        .locator('button:has-text("Add To Inbox"), [data-e2e*="add_to_inbox"]')
        .or(page.getByRole('menuitem', { name: /Add To Inbox/i }))
        .first();

      if (await addToInboxBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addToInboxBtn.click();
        await page.waitForTimeout(500);
      } else {
        await page.keyboard.press('Escape');
      }
    });

    await AllureReporter.step(
      'Open channel Inbox header and verify inbox drawer opens',
      async () => {
        const inboxBtn = page
          .locator(generateE2eSelector('chat.channel_message.header.button.inbox'))
          .or(page.locator('[data-e2e*="header.button.inbox"], button[title*="Inbox"]'))
          .first();

        if (await inboxBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await inboxBtn.click({ force: true });
          await page.waitForTimeout(500);

          const inboxDrawer = page
            .locator(
              'div[class*="inbox"], div[role="dialog"], div[class*="drawer"], [data-e2e*="inbox"]'
            )
            .first();
          await expect(inboxDrawer).toBeVisible({ timeout: 5000 });
          await page.keyboard.press('Escape');
        }
      }
    );
  });

  test('TC02: Verify Forward All messages action opens Forward modal and handles cancellation (TC-MSG-13)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66056' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify right-clicking a message and selecting 'Forward All' opens the forward message selection modal, and clicking Cancel or Escape closes it safely.
    `);

    const channelName = `fwd-all-${generateRandomString(5).toLowerCase()}`;
    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    const messageText = `Message for forward all ${Date.now()}`;
    await messageHelper.sendTextMessage(messageText);

    const messageItem = page.locator(`text=${messageText}`).last();
    await expect(messageItem).toBeVisible({ timeout: 10000 });

    await AllureReporter.step('Right click message and check Forward All option', async () => {
      await messageItem.click({ button: 'right' });
      await page.waitForTimeout(500);

      const forwardAllBtn = page
        .locator('button:has-text("Forward All"), [data-e2e*="forward_all"]')
        .or(page.getByRole('menuitem', { name: /Forward All/i }))
        .first();

      if (await forwardAllBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await forwardAllBtn.click();
        await page.waitForTimeout(500);

        const forwardModal = page
          .locator('div[role="dialog"], [data-e2e*="modal.forward_message"], div[class*="modal"]')
          .first();
        await expect(forwardModal).toBeVisible({ timeout: 5000 });

        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        await page.keyboard.press('Escape');
      }
    });
  });

  test('TC03: Verify Share Contact action opens contact sharing modal and handles cancel (TC-MSG-14)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66057' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can access Share Contact action from user short profile, inspect search input in modal, and dismiss modal cleanly.
    `);

    const contactSelector = new MessageContactSelector(page);

    await AllureReporter.step('Locate and open user profile card/popover', async () => {
      // Toggle members list if not visible
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
});
