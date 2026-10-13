import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { expect, test } from '@playwright/test';

const INTERACTIVE_APPS = [
  { name: 'Blackboard', selectorId: 'blackboard' },
  { name: 'Quiz', selectorId: 'quiz' },
  { name: 'Interactive', selectorId: 'interactive' },
] as const;

test.describe('Voice Channel - Interactive Apps', () => {
  const account = AccountCredentials['account2-3'];
  let clanFactory: ClanFactory | undefined;

  test.beforeEach(async ({ page }) => {
    await AuthHelper.setupAuthWithEmailPassword(page, account);
  });

  test.afterEach(async ({ page }) => {
    const factoryToCleanup = clanFactory;
    clanFactory = undefined;

    try {
      if (factoryToCleanup?.getClanName()) {
        await factoryToCleanup.cleanupClan(page);
      }
    } finally {
      await AuthHelper.logout(page);
    }
  });

  test('Verify each interactive app can be turned on and off in a voice call', async ({ page }) => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify each interactive app can be turned on and off in a voice call.

      **Apps:**
      - Blackboard
      - Quiz
      - Interactive

      **Expected Result:** Each app window can be opened and closed successfully.
      App content and functionality are outside the scope of this test.
    `);

    await AllureReporter.addLabels({
      tag: ['voice-channel', 'interactive-apps'],
    });

    const clanPage = new ClanPage(page);
    const currentClanFactory = new ClanFactory();
    clanFactory = currentClanFactory;

    await AllureReporter.step('Create a clan and voice channel', async () => {
      await currentClanFactory.setupClan(
        ClanSetupHelper.createConfig({
          clanNamePrefix: 'VoiceInteractiveTest',
          suiteName: 'Voice Channel - Interactive Apps',
        }),
        page
      );

      const channelName = `voice-app-${Date.now().toString(36)}-${test.info().parallelIndex}`;
      await clanPage.createNewChannel(ChannelType.VOICE, channelName);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);

      const joined = await clanPage.joinVoiceChannel(channelName);
      expect(joined).toBe(true);
    });

    for (const app of INTERACTIVE_APPS) {
      await AllureReporter.step(`Turn on ${app.name}`, async () => {
        await clanPage.openInteractiveApp(app.selectorId);
      });

      await AllureReporter.step(`Turn off ${app.name}`, async () => {
        await clanPage.closeInteractiveApp(app.selectorId);
      });
    }
  });
});
