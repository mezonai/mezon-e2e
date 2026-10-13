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

test.describe('Voice Channel - Join as Speaker or Audience', () => {
  const accountA = AccountCredentials['account2-3'];
  const accountB = AccountCredentials['account2-4'];
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
        A: page => AuthHelper.logout(page),
        B: page => AuthHelper.logout(page),
      });
    }
  });

  async function setupVoiceChannel(
    clanPageA: ClanPage,
    clanPageB: ClanPage,
    friendPageA: FriendPage,
    friendPageB: FriendPage
  ): Promise<string> {
    await AllureReporter.step('Prepare friendship between User A and User B', async () => {
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
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    const currentClanFactory = new ClanFactory();
    clanFactory = currentClanFactory;

    await AllureReporter.step('Create a clan and a voice channel', async () => {
      await currentClanFactory.setupClan(
        ClanSetupHelper.createConfig({
          clanNamePrefix: 'VoiceJoinRoleTest',
          suiteName: 'Voice Channel - Join Roles',
        }),
        clanPageA.page
      );
    });

    const channelName = `voice-role-${Date.now().toString(36)}-${test.info().parallelIndex}`.slice(
      0,
      20
    );
    await clanPageA.createNewChannel(ChannelType.VOICE, channelName);
    expect(await clanPageA.isNewChannelPresent(channelName)).toBe(true);

    await AllureReporter.step('Invite User B to the clan', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);
    });

    return channelName;
  }

  test('User can join as speaker and use voice/video functions', async ({ dual }) => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify the Speaker join mode and its participant state.

      **Expected Result:** The user joins as a normal participant, can use microphone and
      camera controls, and is displayed correctly to another channel member.
    `);
    await AllureReporter.addLabels({ tag: ['voice-channel', 'join-as-speaker'] });

    const clanPageA = new ClanPage(dual.pageA);
    const clanPageB = new ClanPage(dual.pageB);
    const channelName = await setupVoiceChannel(
      clanPageA,
      clanPageB,
      new FriendPage(dual.pageA),
      new FriendPage(dual.pageB)
    );

    await AllureReporter.step('User B joins first as an observer', async () => {
      expect(await clanPageB.joinVoiceChannel(channelName, 'speaker')).toBe(true);
    });

    await AllureReporter.step('User A explicitly selects Join as speaker', async () => {
      expect(await clanPageA.joinVoiceChannel(channelName, 'speaker')).toBe(true);
    });

    await AllureReporter.step('Verify Speaker controls and member state', async () => {
      await clanPageA.verifySpeakerVoiceControls();
      expect(await clanPageA.isUserInVoiceChannel(channelName, userNameA)).toBe(true);
      expect(await clanPageB.isUserInVoiceChannel(channelName, userNameA)).toBe(true);
      expect(await clanPageB.isAudienceStateVisible(1000)).toBe(false);
    });

    await AllureReporter.step('Speaker enables microphone and camera', async () => {
      expect(await clanPageA.enableMicrophone()).toBe(true);
      expect(await clanPageA.enableCamera()).toBe(true);
    });
  });

  test('User can join as audience with Hold to Talk and no camera access', async ({ dual }) => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify the Audience join mode and its restricted UI.

      **Expected Result:** The audience can listen and use Hold to Talk temporarily. Camera,
      microphone toggle and screen sharing actions are unavailable, and other members see
      the Audience state.
    `);
    await AllureReporter.addLabels({ tag: ['voice-channel', 'join-as-audience'] });

    const clanPageA = new ClanPage(dual.pageA);
    const clanPageB = new ClanPage(dual.pageB);
    const channelName = await setupVoiceChannel(
      clanPageA,
      clanPageB,
      new FriendPage(dual.pageA),
      new FriendPage(dual.pageB)
    );

    await AllureReporter.step('User B joins as speaker', async () => {
      expect(await clanPageB.joinVoiceChannel(channelName, 'speaker')).toBe(true);
    });

    await AllureReporter.step('User A selects Join as audience', async () => {
      expect(await clanPageA.joinVoiceChannel(channelName, 'audience')).toBe(true);
    });

    await AllureReporter.step('Verify Audience UI restrictions and status', async () => {
      await clanPageA.verifyAudienceVoiceControls();
      expect(await clanPageA.isAudienceStateVisible()).toBe(true);
      expect(await clanPageA.isUserInVoiceChannel(channelName, userNameA)).toBe(true);
      expect(await clanPageB.isUserInVoiceChannel(channelName, userNameA)).toBe(true);
      expect
        .soft(await clanPageB.isAudienceStateVisible(), 'Observer should see the Audience badge')
        .toBe(true);
    });

    await AllureReporter.step('Audience holds and releases Push to Talk', async () => {
      await clanPageA.verifyHoldToTalkStateChanges();
    });
  });
});
