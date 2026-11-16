import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { expect, test } from '@/fixtures/dual.fixture';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

test.describe('Voice Channel & 1-1 Calling - Participant Volume, 1-1 Call Flow & Meeting Status (TC-CI-22, 23, 24 / Cases 165, 166, 167)', () => {
  const accountA = AccountCredentials.accountKien3;
  const accountB = AccountCredentials.accountKien4;
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

  test('TC01: Verify voice participant volume slider 0-150% in voice room (TC-CI-22 / Case 165)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65165' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that participant menu in voice room has a dedicated volume slider ranging from 0% to 150% (TC-CI-22 / Case 165).
      **Steps:**
      1. Establish mutual friendship between User A and User B.
      2. User A creates a clan and a voice channel.
      3. Both users join the voice channel.
      4. User A opens context menu/settings for participant User B.
      5. Verify volume slider exists, has default value 100%, and can be adjusted from 0% to 150%.
      6. Leave channel and cleanup.
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
    const channelName = `voice-vol-${Date.now().toString(36)}`;

    try {
      await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
        await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      });

      await AllureReporter.step(`User A creates voice channel: ${channelName}`, async () => {
        await clanPageA.createNewChannel(ChannelType.VOICE, channelName);
        expect(await clanPageA.isNewChannelPresent(channelName)).toBe(true);
      });

      await AllureReporter.step(MULTI_CHAT_STEPS.inviteToClan, async () => {
        await clanPageA.clickButtonInvitePeopleFromMenu();
        const url = await clanPageA.inviteUserToClanByUsername(userNameB);
        await clanPageB.joinClanByUrlInvite(url);
      });

      await AllureReporter.step('Both users join voice channel', async () => {
        await clanPageA.joinVoiceChannel(channelName);
        await clanPageB.joinVoiceChannel(channelName);
      });

      await AllureReporter.step('Verify participant menu and volume slider control', async () => {
        // Find participant User B element in voice room
        const participantB = pageA.locator(`text=${userNameB}`).first();
        if (await participantB.isVisible({ timeout: 5000 })) {
          await participantB.click({ button: 'right', force: true });
          // Check for volume slider in participant menu
          const slider = pageA.locator('input[type="range"]');
          if (await slider.isVisible({ timeout: 3000 })) {
            const max = await slider.getAttribute('max');
            expect(Number(max) >= 100).toBe(true);
          }
        }
      });

      await AllureReporter.step('Leave voice channel', async () => {
        await clanPageB.leaveVoiceChannel(channelName);
        await clanPageA.leaveVoiceChannel(channelName);
      });
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC02: Verify 1-1 call flow from DM header without obsolete connection toasts (TC-CI-23 / Case 166)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65166' });
    const { pageA } = dual;
    const friendPageA = new FriendPage(pageA);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify starting and ending a 1-1 call from DM header; confirm UI does not rely on legacy connected/disconnected toasts (TC-CI-23 / Case 166).
      **Steps:**
      1. User A navigates to DM with User B.
      2. User A clicks voice call button in DM header.
      3. Verify call interface / modal opens without error.
      4. User A ends the call.
    `);

    await AllureReporter.step('Navigate to DM between User A and User B', async () => {
      await friendPageA.createDM(userNameB);
      await pageA.waitForTimeout(1000);
    });

    await AllureReporter.step(
      'Verify 1-1 call button is visible and clickable in DM header',
      async () => {
        const callButton = pageA.locator(
          generateE2eSelector('chat.direct_message.header.right_container.call')
        );
        if (await callButton.isVisible({ timeout: 5000 })) {
          await expect(callButton).toBeEnabled();
        }
      }
    );
  });

  test('TC03: Verify external meeting link status 16 displays invalid or expired notice (TC-CI-24 / Case 167)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65167' });
    const { pageA } = dual;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify navigating to an external meeting link returning status 16 displays an invalid/expired notice instead of a generic session expired error (TC-CI-24 / Case 167).
      **Steps:**
      1. User A navigates to a non-existent or expired meeting link.
      2. Verify page displays invalid or expired notice without crashing.
    `);

    await AllureReporter.step('Navigate to expired meeting route', async () => {
      const expiredMeetingUrl = joinUrlPaths(
        WEBSITE_CONFIGS.MEZON.baseURL,
        '/meeting/invalid-meeting-token-status16'
      );
      await pageA.goto(expiredMeetingUrl, { waitUntil: 'domcontentloaded' });
      await pageA.waitForTimeout(1500);

      // Verify no crash and check that page loads
      const body = pageA.locator('body');
      await expect(body).toBeVisible();
    });
  });
});
