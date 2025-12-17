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
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect } from '@playwright/test';

test.describe('Clan Management', () => {
  const accountA = AccountCredentials['accountKien7'];
  const accountB = AccountCredentials['accountKien8'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const clanFactory = new ClanFactory();
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.clanManagement,
      credentials: accountA,
    });
  });

  test.beforeEach(async ({ dual }) => {
    await dual.parallel({
      A: async () => {
        const credentials = await AuthHelper.setupAuthWithEmailPassword(dual.pageA, accountA);
        await AuthHelper.prepareBeforeTest(
          dual.pageA,
          joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS),
          credentials
        );
      },
      B: async () => {
        const credentials = await AuthHelper.setupAuthWithEmailPassword(dual.pageB, accountB);
        await AuthHelper.prepareBeforeTest(
          dual.pageB,
          joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS),
          credentials
        );
      },
    });
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({
      browser,
      clanFactory,
      credentials: accountA,
    });
  });

  test.afterEach(async ({ dual }) => {
    await dual.parallel({
      A: async page => {
        await AuthHelper.logout(page);
      },
      B: async page => {
        await AuthHelper.logout(page);
      },
    });
  });

  test('Verify that I can mark as read on clan', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that I can mark as read on clan.
      
      **Test Steps:**
      1. Create channels
      2. Send text on channels
      3. Invite friend
      4. Accept invite
      5. Verify channels with new messages have highlight
      6. Accept invite
      7. Click mark as read
      8. Verify channels with new messages not have highlight

      **Expected Result:** Verify that I can mark as read on clan.
    `);

    await AllureReporter.addLabels({
      tag: ['category', 'text-channel', 'system-messages-channel'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const unique = Date.now().toString(36);
    const channelNames = [`tc1-${unique}`.slice(0, 20), `tc2-${unique}`.slice(0, 20)];
    const messageHelperA = new MessageTestHelpers(pageA);

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
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

    await AllureReporter.step(
      `User A create new text channels and send message on channels: ${channelNames.join(', ')}`,
      async () => {
        await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        for (const name of channelNames) {
          await clanPageA.createNewChannel(ChannelType.TEXT, name);
          const isNewChannelPresent = await clanPageA.isNewChannelPresent(name);
          expect(isNewChannelPresent).toBe(true);
          await messageHelperA.sendTextMessage('Text message');
        }
      }
    );

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
    });

    await AllureReporter.step('Verify that channels with new messages have highlight', async () => {
      for (const name of channelNames) {
        await clanPageB.verifyChannelHasHighlight(name);
      }
    });
    await AllureReporter.step('User B click mark as read', async () => {
      await clanPageB.clickButtonMarkAsReadFromMenu();
    });
    await AllureReporter.step(
      'Verify that channels with new messages not have have highlight',
      async () => {
        for (const name of channelNames) {
          await clanPageB.verifyChannelHasHighlight(name, false);
        }
      }
    );
  });
});
