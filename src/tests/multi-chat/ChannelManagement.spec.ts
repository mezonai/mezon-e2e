import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect } from '@playwright/test';
import { test } from '../../fixtures/dual.fixture';

test.describe('Channel Management', () => {
  const accountA = AccountCredentials['account2-1'];
  const accountB = AccountCredentials['account2-2'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage1,
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

  test('Verify that I can add members and roles to channel when update channel from public to private', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that I can add members and roles to channel when update channel from public to private.
      
      **Test Steps:**
      1. Create a public text channel
      2. Create new role
      3. Invite people to clan
      4. Open settings channel
      5. Open permission tab
      6. Update channel status to private
      7. Add members and roles
      
      **Expected Result:** I can add members and roles to channel when update channel from public to private.
    `);

    await AllureReporter.addLabels({
      tag: ['text-channel', 'private-channel', 'members', 'roles'],
    });

    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const userNameA = accountA.email.split('@')[0];
    const userNameB = accountB.email.split('@')[0];
    const unique = Date.now().toString(36);
    const roleName = `Role-${unique}`.slice(0, 20);
    const channelName = `tc-${unique}`.slice(0, 20);
    const channelSettingsA = new ChannelSettingPage(pageA);

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

    await AllureReporter.step('User A add a new role', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.openRoleSettingsPage();
      await clanPageA.addNewRoleOnClan(roleName);
    });

    await AllureReporter.step(`User A create new text channel: ${channelName}`, async () => {
      await clanPageA.createNewChannel(ChannelType.TEXT, channelName);
      const isNewChannelPresent = await clanPageA.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await AllureReporter.step(
      'User A update channel to private and add members, roles',
      async () => {
        await clanPageA.openChannelSettings(channelName);
        await channelSettingsA.openPermissionsTab();
        await channelSettingsA.updateChannelStatusAndOpenAddMembersRolesModal();
        await channelSettingsA.addMembersAndRolesForPrivateChannel(roleName, userNameB);
      }
    );

    await AllureReporter.step(
      'Verify that added roles and members is visible on permission tab of channels settings',
      async () => {
        await channelSettingsA.verifyRoleAndMemberExistBeforeSave(roleName, userNameB);
        await channelSettingsA.verifyRoleAndMemberExistAfterSave(roleName, userNameB);
        await channelSettingsA.closeChannelSettings();
      }
    );
  });
});
