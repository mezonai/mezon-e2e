import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { test } from '@/fixtures/dual.fixture';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect } from '@playwright/test';
import { open, stat } from 'node:fs/promises';

type RecordingArtifact = {
  path: string;
  fileName: string;
};

async function isSupportedRecordingContainer(filePath: string): Promise<boolean> {
  const file = await open(filePath, 'r');
  try {
    const header = Buffer.alloc(12);
    const { bytesRead } = await file.read(header, 0, header.length, 0);
    if (bytesRead < 8) return false;

    const isWebM = header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    const isMp4 = header.subarray(4, 8).toString('ascii') === 'ftyp';
    return isWebM || isMp4;
  } finally {
    await file.close();
  }
}

test.describe('Voice Channel - Voice Call Recording', () => {
  const accountA = AccountCredentials['account2-3'];
  const accountB = AccountCredentials['account2-4'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);
  let clanFactory: ClanFactory | undefined;

  test.beforeEach(async ({ dual }) => {
    await setupDualUsersSequentially(dual, accountA, accountB, directFriendsUrl);
  });

  test.afterEach(async ({ dual }) => {
    const factoryToCleanup = clanFactory;
    clanFactory = undefined;
    try {
      await factoryToCleanup?.cleanupClan(dual.pageA);
    } finally {
      await dual.parallel({
        A: async page => {
          await AuthHelper.logout(page);
        },
        B: async page => {
          await AuthHelper.logout(page);
        },
      });
    }
  });

  test('Verify that user can start and stop voice call recording in voice channel', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64646',
    });

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can start and stop voice call recording in voice channel
      Activities recorded include:
      - Voice of users who have joined the room
      - User avatars displayed during the recording
      - Camera video of participants
      - Screen sharing content

      **Test Steps:**
      1. User A creates a clan and voice channel
      2. User A invites User B to clan, User B joins
      3. Both users join the voice channel
      4. Verify both users are visible in the voice room and enable both microphones
      5. User A clicks Record button to start recording
      6. Verify recording clock and User B avatar are visible
      7. Both users turn on cameras and User B camera reaches User A
      8. User A starts screen sharing and verifies it remains active during recording
      9. User A clicks Record button to stop recording
      10. Verify recording stops and a non-empty media file is downloaded

      **Expected Result:** Voice call recording captures all stream types:
      voice, avatar, camera and screen content.
    `);

    await AllureReporter.addLabels({
      tag: ['voice-channel', 'voice-recording'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      await Promise.allSettled([
        friendPageA.unblockFriend(userNameB),
        friendPageB.unblockFriend(userNameA),
      ]);
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
    });

    await AllureReporter.step(SEND_REQUEST_STEP_NAME, async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
    });

    await AllureReporter.step('User B accepts the friend request', async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step('Verify both users see each other as friends', async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    const currentClanFactory = new ClanFactory();
    clanFactory = currentClanFactory;

    await AllureReporter.step('User A creates a clan', async () => {
      await currentClanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
    });

    const channelName = `voice-rec-${Date.now().toString(36)}-${test.info().parallelIndex}`;

    await AllureReporter.step(`Create new voice channel: ${channelName}`, async () => {
      await clanPageA.createNewChannel(ChannelType.VOICE, channelName);
      const isNewChannelPresent = await clanPageA.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('User A invites User B to clan and User B accepts it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User A and User B join voice channel', async () => {
      const isJoinedVoiceA = await clanPageA.joinVoiceChannel(channelName);
      expect(isJoinedVoiceA).toBe(true);
      const isJoinedVoiceB = await clanPageB.joinVoiceChannel(channelName);
      expect(isJoinedVoiceB).toBe(true);
    });

    await AllureReporter.step('Verify both users are present in the voice room', async () => {
      const [userASeesUserB, userBSeesUserA] = await Promise.all([
        clanPageA.isUserInVoiceRoomScreen(userNameB),
        clanPageB.isUserInVoiceRoomScreen(userNameA),
      ]);
      expect(userASeesUserB).toBe(true);
      expect(userBSeesUserA).toBe(true);
    });

    await AllureReporter.step('Enable microphone for both users before recording', async () => {
      const [isMicrophoneAEnabled, isMicrophoneBEnabled] = await Promise.all([
        clanPageA.enableMicrophone(),
        clanPageB.enableMicrophone(),
      ]);
      expect(isMicrophoneAEnabled).toBe(true);
      expect(isMicrophoneBEnabled).toBe(true);
    });

    await AllureReporter.step('User A starts voice call recording', async () => {
      const isRecordingStarted = await clanPageA.startRecordingVoiceCall();
      expect(isRecordingStarted).toBe(true);
    });

    await AllureReporter.step(
      'Verify recording indicator is active and User B avatar is displayed',
      async () => {
        const isActive = await clanPageA.isVoiceRecordingActive();
        expect(isActive).toBe(true);
        expect(await clanPageA.isUserAvatarVisibleInVoiceRoom(userNameB)).toBe(true);
        const didClockAdvance = await clanPageA.waitForVoiceRecordingClockToAdvance();
        expect(didClockAdvance).toBe(true);
      }
    );

    await AllureReporter.step('Both users turn on camera video during recording', async () => {
      const [isCameraAEnabled, isCameraBEnabled] = await Promise.all([
        clanPageA.enableCamera(),
        clanPageB.enableCamera(),
      ]);
      expect(isCameraAEnabled).toBe(true);
      expect(isCameraBEnabled).toBe(true);
      expect(await clanPageA.isUserCameraVisibleInVoiceRoom(userNameB)).toBe(true);
    });

    await AllureReporter.step(
      'Verify recording indicator remains active with audio and video streams',
      async () => {
        const isActive = await clanPageA.isVoiceRecordingActive();
        expect(isActive).toBe(true);
      }
    );

    await AllureReporter.step(
      'User A starts screen sharing (screen content recorded)',
      async () => {
        const isScreenShareStarted = await clanPageA.shareScreen();
        expect(isScreenShareStarted).toBe(true);
      }
    );

    await AllureReporter.step(
      'Verify screen share is active while recording is ongoing',
      async () => {
        const isScreenShareActive = await clanPageA.isScreenSharing();
        expect(isScreenShareActive).toBe(true);
        const isRecordingStillActive = await clanPageA.isVoiceRecordingActive();
        expect(isRecordingStillActive).toBe(true);
      }
    );

    let recordingArtifact: RecordingArtifact | undefined;

    await AllureReporter.step(
      'User A stops voice call recording and downloads the result',
      async () => {
        const downloadPromise = pageA.waitForEvent('download', { timeout: 20_000 });
        const isRecordingStopped = await clanPageA.stopRecordingVoiceCall();
        expect(isRecordingStopped).toBe(true);

        const download = await downloadPromise;
        expect(await download.failure()).toBeNull();
        const fileName = download.suggestedFilename();
        expect(fileName).toMatch(/^mezon-.+\.(webm|mp4)$/);

        const artifactPath = test.info().outputPath(fileName);
        await download.saveAs(artifactPath);
        recordingArtifact = { path: artifactPath, fileName };
      }
    );

    await AllureReporter.step(
      'Verify recording stops and produces a valid media file',
      async () => {
        const isActive = await clanPageA.isVoiceRecordingActive();
        expect(isActive).toBe(false);

        expect(recordingArtifact).toBeDefined();
        const artifact = recordingArtifact as RecordingArtifact;
        const fileStats = await stat(artifact.path);
        expect(fileStats.size).toBeGreaterThan(0);
        expect(await isSupportedRecordingContainer(artifact.path)).toBe(true);

        await test.info().attach('voice-call-recording', {
          path: artifact.path,
          contentType: artifact.fileName.endsWith('.mp4') ? 'video/mp4' : 'video/webm',
        });
      }
    );
  });
});
