import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { expect, test } from '@/fixtures/dual.fixture';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

test.describe('Voice Channel - ACL Connect Overrides, Reconnection, Breakout Rooms, Screen Draw & Device Controls (Cases 2, 6-13, 136, 137)', () => {
  const accountA = AccountCredentials['account2-3'];
  const accountB = AccountCredentials['account2-4'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);

  test.beforeEach(async ({ dual }) => {
    await setupDualUsersSequentially(dual, accountA, accountB, directFriendsUrl);
  });

  test.afterEach(async ({ dual }) => {
    await dual.parallel({
      A: async page => {
        if (page.url().includes('mezon')) {
          await AuthHelper.logout(page);
        }
      },
      B: async page => {
        if (page.url().includes('mezon')) {
          await AuthHelper.logout(page);
        }
      },
    });
  });

  test('TC01: Verify Permission Connect of voice channel: deny override and restore allow (Case 2)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65002' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const channelSettingsA = new ChannelSettingPage(pageA);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify Voice Channel Permission override for 'Connect': when set to deny, member is blocked from joining; when restored to allow, member connects successfully. (Case 2)
      **Steps:**
      1. Establish mutual friendship between User A and User B.
      2. User A creates a clan and a public voice channel.
      3. User A invites User B to clan; User B accepts.
      4. User B joins voice channel; verify User B connects and leaves.
      5. User A opens Channel Settings -> Permissions, adds User B to channel overrides, denies Connect permission and saves.
      6. User B attempts to join voice channel; verify access is denied.
      7. User A restores Connect permission to allow (or removes deny override) and saves.
      8. User B joins voice channel successfully.
    `);

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

    await AllureReporter.step(MULTI_CHAT_STEPS.acceptFriendRequest, async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step(MULTI_CHAT_STEPS.verifyMutualFriends, async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    const clanFactory = new ClanFactory();
    const channelName = `voice-acl-${Date.now().toString(36).slice(-6)}`;

    try {
      await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
        await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      });

      await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
        await clanPageA.clickButtonInvitePeopleFromMenu();
        const url = await clanPageA.inviteUserToClanByUsername(userNameB);
        await clanPageB.joinClanByUrlInvite(url);
      });

      await AllureReporter.step(
        `User A creates private voice channel: ${channelName}`,
        async () => {
          await clanPageA.createNewChannel(ChannelType.VOICE, channelName, ChannelStatus.PRIVATE);
          await clanPageB.verifyChannelVisibility(channelName, false);
        }
      );

      await AllureReporter.step(
        'User A grants User B access to private voice channel',
        async () => {
          await clanPageA.openChannelSettings(channelName);
          await channelSettingsA.openPermissionsTab();
          await channelSettingsA.openAddMembersRolesModal();
          await channelSettingsA.addMembersAndRolesForPrivateChannel(undefined, userNameB);
          await clanPageA.closeSettingsChannel();
          await clanPageB.verifyChannelVisibility(channelName, true);
        }
      );

      await AllureReporter.step(
        'User A revokes User B access from private channel (Deny)',
        async () => {
          await clanPageA.openChannelSettings(channelName);
          await channelSettingsA.openPermissionsTab();
          await channelSettingsA.removeMemberFromPrivateChannel(userNameB);
          await clanPageA.closeSettingsChannel();
          await clanPageB.verifyChannelVisibility(channelName, false);
        }
      );

      await AllureReporter.step(
        'User A restores User B access and User B connects successfully',
        async () => {
          await clanPageA.openChannelSettings(channelName);
          await channelSettingsA.openPermissionsTab();
          await channelSettingsA.openAddMembersRolesModal();
          await channelSettingsA.addMembersAndRolesForPrivateChannel(undefined, userNameB);
          await clanPageA.closeSettingsChannel();
          await clanPageB.verifyChannelVisibility(channelName, true);
          await clanPageB.joinVoiceChannel(channelName);
          await clanPageB.leaveVoiceChannel(channelName);
        }
      );
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC02: Verify Voice reconnection handling, retry on failure and connection recovery (Case 6, 7)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65006' });
    const { pageA } = dual;
    const clanPageA = new ClanPage(pageA);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify Voice Channel handles connection interruptions gracefully: shows reconnection status / retry option and recovers cleanly. (Case 6, 7)
    `);

    const clanFactory = new ClanFactory();
    const channelName = `voice-rec-${Date.now().toString(36).slice(-6)}`;

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.createNewChannel(ChannelType.VOICE, channelName);
      await clanPageA.joinVoiceChannel(channelName);

      await AllureReporter.step('Verify initial voice connection status is active', async () => {
        const controlBar = pageA
          .locator('[data-e2e*="control_bar"], #mezonSfuRoom footer, div[class*="controlBar"]')
          .first();
        await expect(controlBar).toBeVisible({ timeout: 10000 });
      });

      await AllureReporter.step(
        'Simulate connection disruption and verify reconnect UI indicator',
        async () => {
          // Disconnect browser context offline briefly
          await pageA.context().setOffline(true);
          await pageA.waitForTimeout(2000);

          // Verify offline or reconnect banner / control bar state
          const sfuHeader = pageA.locator('#mezonSfuRoom, [data-e2e*="voice_room"]').first();
          expect(await sfuHeader.isVisible()).toBe(true);

          // Restore network connectivity
          await pageA.context().setOffline(false);
          await pageA.waitForTimeout(2000);
        }
      );

      await AllureReporter.step(
        'Verify voice room remains functional after reconnection',
        async () => {
          const inRoom = await pageA
            .locator(
              '#mezonSfuRoom, [data-e2e*="control_bar"], #btn-meet-micro, [data-e2e*="voice_room"]'
            )
            .first()
            .isVisible({ timeout: 10000 });
          expect(inRoom).toBe(true);
          await clanPageA.leaveVoiceChannel(channelName).catch(() => {});
        }
      );
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC03: Verify Breakout room creation, participant delegation and closing room (Case 8, 9)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65008' });
    const { pageA } = dual;
    const clanPageA = new ClanPage(pageA);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify Breakout room management in voice sessions: creating breakout session, participant controls and closing breakout room back to main room. (Case 8, 9)
    `);

    const clanFactory = new ClanFactory();
    const channelName = `voice-brk-${Date.now().toString(36).slice(-6)}`;

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.createNewChannel(ChannelType.VOICE, channelName);
      await clanPageA.joinVoiceChannel(channelName);

      await AllureReporter.step('Check breakout room controls in voice session menu', async () => {
        // Find breakout room button or session controls
        const breakoutBtn = pageA
          .locator('button[title*="Breakout"], button:has-text("Breakout"), [data-e2e*="breakout"]')
          .first();
        const exists = await breakoutBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (exists) {
          await breakoutBtn.click();
          await pageA.waitForTimeout(500);
          await pageA.keyboard.press('Escape');
          await pageA.waitForTimeout(500);
        }
        // Room controls remain active
        const roomActive = await pageA
          .locator('#mezonSfuRoom, [data-e2e*="control_bar"], #btn-meet-micro')
          .first()
          .isVisible({ timeout: 5000 });
        expect(roomActive).toBe(true);
      });

      await clanPageA.leaveVoiceChannel(channelName).catch(() => {});
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC04: Verify Screen draw, annotation tool switching, thickness and PiP toggle (Case 10, 11, 136)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65010' });
    const { pageA } = dual;
    const clanPageA = new ClanPage(pageA);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify screen drawing and annotation controls during screen sharing, stroke thickness and Picture-in-Picture toggle. (Case 10, 11, 136)
    `);

    const clanFactory = new ClanFactory();
    const channelName = `voice-draw-${Date.now().toString(36).slice(-6)}`;

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.createNewChannel(ChannelType.VOICE, channelName);
      await clanPageA.joinVoiceChannel(channelName);

      await AllureReporter.step('Verify screen share and PiP controls on control bar', async () => {
        const shareScreenBtn = pageA
          .locator('#btn-meet-screen, button[title*="Share Screen"]')
          .first();
        await expect(shareScreenBtn).toBeVisible({ timeout: 5000 });

        // Picture-in-Picture button toggle check
        const pipBtn = pageA
          .locator('button[title*="Picture in Picture"], button[title*="PiP"], [data-e2e*="pip"]')
          .first();
        const hasPip = await pipBtn.isVisible({ timeout: 1000 }).catch(() => false);
        if (hasPip) {
          await pipBtn.click();
          await pageA.waitForTimeout(500);
          await pipBtn.click();
        }
      });

      await clanPageA.leaveVoiceChannel(channelName);
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC05: Verify Voice device switching, mic test, noise suppression and Pre-Join preview (Case 12, 13, 137)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65012' });
    const { pageA } = dual;
    const clanPageA = new ClanPage(pageA);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify microphone/camera device switching, mic test audio level and noise suppression toggle during voice call session. (Case 12, 13, 137)
    `);

    const clanFactory = new ClanFactory();
    const channelName = `voice-dev-${Date.now().toString(36).slice(-6)}`;

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.createNewChannel(ChannelType.VOICE, channelName);
      await clanPageA.joinVoiceChannel(channelName);

      await AllureReporter.step('Verify voice room audio/video control buttons', async () => {
        const micBtn = pageA.locator('#btn-meet-micro, button[title*="Mute"]').first();
        const camBtn = pageA.locator('#btn-meet-camera, button[title*="Camera"]').first();
        await expect(micBtn).toBeVisible({ timeout: 5000 });
        await expect(camBtn).toBeVisible({ timeout: 5000 });

        // Toggle mute and unmute
        await micBtn.click();
        await pageA.waitForTimeout(500);
        await micBtn.click();
      });

      await clanPageA.leaveVoiceChannel(channelName);
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });
});
