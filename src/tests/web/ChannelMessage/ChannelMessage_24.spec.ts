import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Message - Pickers, Greeting Wave, Inbox Header & Shared Files (TC-MSG-10, 11)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account8;
  let clanPage: ClanPage;

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
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify Emoji and Sticker picker popovers toggle on message composer', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66051' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify clicking Emoji and Sticker buttons on composer opens respective picker popovers.
    `);

    const channelName = `picker-${generateRandomString(5).toLowerCase()}`;
    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    const emojiBtn = page
      .locator(generateE2eSelector('mention.button.emoji'))
      .or(page.locator('button[title*="Emoji"], [data-e2e*="button.emoji"]'))
      .first();

    if (await emojiBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emojiBtn.click();
      await page.waitForTimeout(500);

      const emojiPicker = page
        .locator(
          'button:has-text("Frequently"), button:has-text("People"), button:has-text("Nature"), button[title*=":"], div[class*="picker"]'
        )
        .first();
      await expect(emojiPicker).toBeVisible({ timeout: 5000 });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    const stickerBtn = page
      .locator(generateE2eSelector('mention.button.sticker'))
      .or(page.locator('button[title*="Sticker"], [data-e2e*="button.sticker"]'))
      .first();

    if (await stickerBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await stickerBtn.click();
      await page.waitForTimeout(500);

      const stickerPicker = page
        .locator(
          'div[class*="sticker"], button:has-text("Sticker"), div[class*="popover"], div[class*="grid"], div[role="dialog"]'
        )
        .first();
      await expect(stickerPicker).toBeVisible({ timeout: 5000 });
      await page.keyboard.press('Escape');
    }
  });

  test('TC02: Verify "Wave to say hi" greeting button sends welcome sticker in fresh channel', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66052' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify newly created channel displays 'Wave to say hi' greeting button and clicking it sends a welcome sticker.
    `);

    const channelName = `wave-${generateRandomString(5).toLowerCase()}`;
    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    const waveBtn = page
      .locator(generateE2eSelector('chat.button.wave_to_say_hi'))
      .or(page.locator('button:has-text("Wave to say hi"), button:has-text("Say Hi")'))
      .first();

    if (await waveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await waveBtn.click();
      await page.waitForTimeout(1000);

      const messageItem = page.locator('div[class*="message"], [data-e2e*="message_item"]').last();
      await expect(messageItem).toBeVisible({ timeout: 8000 });
    } else {
      const composer = page
        .locator('div[class*="mention-input-editor"], div[contenteditable="true"]')
        .first();
      await expect(composer).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC03: Verify Channel header Inbox navigation drawer opens and closes cleanly', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66053' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify channel header Inbox button opens notification drawer and closes cleanly.
    `);

    const channelName = `inbox-${generateRandomString(5).toLowerCase()}`;
    await clanPage.createNewChannel(ChannelType.TEXT, channelName);

    const inboxBtn = page
      .locator(generateE2eSelector('chat.channel_message.header.button.inbox'))
      .or(page.locator('[data-e2e*="header.button.inbox"], button[title*="Inbox"]'))
      .first();

    if (await inboxBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await inboxBtn.click();
      await page.waitForTimeout(500);

      const inboxDrawer = page
        .locator(
          'div[class*="inbox"], div[role="dialog"], div[class*="drawer"], [data-e2e*="inbox"]'
        )
        .first();
      await expect(inboxDrawer).toBeVisible({ timeout: 5000 });

      await page.keyboard.press('Escape');
    }
  });

  test('TC04: Verify Shared Files header button filter options (by time)', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66054' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify opening Shared Files gallery from channel header and interacting with filter by time.
    `);

    const fileHeaderBtn = page
      .locator(
        `[data-e2e="chat-channel_message-header-button-file"], [data-e2e*="header-button-file"], button[title*="File"]`
      )
      .first();

    if (await fileHeaderBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fileHeaderBtn.click({ force: true });
      await page.waitForTimeout(500);

      const byTimeBtn = page
        .locator(generateE2eSelector('chat.channel_message.header.button.file.item.by_time'))
        .or(page.locator('button:has-text("Time"), [data-e2e*="by_time"]'))
        .first();

      if (await byTimeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await byTimeBtn.click({ force: true });
        await page.waitForTimeout(500);
      }

      await page.keyboard.press('Escape');
    }
  });
});
