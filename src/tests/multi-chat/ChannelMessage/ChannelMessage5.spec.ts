import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { test } from '../../../fixtures/dual.fixture';

test.describe('Channel Message 5', () => {
  const accountA = AccountCredentials['accountKien2'];
  const accountB = AccountCredentials['accountKien3'];
  const accountC = AccountCredentials['accountKien4'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const clanFactory = new ClanFactory();
  const [userNameA, userNameB, userNameC] = getUsernamesFromEmails([
    accountA.email,
    accountB.email,
    accountC.email,
  ]);

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
  test('Verify that profile status reflect correct on channel member list', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64803',
      github_issue: '10162',
    });
    const { pageA, pageB } = dual;
    const profilePageA = new ProfilePage(pageA);
    const friendPageB = new FriendPage(pageB);
    const friendPageA = new FriendPage(pageA);
    const clanPageA = new ClanPage(pageA);

    await AllureReporter.addDescription(`
          **Test Objective:** Verify that profile status reflect correct on channel member list
          **Test Steps:**
          1. User A set profile status to 'Do Not Disturb' for '30 Minutes'
          2. Verify that new profile status reflect correct on channel member list
          
          **Expected Result:** Profile status reflect correct on channel member list
        `);

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
      await friendPageA.cleanupFriendRelationships(userNameC);
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
    });

    await AllureReporter.step(
      "User A set profile status to 'Do Not Disturb' for '30 Minutes'",
      async () => {
        const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();
        await profilePageA.openFooterProfileModal();
        await profilePageA.openSelectProfileStatusModal(currentProfileStatus);

        await profilePageA.setProfileStatus('Do Not Disturb', 'For 30 Minutes');
      }
    );

    const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();

    await AllureReporter.step('verify it is visible on channel member list', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.openMemberList();
      const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameA);
      await profilePageA.verifyNewProfileStatusVisibleDueToLocator(
        memberItem,
        currentProfileStatus
      );
    });
  });

  test('Verify that profile status reflect correct on channel short profile', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64803',
      github_issue: '10162',
    });
    const { pageA, pageB } = dual;
    const profilePageA = new ProfilePage(pageA);
    const friendPageB = new FriendPage(pageB);
    const friendPageA = new FriendPage(pageA);
    const clanPageA = new ClanPage(pageA);

    await AllureReporter.addDescription(`
          **Test Objective:** Verify that profile status reflect correct on channel short profile
          **Test Steps:**
          1. User A set profile status to 'Do Not Disturb' for '30 Minutes'
          2. Verify that new profile status reflect correct on channel short profile
          
          **Expected Result:** Profile status reflect correct on channel short profile
        `);

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
      await friendPageA.cleanupFriendRelationships(userNameC);
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
    });

    await AllureReporter.step(
      "User A set profile status to 'Do Not Disturb' for '30 Minutes'",
      async () => {
        const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();
        await profilePageA.openFooterProfileModal();
        await profilePageA.openSelectProfileStatusModal(currentProfileStatus);

        await profilePageA.setProfileStatus('Do Not Disturb', 'For 30 Minutes');
      }
    );

    const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();

    await AllureReporter.step('verify it is visible on channel short profile', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.openMemberList();
      const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameA);
      await memberItem.click();
      const profileLocator = await profilePageA.getUserProfileLocator();
      await profilePageA.verifyNewProfileStatusVisibleDueToLocator(
        profileLocator,
        currentProfileStatus
      );
    });
  });

  test('Verify that profile status reflect correct on channel full profile', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64803',
      github_issue: '10162',
    });
    const { pageA, pageB } = dual;
    const profilePageA = new ProfilePage(pageA);
    const friendPageB = new FriendPage(pageB);
    const friendPageA = new FriendPage(pageA);
    const clanPageA = new ClanPage(pageA);

    await AllureReporter.addDescription(`
          **Test Objective:** Verify that profile status reflect correct on channel full profile
          **Test Steps:**
          1. User A set profile status to 'Do Not Disturb' for '30 Minutes'
          2. Verify that new profile status reflect correct on channel full profile
          
          **Expected Result:** Profile status reflect correct on channel full profile
        `);

    await AllureReporter.step(CLEANUP_STEP_NAME, async () => {
      await FriendHelper.cleanupMutualFriendRelationships(
        friendPageA,
        friendPageB,
        userNameA,
        userNameB
      );
      await friendPageA.cleanupFriendRelationships(userNameC);
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
    });

    await AllureReporter.step(
      "User A set profile status to 'Do Not Disturb' for '30 Minutes'",
      async () => {
        const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();
        await profilePageA.openFooterProfileModal();
        await profilePageA.openSelectProfileStatusModal(currentProfileStatus);

        await profilePageA.setProfileStatus('Do Not Disturb', 'For 30 Minutes');
      }
    );

    const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();

    await AllureReporter.step('verify it is visible on channel full profile', async () => {
      await pageA.goto(clanFactory.getClanUrl(), { waitUntil: 'domcontentloaded' });
      await clanPageA.openMemberList();
      const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameA);
      await memberItem.click({ button: 'right' });
      const profileLocator = await profilePageA.getUserProfileLocator();
      await profilePageA.verifyNewProfileStatusVisibleDueToLocator(
        profileLocator,
        currentProfileStatus
      );
    });
  });
});
