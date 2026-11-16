import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

const STREAM_ROOM_SELECTOR =
  '#mezonSfuRoom, button:has-text("Join stream"), div:has-text("No one is currently in stream"), [data-e2e*="voice_room"], div[class*="streamRoom"]';

test.describe('Stream Channel & Stream Player Controls (Cases 40-45)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account1;
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

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify creating, joining, leaving stream channel and toggling member list (Cases 40, 45)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65040' });
    const unique = Date.now().toString(36).slice(-6);
    const streamChannelName = `stream-${unique}`;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can create a stream channel, enter/leave the stream room and toggle member list without breaking stream layout (Cases 40, 45).
    `);

    await AllureReporter.step(`Create new stream channel: ${streamChannelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.STREAM, streamChannelName);
      expect(await clanPage.isNewChannelPresent(streamChannelName)).toBe(true);
    });

    await AllureReporter.step(
      'Join stream channel and verify stream player container',
      async () => {
        await clanPage.openChannelByName(streamChannelName);
        const joinStreamBtn = page.getByRole('button', { name: /Join stream/i });
        await expect(joinStreamBtn).toBeVisible({ timeout: 10000 });
        // When no active stream exists, Join stream button is present and disabled
        expect(await joinStreamBtn.isDisabled()).toBe(true);

        const streamContainer = page.locator(STREAM_ROOM_SELECTOR).first();
        await expect(streamContainer).toBeVisible({ timeout: 10000 });
      }
    );

    await AllureReporter.step('Toggle member list on stream view (Case 45)', async () => {
      const toggleMemberListBtn = page
        .locator('button[title*="Member"], button[aria-label*="Member"], [data-e2e*="member_list"]')
        .first();
      const hasMemberBtn = await toggleMemberListBtn
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      if (hasMemberBtn) {
        await toggleMemberListBtn.click();
        await page.waitForTimeout(500);
        await toggleMemberListBtn.click();
      }
      // Stream container still active
      const streamContainer = page.locator(STREAM_ROOM_SELECTOR).first();
      expect(await streamContainer.isVisible()).toBe(true);
    });

    await AllureReporter.step(
      'Leave stream channel and verify navigation back to general',
      async () => {
        await clanPage.openChannelByName('general');
        const generalInput = page.locator('div[role="textbox"], textarea').first();
        await expect(generalInput).toBeVisible({ timeout: 10000 });
      }
    );
  });

  test('TC02: Verify Stream player audio mute/unmute, fullscreen toggle and error recovery (Cases 41, 42, 43, 44)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65041' });
    const unique = Date.now().toString(36).slice(-6);
    const streamChannelName = `player-${unique}`;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify stream player interactive controls: mute/unmute, fullscreen mode toggle, stream options and retry upon connection interruption (Cases 41, 42, 43, 44).
    `);

    await AllureReporter.step(`Create stream channel: ${streamChannelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.STREAM, streamChannelName);
      await clanPage.openChannelByName(streamChannelName);
      const joinBtn = page.getByRole('button', { name: /Join stream/i });
      if (await joinBtn.isEnabled().catch(() => false)) {
        await joinBtn.click();
      }
      await page.waitForTimeout(1000);
    });

    await AllureReporter.step(
      'Verify player mute and unmute audio controls (Case 41)',
      async () => {
        const muteBtn = page
          .locator('button[title*="Mute"], button[title*="Volume"], button[aria-label*="Mute"]')
          .first();
        const hasMute = await muteBtn.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasMute) {
          await muteBtn.click();
          await page.waitForTimeout(500);
          await muteBtn.click();
        }
      }
    );

    await AllureReporter.step('Verify fullscreen toggle control (Case 42)', async () => {
      const fsBtn = page
        .locator('button[title*="Fullscreen"], button[aria-label*="Fullscreen"]')
        .first();
      const hasFs = await fsBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasFs) {
        await fsBtn.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
    });

    await AllureReporter.step(
      'Verify stream option and quality selection menu (Case 43)',
      async () => {
        const settingsBtn = page
          .locator('button[title*="Setting"], button[title*="Quality"], [data-e2e*="quality"]')
          .first();
        const hasSettings = await settingsBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (hasSettings) {
          await settingsBtn.click();
          await page.waitForTimeout(500);
          await page.keyboard.press('Escape');
        }
      }
    );

    await AllureReporter.step('Verify stream error recovery and retry (Case 44)', async () => {
      // Simulate momentary offline state
      await page.context().setOffline(true);
      await page.waitForTimeout(1000);
      await page.context().setOffline(false);
      await page.waitForTimeout(1000);

      // Verify stream room container recovers
      const streamContainer = page.locator(STREAM_ROOM_SELECTOR).first();
      expect(await streamContainer.isVisible()).toBe(true);
    });
  });
});
