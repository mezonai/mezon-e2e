import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { test } from '@/fixtures/dual.fixture';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
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
  const accountA = AccountCredentials['account2-3'];
  const accountB = AccountCredentials['account2-4'];
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

  test('Verify that I can change the system messages channel', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that I can change the system messages channel.
      
      **Test Steps:**
      1. Create a category
      2. Create a public text channel
      3. Open clan settings -> overview
      4. Update system messages channel
      5. Invite friend
      6. Accept invite
      7. Open created channel in new category
      8. Verify system message is sent on updated channel 

      **Expected Result:** I can add change the system messages channel.
    `);

    await AllureReporter.addLabels({
      tag: ['category', 'text-channel', 'system-messages-channel'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const menuPanelA = new ClanMenuPanel(pageA);
    const unique = Date.now().toString(36);
    const channelName = `tc-${unique}`.slice(0, 20);
    const categoryName = `category-${Date.now().toString(36).slice(-8)}`;

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

    await AllureReporter.step(`User A create category: ${categoryName}`, async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await menuPanelA.createCategory(categoryName);
    });

    await AllureReporter.step('Confirm category appears in sidebar', async () => {
      const isPresent = await menuPanelA.isCategoryPresent(categoryName);
      expect(isPresent).toBeTruthy();
    });

    await AllureReporter.step(`User A create new text channel: ${channelName}`, async () => {
      await clanPageA.createNewChannel(ChannelType.TEXT, channelName);
      const isNewChannelPresent = await clanPageA.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('User A update system messages channel', async () => {
      await clanPageA.openClanSettings();
      await clanPageA.updateSystemMessagesChannel(channelName, categoryName);
    });

    await AllureReporter.step(
      'Verify updated system messages channel is match data in settings page',
      async () => {
        await clanPageA.openSelectionSystemMessageChannel();
        await clanPageA.verifySelectedSystemMessageChannel(channelName, categoryName);
        await clanPageA.verifySelectedSystemMessageChannelNotInDropdown(channelName, categoryName);
        await clanPageA.closeSettingsClan();
      }
    );

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Verify that system message is sent on update channel', async () => {
      await clanPageA.verifySystemMessageIsSentOnUpdatedChannel(channelName, userNameB);
    });
  });

  test('Verify that user kicked from a clan while joining a voice will not be in the voice room', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user kicked from a clan while joining a voice will not be in the voice room
      
      **Test Steps:**
      1. User A create a clan
      2. User A invite User B
      3. User B accept
      4. User A create a voice channel
      5. User B join voice channel
      6. User A kick User B from clan

      **Expected Result:** User kicked from a clan while joining a voice will not be in the voice room
    `);

    await AllureReporter.addLabels({
      tag: ['clan', 'voice-channel', 'kick-member'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const unique = Date.now().toString(36);
    const channelName = `vc-${unique}`.slice(0, 20);

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

    await AllureReporter.step(`User A create new voice channel: ${channelName}`, async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.createNewChannel(ChannelType.VOICE, channelName);
      const isNewChannelPresent = await clanPageA.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('User B join voice channel', async () => {
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });

      await clanPageB.joinVoiceChannel(channelName);
      const isUserInVoiceChannel = await clanPageB.isJoinVoiceChannel(channelName);
      expect(isUserInVoiceChannel).toBe(true);
    });

    await AllureReporter.step('User A kick User B from clan', async () => {
      await clanPageA.openMemberList();
      await clanPageA.kickUserByName(userNameB);
    });

    await AllureReporter.step(
      'Verify that user kicked from a clan while joining a voice will not be in the voice room',
      async () => {
        const isInClan = await clanPageB.isClanPresent(clanFactory.getClanName());
        expect(isInClan).toBeFalsy();
      }
    );

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await friendPageB.createDM(userNameA);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step('Verify that user B not in last voice channel', async () => {
      await pageB.reload();
      await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageB.joinVoiceChannel(channelName);
      const isUserInVoiceChannel = await clanPageB.isJoinVoiceChannel(channelName);
      expect(isUserInVoiceChannel).toBe(false);
    });
  });

  test('Verify that short profile is unknown user after kick user from clan', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64953',
      github_issue: '9684',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that short profile is unknown user after kick user from clan
      
      **Test Steps:**
      1. Invite User B to clan
      2. Kick User B from clan
      3. Click mention User B in message
      4. Verify short profile is unknown user.
      **Expected Result:** Short profile is unknown user after kick user from clan.
    `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messagePageA = new MessagePage(pageA);
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
    });

    await AllureReporter.step('Kick User B from clan', async () => {
      await pageA.waitForTimeout(3000);
      await clanPageA.openMemberList();
      await clanPageA.kickUserByName(userNameB);
    });

    await AllureReporter.step('Click mention User B in message', async () => {
      const systemMessage = await messageHelperA.getSystemMessageByType(5);
      await systemMessage.last().waitFor({ state: 'visible' });
      await systemMessage.click();
      const mentionUser = await messageHelperA.getWelcomeMessageMentionUser(systemMessage.last());
      await mentionUser.click();
    });

    await AllureReporter.step('Verify on short profile, display anonymous avatar', async () => {
      await messagePageA.verifyShortProfileIsUnknownUser();
    });
  });

  test('Veify that I have admin permissions after add role with admin permissions', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64954',
      github_issue: '9685',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that I have admin permissions after add role with admin permissions.

      **Test Steps:**
      1. Invite User B to clan
      2. Add new role with admin permissions to User B
      3. Login User B and verify admin permissions
      **Expected Result:** I have admin permissions after add role with admin permissions.
    `);

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const roleName = `role-${Date.now().toString(36).slice(-8)}`;
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
    });

    await AllureReporter.step(
      'Verify that user B has not admin permission before add role',
      async () => {
        await pageB.reload();
        await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await clanPageB.openClanSettings();
        await clanPageB.verifyAdministratorPermissionRole(false);
        await clanPageB.closeSettingsClan();
      }
    );

    await AllureReporter.step('Add new role with admin permissions to User B', async () => {
      await clanPageA.openRoleSettingsPage();
      await clanPageA.createRoleWithPermission(roleName, 'Administrator');
      await clanPageA.addRoleForUserByUsername(userNameB, roleName);
    });

    await AllureReporter.step(
      'Verify that user B has admin permission after add role',
      async () => {
        await pageB.reload();
        await pageB.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
        await clanPageB.openClanSettings();
        await clanPageB.verifyAdministratorPermissionRole();
      }
    );
    await AllureReporter.step('Verify that user B cannot edit edit role itself', async () => {
      await clanPageB.verifyUserCannotEditRoleItself(roleName);
      await clanPageB.closeSettingsClan();
    });
  });
});
