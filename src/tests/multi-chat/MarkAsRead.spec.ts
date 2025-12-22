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

test.describe('Mark as read', () => {
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

  test('Verify that I can mark as read on clan (badge from mention name) ', async ({ dual }) => {
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
      2. Invite friend
      3. Accept invite
      4. Mention on channels
      5. Verify channels with new mentions have badge
      6. Verify clan has badge
      7. Verify inbox header has badge
      8. Click mark as read
      9. Verify channels with new mentions not have badge
      9. Verify clan not has badge
      9. Verify inbox header not has badge

      **Expected Result:** Verify that I can mark as read on clan.
    `);

    await AllureReporter.addLabels({
      tag: ['clan', 'text-channel', 'channel-badge', 'header-inbox', 'mark-as-read'],
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

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
    });

    await AllureReporter.step(
      `User A create new text channels and mentions user B on channels: ${channelNames.join(', ')}`,
      async () => {
        for (const name of channelNames) {
          await clanPageA.createNewChannel(ChannelType.TEXT, name);
          const isNewChannelPresent = await clanPageA.isNewChannelPresent(name);
          expect(isNewChannelPresent).toBe(true);
          await messageHelperA.mentionUserAndSend(`@${userNameB}`, [userNameB]);
        }
      }
    );

    await AllureReporter.step('Verify that channels with new mentions have badges', async () => {
      await pageB.reload();
      for (const name of channelNames) {
        await clanPageB.verifyChannelHasBadge(name);
      }
    });

    await AllureReporter.step('Verify that clan have badges', async () => {
      const clanItem = await clanPageB.getClanItemByName(clanFactory.getClanName());
      await clanPageB.verifyClanHasBadge(channelNames.length, clanItem);
    });

    await AllureReporter.step('Verify that inbox button has badge', async () => {
      await clanPageB.verifyInboxButtonHasBadge();
    });

    await AllureReporter.step('User B click mark as read', async () => {
      await clanPageB.clickButtonMarkAsReadFromMenu();
    });

    await AllureReporter.step(
      'Verify that channels with new mentions not have badges',
      async () => {
        for (const name of channelNames) {
          await clanPageB.verifyChannelHasBadge(name, false);
        }
      }
    );

    await AllureReporter.step('Verify that clan not have badges', async () => {
      const clanItem = await clanPageB.getClanItemByName(clanFactory.getClanName());
      await clanPageB.verifyClanHasBadge(channelNames.length, clanItem, false);
    });

    await AllureReporter.step('Verify that inbox button not has badge', async () => {
      await clanPageB.verifyInboxButtonHasBadge(false);
    });
  });

  test('Verify that I can mark as read on clan (highlight on channel name)', async ({ dual }) => {
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
      6. Click mark as read
      7. Verify channels with new messages not have highlight

      **Expected Result:** Verify that I can mark as read on clan.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-highlight', 'text-channel', 'clan', 'mark-as-read'],
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

  test('Verify that I can mark as read on channel (highlight)', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that I can mark as read on clan.
      
      **Test Steps:**
      1. Create channel
      2. Send text on channel
      3. Invite friend
      4. Accept invite
      5. Verify channels with new messages have highlight
      6. Accept invite
      7. Click mark as read on channel
      8. Verify channels with new messages not have highlight

      **Expected Result:** Verify that I can mark as read on clan.
    `);

    await AllureReporter.addLabels({
      tag: ['text-channel', 'mark-as-read', 'channel-highlight'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const unique = Date.now().toString(36);
    const channelName = `tc1-${unique}`.slice(0, 20);
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
      `User A create new text channels and send message on channels: ${channelName}`,
      async () => {
        await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await clanPageA.createNewChannel(ChannelType.TEXT, channelName);
        const isNewChannelPresent = await clanPageA.isNewChannelPresent(channelName);
        expect(isNewChannelPresent).toBe(true);
        await messageHelperA.sendTextMessage('Text message');
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
      await clanPageB.verifyChannelHasHighlight(channelName);
    });
    await AllureReporter.step('User B click mark as read', async () => {
      await clanPageB.clickButtonMarkAsReadFromChannel(channelName);
    });
    await AllureReporter.step(
      'Verify that channels with new messages not have have highlight',
      async () => {
        await clanPageB.verifyChannelHasHighlight(channelName, false);
      }
    );
  });

  test('Verify that I can mark as read on channel (mention)', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that I can mark as read on clan.
      
      **Test Steps:**
      1. Create channel
      2. Send text on channel
      3. Invite friend
      4. Accept invite
      5. Verify channels with new messages have highlight
      6. Accept invite
      7. Click mark as read on channel
      8. Verify channels with new messages not have highlight

      **Expected Result:** Verify that I can mark as read on clan.
    `);

    await AllureReporter.addLabels({
      tag: ['text-channel', 'mark-as-read', 'channel-mentions'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const unique = Date.now().toString(36);
    const channelName = `tc1-${unique}`.slice(0, 20);
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

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
    });

    await AllureReporter.step(
      `User A create new text channels and mentions user B on channels: ${channelName}`,
      async () => {
        await clanPageA.createNewChannel(ChannelType.TEXT, channelName);
        const isNewChannelPresent = await clanPageA.isNewChannelPresent(channelName);
        expect(isNewChannelPresent).toBe(true);
        await messageHelperA.mentionUserAndSend(`@${userNameB}`, [userNameB]);
      }
    );

    await AllureReporter.step('Verify that channels with new mentions have badges', async () => {
      await pageB.reload();
      await clanPageB.verifyChannelHasBadge(channelName);
    });

    await AllureReporter.step('Verify that clan have badges', async () => {
      const clanItem = await clanPageB.getClanItemByName(clanFactory.getClanName());
      await clanPageB.verifyClanHasBadge(1, clanItem);
    });

    await AllureReporter.step('Verify that inbox button has badge', async () => {
      await clanPageB.verifyInboxButtonHasBadge();
    });

    await AllureReporter.step('User B click mark as read', async () => {
      await clanPageB.clickButtonMarkAsReadFromChannel(channelName);
    });

    await AllureReporter.step(
      'Verify that channels with new mentions not have badges',
      async () => {
        await clanPageB.verifyChannelHasBadge(channelName, false);
      }
    );

    await AllureReporter.step('Verify that clan not have badges', async () => {
      const clanItem = await clanPageB.getClanItemByName(clanFactory.getClanName());
      await clanPageB.verifyClanHasBadge(1, clanItem, false);
    });

    await AllureReporter.step('Verify that inbox button not has badge', async () => {
      await clanPageB.verifyInboxButtonHasBadge(false);
    });
  });

  test('Verify that I can mark as read on direct message (highlight)', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that I can mark as read on direct message.
      
      **Test Steps:**
      1. User A send message for user B
      2. Verify user A on friends list with new messages have highlight
      3. Click mark as read on message
      4. Verify user A on friends list with new messages not have highlight

      **Expected Result:** I can mark as read on direct message.
    `);

    await AllureReporter.addLabels({
      tag: ['direct-message', 'mark-as-read', 'highlight'],
    });

    const messageHelperA = new MessageTestHelpers(pageA);
    const messageHelperB = new MessageTestHelpers(pageB);

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
      await friendPageA.createDM(userNameB);
    });

    await AllureReporter.step(`User A send message to user B on direct message:`, async () => {
      await messageHelperA.sendTextMessage('Text message');
      await pageA.waitForTimeout(3000);
    });

    await AllureReporter.step(
      'Verify user A on friends list with new messages have highlight',
      async () => {
        await messageHelperB.verifyUserOnDMHasHighlight(userNameA);
      }
    );
    await AllureReporter.step('User B click mark as read', async () => {
      await messageHelperB.clickButtonMarkAsReadByUsername(userNameA);
    });
    await AllureReporter.step(
      'Verify that channels with new messages not have have highlight',
      async () => {
        await messageHelperB.verifyUserOnDMHasHighlight(userNameA, false);
      }
    );
  });
});
