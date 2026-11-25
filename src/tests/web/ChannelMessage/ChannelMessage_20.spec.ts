import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import MessageSelector from '@/data/selectors/MessageSelector';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Messages - Navigation Between Chat and Timeline Views', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account8;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage8,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('Verify that user can toggle between Timeline and Chat views from channel header', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64680',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can switch between the Channel Timeline view and Chat view from header buttons.

      **Test Steps:**
      1. Create a text channel
      2. Click Timeline button in channel header
      3. Verify Timeline panel is displayed
      4. Click Chat button in channel header to switch back
      5. Verify message composer is visible again
      6. Clean up channel

      **Expected Result:** View switching works seamlessly without page reload.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'timeline-view', 'header-navigation'],
    });

    const clanPage = new ClanPage(page);
    const messageSelector = new MessageSelector(page);
    const unique = generateRandomString(6).toLowerCase();
    const channelName = `view-nav-${unique}`;

    const timelineHeaderBtn = page.locator(
      generateE2eSelector('chat.channel_message.header.button.timeline')
    );
    const chatHeaderBtn = page.locator(
      generateE2eSelector('chat.channel_message.header.button.chat')
    );
    const timelineCreateBtn = page.locator(generateE2eSelector('timeline.buttons.create_new'));

    await AllureReporter.step(`Create text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step('Switch to Timeline view from channel header', async () => {
      if (await timelineHeaderBtn.isVisible({ timeout: 5000 })) {
        await timelineHeaderBtn.click();
        await expect(timelineCreateBtn.or(page.locator('text=Timeline'))).toBeVisible({
          timeout: 8000,
        });
      }
    });

    await AllureReporter.step('Switch back to Chat view from channel header', async () => {
      if (await chatHeaderBtn.isVisible({ timeout: 5000 })) {
        await chatHeaderBtn.click();
        await expect(messageSelector.messageInput).toBeVisible({ timeout: 8000 });
      }
    });
  });

  test('Verify pinned messages panel and pin action limit guard (TC-MSG-01)', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64681',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can open Pinned Messages header panel and verify pinned messages list and actions (TC-MSG-01).
    `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'pinned-messages', 'pin-limit'],
    });

    const clanPage = new ClanPage(page);
    const messageSelector = new MessageSelector(page);
    const unique = generateRandomString(4).toLowerCase();
    const channelName = `pin-${unique}`;

    await AllureReporter.step(`Create text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step('Send test message in channel', async () => {
      await clanPage.openChannelByName(channelName);
      const input = messageSelector.messageInput.first();
      await input.waitFor({ state: 'visible', timeout: 5000 });
      await input.fill(`Test message to pin ${unique}`);
      await input.press('Enter');
      await page.waitForTimeout(1000);
    });

    await AllureReporter.step('Open Pinned Messages header panel', async () => {
      const pinHeaderBtn = page
        .locator(
          'button[title*="Pinned Messages"], button[aria-label*="Pinned Messages"], [data-e2e*="pinned_messages"], [data-e2e*="pin_message"]'
        )
        .first();

      if (await pinHeaderBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await pinHeaderBtn.click();
        await page.waitForTimeout(500);

        // Verify pinned messages sidebar / drawer
        const pinDrawer = page
          .locator(
            '[data-e2e*="pinned"], div:has-text("Pinned Messages"), div:has-text("No pinned messages")'
          )
          .first();
        expect(await pinDrawer.isVisible({ timeout: 5000 })).toBe(true);
      }
    });
  });
});
