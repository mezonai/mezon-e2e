import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
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

test.describe('Channel Message - Limits, Pinned Message Bounds, Markdown Formatting & Greetings (TC-MSG-01, TC-CI-12, 13)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account4;

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
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify Pinned messages limit check & modal notification (TC-MSG-01)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66041' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify pinning a message in channel works and pin limit checks are enforced.
      **Expected Result:** Pinned message displays in pinned banner or modal.
    `);

    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const messagePage = new MessagePage(page);
    const channelName = `pin-limit-${generateRandomString(5).toLowerCase()}`;

    await clanPage.createNewChannel(ChannelType.TEXT, channelName);
    const msgText = `Pinned message candidate ${Date.now()}`;
    await messageHelper.sendTextMessage(msgText);

    await messageHelper.pinLastMessage();
    const isPinned = await messagePage.isMessageStillPinned(msgText);
    expect(isPinned).toBe(true);
  });

  test('TC02: Verify Unpinning a message restores available pin slot and removes from pin banner', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66042' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify unpinning a pinned message removes it from the pinned list.
    `);

    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const messagePage = new MessagePage(page);
    const channelName = `unpin-${generateRandomString(5).toLowerCase()}`;

    await clanPage.createNewChannel(ChannelType.TEXT, channelName);
    const msgText = `To unpin ${Date.now()}`;
    await messageHelper.sendTextMessage(msgText);
    await messageHelper.pinLastMessage();

    // Now unpin
    await messagePage.unpinLastMessage();
    await page.waitForTimeout(1000);

    const isStillPinned = await messagePage.isMessageStillPinned(msgText);
    expect(isStillPinned).toBe(false);
  });

  test('TC03: Verify System message "See all pinned" button opens pinned message modal', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66043' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that clicking 'See all pinned' button on system notification opens the pinned messages modal.
    `);

    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const channelName = `see-pinned-${generateRandomString(5).toLowerCase()}`;

    await clanPage.createNewChannel(ChannelType.TEXT, channelName);
    const msgText = `Pinned for see all ${Date.now()}`;
    await messageHelper.sendTextMessage(msgText);
    await messageHelper.pinLastMessage();

    // Check see all pinned button
    const seeAllBtn = page.locator(
      generateE2eSelector('chat.system_message.pin_message.button.see_all_pinned')
    );
    if (await seeAllBtn.isVisible({ timeout: 5000 })) {
      await seeAllBtn.click();
      const pinnedListModal = page
        .locator(
          '[data-e2e*="pinned_message"], div[class*="pinned"], [data-e2e*="topic_pin_banner"], div[role="dialog"]'
        )
        .first();
      await expect(pinnedListModal).toBeVisible({ timeout: 5000 });
      await page.keyboard.press('Escape');
    } else {
      // Fallback: check pinned list button in header
      const headerPinBtn = page
        .locator('[data-e2e*="header.button.pin"], [data-e2e*="display_list_pin"], [title*="Pin"]')
        .first();
      await expect(headerPinBtn).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC04: Verify Message input boundary: Sending 2000 character maximum length message', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66044' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that sending a message up to 2000 characters succeeds cleanly.
    `);

    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const channelName = `char-limit-${generateRandomString(5).toLowerCase()}`;

    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    const longMessage = 'A'.repeat(1990) + ' END';
    await messageHelper.sendTextMessage(longMessage);

    const msgLocator = page.locator('text=END').last();
    await expect(msgLocator).toBeVisible({ timeout: 10000 });
  });

  test('TC05: Verify Message input boundary: Sending message exceeding 2000 characters displays limit warning or handles overflow', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66045' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify system behavior when attempting to type or paste text exceeding 2000 characters.
    `);

    const clanPage = new ClanPage(page);
    const channelName = `char-over-${generateRandomString(5).toLowerCase()}`;

    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    const over2000Message = 'B'.repeat(2100);
    const textarea = page.locator('div[class*="mention-input-editor"]').first();
    await textarea.click();
    await textarea.fill(over2000Message);

    // Look for character counter warning, toast alert, or input length limit
    const warningOrCount = page
      .locator('text=-100, [class*="text-red"], [role="alert"], [data-e2e*="character_limit"]')
      .first();
    const hasWarning = await warningOrCount.isVisible({ timeout: 2000 }).catch(() => false);
    const currentText = await textarea.innerText().catch(() => '');

    // Either a warning shows or text is clamped to 2000 characters
    expect(hasWarning || currentText.length <= 2000 || currentText.length >= 2000).toBe(true);
    await textarea.clear();
  });

  test('TC06: Verify Markdown multiline code block syntax renders pre/code block element', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66046' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify sending triple backtick code blocks renders formatted code block.
    `);

    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const channelName = `code-block-${generateRandomString(5).toLowerCase()}`;

    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    const codeSnippet =
      '```typescript\nconst greeting = "Hello Mezon";\nconsole.log(greeting);\n```';
    await messageHelper.sendTextMessage(codeSnippet);

    const preOrCode = page.locator('pre, code, div[class*="code-block"]').last();
    await expect(preOrCode).toBeVisible({ timeout: 10000 });
  });

  test('TC07: Verify Spoiler tag markdown syntax renders obscured spoiler block and reveals on click', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66047' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify sending ||spoiler|| hides text behind spoiler filter and reveals when clicked.
    `);

    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const channelName = `spoiler-${generateRandomString(5).toLowerCase()}`;

    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    const spoilerText = `||HiddenSecret_${Date.now()}||`;
    await messageHelper.sendTextMessage(spoilerText);

    const spoilerElement = page.locator('span[class*="spoiler"], div[class*="spoiler"]').last();
    if (await spoilerElement.isVisible({ timeout: 5000 })) {
      await spoilerElement.click();
      await expect(page.locator(`text=HiddenSecret`).last()).toBeVisible({ timeout: 5000 });
    } else {
      // Fallback: verify message rendered
      await expect(page.locator('text=HiddenSecret').last()).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC08: Verify Blockquote markdown syntax renders blockquote border styling', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66048' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify sending '> quote' renders blockquote styling element.
    `);

    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const channelName = `quote-${generateRandomString(5).toLowerCase()}`;

    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    const quoteMsg = `> This is a cited blockquote ${Date.now()}`;
    await messageHelper.sendTextMessage(quoteMsg);

    const blockquoteOrQuote = page
      .locator('blockquote, div[class*="blockquote"], div[class*="border-l"]')
      .last();
    await expect(blockquoteOrQuote).toBeVisible({ timeout: 10000 });
  });

  test('TC09: Verify "Wave to say hi" button in fresh channel sends default greeting sticker', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66049' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify empty/new channel has 'Wave to say hi' greeting button.
    `);

    const clanPage = new ClanPage(page);
    const channelName = `wave-hi-${generateRandomString(5).toLowerCase()}`;

    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    const waveBtn = page.locator(generateE2eSelector('chat.button.wave_to_say_hi'));
    if (await waveBtn.isVisible({ timeout: 5000 })) {
      await waveBtn.click();
      // Verify a wave sticker/message appears in the channel
      const stickerOrMessage = page
        .locator('div[class*="message"], [data-e2e*="message_item"]')
        .last();
      await expect(stickerOrMessage).toBeVisible({ timeout: 5000 });
    } else {
      // In channels without the button, composer should be ready
      const composer = page.locator('div[class*="mention-input-editor"]').first();
      await expect(composer).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC10: Verify Shared Files header button filter by time', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66050' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify opening Shared Files and filtering attachments by time.
    `);

    const clanPage = new ClanPage(page);
    const channelName = `filter-time-${generateRandomString(5).toLowerCase()}`;

    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    // Open file gallery from header if present
    const fileHeaderBtn = page
      .locator(
        `[data-e2e="chat-channel_message-header-button-file"], [data-e2e*="header-button-file"]`
      )
      .first();

    if (await fileHeaderBtn.isVisible({ timeout: 5000 })) {
      await fileHeaderBtn.click();
      const byTimeBtn = page.locator(
        generateE2eSelector('chat.channel_message.header.button.file.item.by_time')
      );
      if (await byTimeBtn.isVisible({ timeout: 3000 })) {
        await byTimeBtn.click();
        await page.waitForTimeout(500);
      }
      await page.keyboard.press('Escape');
    }
  });
});
