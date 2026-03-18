import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect } from '@playwright/test';
import { test } from '../../../fixtures/dual.fixture';

test.describe('Direct Message', () => {
  const accountA = AccountCredentials['account2-3'];
  const accountB = AccountCredentials['account2-4'];
  const accountC = AccountCredentials['account2-5'];
  const CLEANUP_STEP_NAME = 'Clean up existing friend relationships';
  const SEND_REQUEST_STEP_NAME = 'User A sends friend request to User B';
  const [userNameA, userNameB, userNameC] = getUsernamesFromEmails([
    accountA.email,
    accountB.email,
    accountC.email,
  ]);

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

  test.afterEach(async ({ dual }) => {
    // const { pageA, pageB } = dual;
    // const messagePageA = new MessagePage(pageA);
    // const messagePageB = new MessagePage(pageB);
    await dual.parallel({
      A: async page => {
        // await messagePageA.leaveGroupByName(nameGroupChat);
        await AuthHelper.logout(page);
      },
      B: async page => {
        // await messagePageB.leaveGroupByName(nameGroupChat);
        await AuthHelper.logout(page);
      },
    });
  });

  test('Verify that user can set profile status and verify it is visible on short profile', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64803',
      github_issue: '10162',
    });
    const { pageA } = dual;
    const profilePage = new ProfilePage(pageA);
    await AllureReporter.addDescription(`
        **Test Objective:** Verify that user can set profile status and verify it is visible on short profile
        **Test Steps:**
        1. User A set profile status to 'Do Not Disturb' for '30 Minutes'
        2. Verify that new profile status is visible on User A's short profile 
        **Expected Result:** User can set profile status and verify it is visible on short profile
      `);

    await AllureReporter.step(
      "User A set profile status to 'Do Not Disturb' for '30 Minutes'",
      async () => {
        await profilePage.openFooterProfileModal();
        await profilePage.openSelectProfileStatusModal();

        await profilePage.setProfileStatus('Do Not Disturb', 'For 30 Minutes');
      }
    );
    await AllureReporter.step('verify it is visible on short profile', async () => {
      const currentProfileStatus = await profilePage.getProfileStatusInFooterProfile();
      expect(currentProfileStatus).toContain('Do Not Disturb');
      await profilePage.openFooterProfileModal();
      await profilePage.verifyNewStatusVisibleShortProfile(currentProfileStatus);
    });
  });

  test('Verify that profile status reflect correct on DM list, friend list', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64803',
      github_issue: '10162',
    });
    const { pageA, pageB } = dual;
    const profilePageA = new ProfilePage(pageA);
    const profilePageB = new ProfilePage(pageB);
    const friendPageB = new FriendPage(pageB);
    const friendPageA = new FriendPage(pageA);
    await AllureReporter.addDescription(`
        **Test Objective:** Verify that profile status reflect correct on DM list, friend list
        **Test Steps:**
        1. User A set profile status to 'Do Not Disturb' for '30 Minutes'
        2. Verify that new profile status reflect correct on DM list, friend list 

        **Expected Result:** Profile status reflect correct on DM list, friend list
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
        await profilePageA.openFooterProfileModal();
        await profilePageA.openSelectProfileStatusModal();

        await profilePageA.setProfileStatus('Do Not Disturb', 'For 30 Minutes');
      }
    );

    await AllureReporter.step('verify it is visible on friends list', async () => {
      const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();
      await friendPageB.clickTabAll();
      await friendPageB.searchFriend(userNameA);
      const friendLocator = await friendPageB.getFriend(userNameA);
      await profilePageB.verifyNewProfileStatusVisibleDueToLocator(
        friendLocator,
        currentProfileStatus
      );
    });

    await AllureReporter.step('verify it is visible on DM list', async () => {
      const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();
      await friendPageB.createDM(userNameA);
      const userLocator = await friendPageB.getDMByUsername(userNameA);
      await profilePageB.verifyNewProfileStatusVisibleDueToLocator(
        userLocator,
        currentProfileStatus
      );
    });
  });

  test('Verify that profile status reflect correct on DM profile, header DM', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64803',
      github_issue: '10162',
    });
    const { pageA, pageB } = dual;
    const messagePageB = new MessagePage(pageB);
    const profilePageA = new ProfilePage(pageA);
    const profilePageB = new ProfilePage(pageB);
    const friendPageB = new FriendPage(pageB);
    const friendPageA = new FriendPage(pageA);

    await AllureReporter.addDescription(`
        **Test Objective:** Verify that profile status reflect correct on DM profile, header DM
        **Test Steps:**
        1. User A set profile status to 'Do Not Disturb' for '30 Minutes'
        2. Verify that new profile status reflect correct on DM profile, header DM
        
        **Expected Result:** Profile status reflect correct on DM profile, header DM
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
        await profilePageA.openFooterProfileModal();
        await profilePageA.openSelectProfileStatusModal();

        await profilePageA.setProfileStatus('Do Not Disturb', 'For 30 Minutes');
      }
    );

    const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();

    await AllureReporter.step('verify it is visible on header DM', async () => {
      await friendPageB.createDM(userNameA);

      const headerDMLocator = await messagePageB.getHeaderDM();
      await profilePageB.verifyNewProfileStatusVisibleDueToLocator(
        headerDMLocator,
        currentProfileStatus
      );
    });

    test('verify it is visible on profile of DM', async () => {
      await messagePageB.openUserProfile();
      const profileLocator = await profilePageB.getUserProfileLocator();
      await profilePageB.verifyNewProfileStatusVisibleDueToLocator(
        profileLocator,
        currentProfileStatus
      );
    });
  });

  test('Verify that profile status reflect correct on user settings', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64803',
      github_issue: '10162',
    });
    const { pageA, pageB } = dual;
    const profilePageA = new ProfilePage(pageA);
    const friendPageB = new FriendPage(pageB);
    const friendPageA = new FriendPage(pageA);

    await AllureReporter.addDescription(`
        **Test Objective:** Verify that profile status reflect correct on user settings
        **Test Steps:**
        1. User A set profile status to 'Do Not Disturb' for '30 Minutes'
        2. Verify that new profile status reflect correct on user settings
        
        **Expected Result:** Profile status reflect correct on user settings
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
        await profilePageA.openFooterProfileModal();
        await profilePageA.openSelectProfileStatusModal();

        await profilePageA.setProfileStatus('Do Not Disturb', 'For 30 Minutes');
      }
    );

    const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();

    await AllureReporter.step('verify it is visible on user settings', async () => {
      await profilePageA.openUserSettingProfile();
      await profilePageA.openProfileTab();
      await profilePageA.openUserProfileTab();

      const profileLocator = await profilePageA.getUserProfileLocator();
      await profilePageA.verifyNewProfileStatusVisibleDueToLocator(
        profileLocator,
        currentProfileStatus
      );
    });
  });
});
