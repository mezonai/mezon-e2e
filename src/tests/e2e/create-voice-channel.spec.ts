import { test, expect } from '@playwright/test';
import { VoiceChannelPage } from '../../pages/VoiceChannelPage';
import { HomePage } from '../../pages/HomePage';

test.describe('Create Voice Channels', () => {
  test.beforeEach(async ({ _page }) => {
    const homePage = new HomePage(page);
    await homePage.navigate();

    const currentUrl = page.url();
    if (currentUrl.includes('dev-mezon.nccsoft.vn') && !currentUrl.includes('/chat')) {
      console.log('On landing page, clicking "Open Mezon" button...');

      const openMezonSelectors = [
        'button:has-text("Open Mezon")',
        'a:has-text("Open Mezon")',
        '[data-testid="open-mezon"]',
        '.open-mezon-btn',
        'button[class*="open"]',
        'a[href*="/chat"]',
      ];

      let buttonFound = false;
      for (const selector of openMezonSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.isVisible({ timeout: 3000 })) {
            console.log(`Found "Open Mezon" button using: ${selector}`);
            await button.click();
            buttonFound = true;
            break;
          }
        } catch {
          // Ignore errors
          continue;
        }
      }

      if (!buttonFound) {
        console.log('Button not found, trying direct navigation...');
        await page.goto('/chat');
      }

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      console.log(`After navigation: ${page.url()}`);
    }

    const finalUrl = page.url();
    expect(finalUrl).not.toMatch(/login|signin|authentication/);
  });

  const voiceChannelPrivate = 'voice-channel-private';
  const voiceChannelPublic = 'voice-channel-public';
  const voiceChannelCancel = 'voice-channel-cancel';

  test('should create private voice channel', async ({ _page }) => {
    const voiceChannelPage = new VoiceChannelPage(page);

    await page.goto(
      'https://dev-mezon.nccsoft.vn/chat/clans/1840654642682269696/channels/1840654642703241216'
    );

    await test.step(`Create private voice channel named "${voiceChannelPrivate}"`, async () => {
      const created = await voiceChannelPage.createVoiceChannel(voiceChannelPrivate, 'private');
      expect(created).toBeTruthy();
      console.log(`Created private voice channel: ${voiceChannelPrivate}`);
    });

    await test.step('Verify private voice channel exists', async () => {
      const exists = await voiceChannelPage.isVoiceChannelPresent(voiceChannelPrivate);
      expect(exists).toBe(true);
    });
  });

  test('should create public voice channel', async ({ _page }) => {
    const voiceChannelPage = new VoiceChannelPage(page);

    await page.goto(
      'https://dev-mezon.nccsoft.vn/chat/clans/1840654642682269696/channels/1840654642703241216'
    );

    await test.step(`Create public voice channel named "${voiceChannelPublic}"`, async () => {
      const created = await voiceChannelPage.createVoiceChannel(voiceChannelPublic, 'public');
      expect(created).toBeTruthy();
      console.log(`Created public voice channel: ${voiceChannelPublic}`);
    });

    await test.step('Verify public voice channel exists', async () => {
      const exists = await voiceChannelPage.isVoiceChannelPresent(voiceChannelPublic);
      expect(exists).toBe(true);
    });
  });

  test('should cancel creation of voice channel with name containing special characters', async ({
    page,
  }) => {
    const voiceChannelPage = new VoiceChannelPage(page);

    await page.goto(
      'https://dev-mezon.nccsoft.vn/chat/clans/1840654642682269696/channels/1840654642703241216'
    );

    await test.step(`Attempt to create voice channel named "${voiceChannelCancel}" and cancel`, async () => {
      const cancelled = await voiceChannelPage.cancelCreateVoiceChannel(voiceChannelCancel);
      expect(cancelled).toBe(true);
      console.log(`Cancelled creation of voice channel: ${voiceChannelCancel}`);
    });

    await test.step('Verify voice channel was NOT created', async () => {
      const exists = await voiceChannelPage.isVoiceChannelPresent(voiceChannelCancel);
      expect(exists).toBe(false);
    });
  });
});
