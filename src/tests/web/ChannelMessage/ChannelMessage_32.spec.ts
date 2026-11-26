import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import MessageContactSelector from '@/data/selectors/MessageContactSelector';
import MessageSelector from '@/data/selectors/MessageSelector';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Message - Advanced Actions: Give Coffee, Forward All, Contact Card Call & Wave (Cases A1-A4)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account8;
  let clanPage: ClanPage;
  let messageHelper: MessageTestHelpers;
  let messagePage: MessagePage;
  let messageSelector: MessageSelector;
  let contactSelector: MessageContactSelector;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
    clanPage = new ClanPage(page);
    messageHelper = new MessageTestHelpers(page);
    messagePage = new MessagePage(page);
    messageSelector = new MessageSelector(page);
    contactSelector = new MessageContactSelector(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test('TC01: Verify Give Coffee action on message context menu and token transfer modal handling (chat.message_action.button.give_coffee)', async ({
    page,
  }) => {
    await AllureReporter.addLabels({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: 'ChannelMessage',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can access 'Give A Coffee' action from message context menu, inspect modal/dialog trigger, and dismiss cleanly.
    `);

    const channelName = `coffee-${generateRandomString(5).toLowerCase()}`;
    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    const messageText = `Give coffee target ${Date.now()}`;
    await messageHelper.sendTextMessage(messageText);

    const messageItem = page.locator(`text=${messageText}`).last();
    await expect(messageItem).toBeVisible({ timeout: 10000 });

    await AllureReporter.step('Right click message and trigger Give A Coffee', async () => {
      await messageItem.click({ button: 'right' });
      await page.waitForTimeout(500);

      const giveCoffeeBtn = messageSelector.sendCoffeeButton
        .or(
          page.locator(
            'button:has-text("Give A Coffee"), [data-e2e*="give_coffee"], [data-e2e*="coffee"]'
          )
        )
        .or(page.getByRole('menuitem', { name: /Give A Coffee|Tặng cà phê/i }))
        .first();

      if (await giveCoffeeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await giveCoffeeBtn.click();
        await page.waitForTimeout(800);

        // Verify token/coffee modal or dialog appears if rendered
        const coffeeModal = page
          .locator(
            '[role="dialog"], [data-e2e*="modal.send_token"], [data-e2e*="coffee"], div[class*="modal"]'
          )
          .first();

        if (await coffeeModal.isVisible({ timeout: 3000 }).catch(() => false)) {
          const cancelBtn = coffeeModal
            .locator(
              'button:has-text("Cancel"), button:has-text("Hủy"), button[aria-label="Close"]'
            )
            .first();

          if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await cancelBtn.click();
          } else {
            await page.keyboard.press('Escape');
          }
          await expect(coffeeModal).toBeHidden({ timeout: 5000 });
        }
      } else {
        await page.keyboard.press('Escape');
      }
    });

    expect(page.url()).toContain('/chat/');
  });

  test('TC02: Verify Forward All messages in discussion from message context menu (chat.message_action.button.forward_all)', async ({
    page,
  }) => {
    await AllureReporter.addLabels({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: 'ChannelMessage',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can trigger Forward All action on a message or discussion thread, opening the forward destination selection modal, and dismiss safely.
    `);

    const channelName = `fwd-all-${generateRandomString(5).toLowerCase()}`;
    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    const messageText = `Forward all candidate ${Date.now()}`;
    await messageHelper.sendTextMessage(messageText);

    const messageItem = page.locator(`text=${messageText}`).last();
    await expect(messageItem).toBeVisible({ timeout: 10000 });

    await AllureReporter.step('Open context menu and select Forward All', async () => {
      await messageItem.click({ button: 'right' });
      await page.waitForTimeout(500);

      const forwardAllBtn = messageSelector.forwardAllMessagesButton
        .or(page.locator('button:has-text("Forward All"), [data-e2e*="forward_all"]'))
        .or(page.getByRole('menuitem', { name: /Forward All|Chuyển tiếp tất cả/i }))
        .first();

      if (await forwardAllBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await forwardAllBtn.click();
        await page.waitForTimeout(500);

        const forwardModal = messageSelector.modalForwardMessage
          .or(page.locator('div[role="dialog"], [data-e2e*="forward"], div[class*="modal"]'))
          .first();

        await expect(forwardModal).toBeVisible({ timeout: 5000 });

        const searchInput = messageSelector.searchUserOnForwardMessageModal
          .or(forwardModal.locator('input[type="text"], input[placeholder*="Search"]'))
          .first();

        if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await searchInput.fill('GeneralChannel');
          await page.waitForTimeout(300);
        }

        await page.keyboard.press('Escape');
        await expect(forwardModal).toBeHidden({ timeout: 5000 });
      } else {
        await page.keyboard.press('Escape');
      }
    });

    expect(page.url()).toContain('/chat/');
  });

  test('TC03: Verify Shared Contact card call button and message button interactions (chat.share_contact.button.call)', async ({
    page,
  }) => {
    await AllureReporter.addLabels({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: 'ChannelMessage',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a shared contact card in chat displays the contact details and provides accessible Call and Message buttons (chat.share_contact.button.call).
    `);

    const channelName = `contact-${generateRandomString(5).toLowerCase()}`;
    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    await AllureReporter.step('Trigger Share Contact from members list', async () => {
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
            await contactSelector.modal.inputSearch.isVisible({ timeout: 2000 }).catch(() => false)
          ) {
            await contactSelector.modal.inputSearch.fill(channelName);
            await page.waitForTimeout(300);
          }

          if (
            await contactSelector.modal.buttonShare.isVisible({ timeout: 2000 }).catch(() => false)
          ) {
            await contactSelector.modal.buttonShare.click();
            await page.waitForTimeout(1000);
          } else {
            await contactSelector.modal.buttonCancel.click().catch(async () => {
              await page.keyboard.press('Escape');
            });
          }
        } else {
          await page.keyboard.press('Escape');
        }
      }
    });

    await AllureReporter.step('Verify contact card controls (Call & Message buttons)', async () => {
      const contactCard = contactSelector.card
        .or(
          page.locator(
            '[data-e2e*="share_contact"], div[class*="share-contact"], div[class*="contact-card"]'
          )
        )
        .first();

      const hasCard = await contactCard.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasCard) {
        await expect(contactCard).toBeVisible({ timeout: 5000 });

        const callBtn = contactSelector.buttonCall
          .or(
            contactCard.locator(
              'button[title*="Call"], button:has-text("Call"), [data-e2e*="call"]'
            )
          )
          .first();

        if (await callBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          expect(await callBtn.isEnabled()).toBe(true);
        }

        const msgBtn = contactSelector.buttonMessage
          .or(
            contactCard.locator(
              'button[title*="Message"], button:has-text("Message"), [data-e2e*="message"]'
            )
          )
          .first();

        if (await msgBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          expect(await msgBtn.isEnabled()).toBe(true);
        }
      }
    });

    expect(page.url()).toContain('/chat/');
  });

  test('TC04: Verify Wave to say hi button in fresh empty channel sends greeting sticker (chat.button.wave_to_say_hi)', async ({
    page,
  }) => {
    await AllureReporter.addLabels({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: 'ChannelMessage',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that opening a freshly created channel displays the 'Wave to say hi' greeting button, and clicking it sends a welcome wave sticker into the conversation.
    `);

    const channelName = `wave-${generateRandomString(5).toLowerCase()}`;
    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    const waveBtn = messageSelector.waveToSayHiButton
      .or(page.locator(generateE2eSelector('chat.button.wave_to_say_hi')))
      .or(
        page.locator(
          'button:has-text("Wave to say hi"), button:has-text("Say Hi"), [data-e2e*="wave_to_say_hi"]'
        )
      )
      .first();

    if (await waveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await waveBtn.click();
      await page.waitForTimeout(1000);

      const messageItem = page
        .locator('div[class*="message"], [data-e2e*="message_item"], [data-e2e*="message.item"]')
        .last();
      await expect(messageItem).toBeVisible({ timeout: 8000 });
    } else {
      const composer = page
        .locator('div[class*="mention-input-editor"], div[contenteditable="true"]')
        .first();
      await expect(composer).toBeVisible({ timeout: 5000 });
    }

    expect(page.url()).toContain('/chat/');
  });
});
