import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { expect, Page, test } from '@playwright/test';

type MicrophonePermission = 'granted' | 'prompt';
const MICROPHONE_PERMISSION_TAGS = ['voice-channel', 'microphone-permission'];

test.use({
  launchOptions: {
    args: ['--use-fake-device-for-media-stream'],
  },
});

test.describe('Voice Call - Microphone Permission Warning', () => {
  const account = AccountCredentials['account2-3'];
  let clanFactory: ClanFactory | undefined;

  async function setMicrophonePermission(page: Page, setting: MicrophonePermission): Promise<void> {
    await page.context().clearPermissions();
    if (setting === 'granted') {
      await page.context().grantPermissions(['microphone'], { origin: new URL(page.url()).origin });
    }

    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const status = await navigator.permissions.query({
              name: 'microphone' as PermissionName,
            });
            return status.state;
          }),
        { timeout: 10000 }
      )
      .toBe(setting);
  }

  async function simulateMicrophoneDenial(page: Page): Promise<void> {
    await page.evaluate(() => {
      const mediaDevices = navigator.mediaDevices as MediaDevices & {
        originalGetUserMedia?: MediaDevices['getUserMedia'];
      };
      mediaDevices.originalGetUserMedia ??= mediaDevices.getUserMedia.bind(mediaDevices);
      mediaDevices.getUserMedia = async () => {
        throw new DOMException('Permission denied', 'NotAllowedError');
      };
    });
  }

  async function restoreMicrophoneCapture(page: Page): Promise<void> {
    await page.evaluate(() => {
      const mediaDevices = navigator.mediaDevices as MediaDevices & {
        originalGetUserMedia?: MediaDevices['getUserMedia'];
      };
      if (mediaDevices.originalGetUserMedia) {
        mediaDevices.getUserMedia = mediaDevices.originalGetUserMedia;
        delete mediaDevices.originalGetUserMedia;
      }
    });
  }

  async function setupVoiceRoom(page: Page): Promise<ClanPage> {
    const clanPage = new ClanPage(page);
    const currentClanFactory = new ClanFactory();
    clanFactory = currentClanFactory;

    await currentClanFactory.setupClan(
      ClanSetupHelper.createConfig({
        clanNamePrefix: 'MicPermissionTest',
        suiteName: 'Voice Call - Microphone Permission Warning',
      }),
      page
    );

    const channelName = `voice-mic-${Date.now().toString(36)}-${test.info().parallelIndex}`.slice(
      0,
      20
    );
    expect(await clanPage.createNewChannel(ChannelType.VOICE, channelName)).toBe(true);
    expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    expect(await clanPage.joinVoiceChannel(channelName)).toBe(true);

    return clanPage;
  }

  test.beforeEach(async ({ page }) => {
    await AuthHelper.setupAuthWithEmailPassword(page, account);
  });

  test.afterEach(async ({ page }) => {
    const factoryToCleanup = clanFactory;
    clanFactory = undefined;

    try {
      await factoryToCleanup?.cleanupClan(page);
    } finally {
      await AuthHelper.logout(page);
    }
  });

  test('Granted microphone permission does not display a warning', async ({ page }) => {
    await AllureReporter.addLabels({ tag: MICROPHONE_PERMISSION_TAGS });
    await setMicrophonePermission(page, 'granted');
    const clanPage = await setupVoiceRoom(page);

    await AllureReporter.step('Verify warning is absent and microphone works', async () => {
      await clanPage.verifyMicrophonePermissionWarningHidden();
      expect(await clanPage.enableMicrophone()).toBe(true);
    });
  });

  test('Not granted permission displays warning and granting it enables microphone', async ({
    page,
  }) => {
    await AllureReporter.addLabels({ tag: MICROPHONE_PERMISSION_TAGS });
    await setMicrophonePermission(page, 'prompt');
    await simulateMicrophoneDenial(page);
    const clanPage = await setupVoiceRoom(page);

    await AllureReporter.step('Display the microphone permission warning', async () => {
      await clanPage.verifyMicrophonePermissionWarning();
      await clanPage.openMicrophonePermissionDialog();
    });

    await AllureReporter.step('Grant permission and verify microphone works normally', async () => {
      await restoreMicrophoneCapture(page);
      await setMicrophonePermission(page, 'granted');
      await clanPage.verifyMicrophonePermissionWarningHidden();
      expect(await clanPage.enableMicrophone()).toBe(true);
    });
  });

  test('Denied permission displays blocked warning and keeps microphone disabled', async ({
    page,
  }) => {
    await AllureReporter.addLabels({ tag: MICROPHONE_PERMISSION_TAGS });
    await setMicrophonePermission(page, 'prompt');
    await simulateMicrophoneDenial(page);
    const clanPage = await setupVoiceRoom(page);

    await AllureReporter.step('Display the blocked microphone warning', async () => {
      await clanPage.verifyMicrophonePermissionWarning();
      await clanPage.openMicrophonePermissionDialog();
      await clanPage.denyMicrophonePermissionRequest();
    });

    await AllureReporter.step('Close warning and verify microphone remains disabled', async () => {
      await clanPage.closeMicrophonePermissionWarning();
      await clanPage.verifyMicrophonePermissionWarning();
      await expect(page.locator('#btn-meet-micro')).not.toHaveAttribute(
        'aria-label',
        'Turn Off Microphone'
      );
    });
  });
});
