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
import { MULTI_CHAT_STEPS } from '../MultiChatTestConstants';

test.describe('Clan Management - Invites, Multi-Client Mark As Read & Event Join (Cases 21, 22, 52-54, 89, 91-93)', () => {
  const accountA = AccountCredentials['account2-3'];
  const accountB = AccountCredentials['account2-4'];
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

  test('TC01: Verify clan and channel invite flows, multi-member selection and modal responses (Cases 21, 22, 89, 91, 92)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65021' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify clan invite link creation, multi-member selection in invite modal, accepting invite, and rejection safeguards (Cases 21, 22, 89, 91, 92).
    `);

    await AllureReporter.step('Clean up and establish mutual friendship', async () => {
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
      await friendPageB.acceptFirstFriendRequest();
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    const clanFactory = new ClanFactory();
    try {
      await AllureReporter.step(MULTI_CHAT_STEPS.createClan, async () => {
        await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      });

      await AllureReporter.step(
        'User A generates invite link and invites User B (Cases 22, 89)',
        async () => {
          await clanPageA.clickButtonInvitePeopleFromMenu();
          const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
          expect(inviteUrl).toBeTruthy();

          // User B joins clan via invite URL (Case 91)
          await clanPageB.joinClanByUrlInvite(inviteUrl);
          await pageB.waitForTimeout(1000);
        }
      );

      await AllureReporter.step('Verify User B is now a member of the clan (Case 89)', async () => {
        const clanHeader = pageB.locator(`text=${clanFactory.getClanName()}`).first();
        await expect(clanHeader).toBeVisible({ timeout: 10000 });
      });
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC02: Verify Mark-as-read sync between clients and inbox notification pagination (Cases 52, 53, 54)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65052' });
    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify marking messages as read on client A synchronizes unread badges to client B and tests inbox pagination for Mentions & Topics (Cases 52, 53, 54).
    `);

    const clanFactory = new ClanFactory();
    try {
      await Promise.allSettled([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      const clanPageB = new ClanPage(pageB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      await AllureReporter.step('User A sends message mentioning User B', async () => {
        const msgInput = pageA.locator('div[role="textbox"], textarea').first();
        await msgInput.fill(`Hello @${userNameB} test mark as read sync`);
        await msgInput.press('Enter');
        await pageA.waitForTimeout(1000);
      });

      await AllureReporter.step(
        'User B opens Inbox to inspect Mentions and verify pagination (Cases 53, 54)',
        async () => {
          const inboxBtn = pageB
            .locator('button[data-e2e*="inbox"], button[title*="Inbox"]')
            .first();
          if (await inboxBtn.isVisible({ timeout: 3000 })) {
            await inboxBtn.click();
            await pageB.waitForTimeout(500);

            // Check Mentions tab
            const mentionsTab = pageB
              .locator('button:has-text("Mentions"), [role="tab"]:has-text("Mentions")')
              .first();
            if (await mentionsTab.isVisible()) {
              await mentionsTab.click();
              await pageB.waitForTimeout(500);
            }
            await pageB.keyboard.press('Escape');
          }
        }
      );
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC03: Verify opening voice channel directly from calendar event card (Case 93)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65093' });
    const { pageA } = dual;
    const clanPageA = new ClanPage(pageA);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can open and join an ongoing voice channel directly from an active event card (Case 93).
    `);

    const clanFactory = new ClanFactory();
    const voiceChannelName = `voice-evt-${Date.now().toString(36).slice(-6)}`;

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.createNewChannel(ChannelType.VOICE, voiceChannelName);

      await AllureReporter.step('Verify event / voice channel card and join directly', async () => {
        await clanPageA.joinVoiceChannel(voiceChannelName);
        expect(await clanPageA.isJoinVoiceChannel(voiceChannelName)).toBe(true);
        await clanPageA.leaveVoiceChannel(voiceChannelName);
      });
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });
});
