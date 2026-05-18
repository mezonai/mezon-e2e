import { AccountCredentials, MEZON_DEV, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import {
  getUsernamesFromEmails,
  setupDualUsersInParallel,
  setupDualUsersSequentially,
} from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { getImageHash } from '@/utils/images';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { FileSizeTestHelpers } from '@/utils/uploadFileHelpers';
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
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);
  const setupModes = {
    parallel: setupDualUsersInParallel,
    sequential: setupDualUsersSequentially,
  };
  // const setupBeforeEach = setupModes.parallel;
  const setupBeforeEach = setupModes.sequential;

  test.beforeEach(async ({ dual }) => {
    await setupBeforeEach(dual, accountA, accountB, directFriendsUrl);
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

    // await AllureReporter.step('verify it is visible on friends list', async () => {
    //   const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();
    //   await friendPageB.clickTabAll();
    //   await friendPageB.searchFriend(userNameA);
    //   const friendLocator = await friendPageB.getFriend(userNameA);
    //   await profilePageB.verifyNewProfileStatusVisibleDueToLocator(
    //     friendLocator,
    //     currentProfileStatus
    //   );
    // });

    await AllureReporter.step('verify it is visible on DM list', async () => {
      const currentProfileStatus = await profilePageA.getProfileStatusInFooterProfile();
      await friendPageB.createDM(userNameA);
      const userLocator = await friendPageB.getDMByUsername(userNameA);
      console.log(userLocator);

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
    const clanPageA = new ClanPage(pageA);

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
      await clanPageA.closeSettingsClan();
    });
  });

  test('Verify message avatar remains tied to the avatar version at send-time after user updates avatar in dev', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63506',
    });

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const profilePageA = new ProfilePage(pageA);
    const messageHelperA = new MessageTestHelpers(pageA);
    const fileSizeHelpers = new FileSizeTestHelpers(pageA);

    const firstMessage = `First message before avatar change ${Date.now()}`;
    const secondMessage = `Second message after avatar change ${Date.now()}`;

    let firstAvatarHash: string | null = null;
    let secondAvatarHash: string | null = null;

    await AllureReporter.addDescription(`
        **Test Objective:** Verify that when a user updates their avatar in dev, each message keeps the avatar version that existed at the time the message was sent.

        **Test Steps:**
        1. Clean up any existing friend relationships between users
        2. User A sends a friend request to User B
        3. User B accepts the request
        4. User A creates a DM with User B and sends a first message
        5. User A navigates to dev and updates their avatar
        6. User A returns to DM and sends a second message
        7. Verify first message keeps the old avatar and second message uses the new avatar

        **Expected Result:** Each message shows the avatar version that was active when it was sent.
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

    await AllureReporter.step('User B accepts the friend request', async () => {
      await friendPageB.verifyReceivedRequestToast(`${userNameA} wants to add you as a friend`);
      await friendPageB.acceptFirstFriendRequest();
    });

    await AllureReporter.step('Verify both users see each other as friends', async () => {
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
    });

    await AllureReporter.step('User A creates DM with User B and sends first message', async () => {
      await friendPageA.createDM(userNameB);
      await messageHelperA.sendTextMessage(firstMessage);

      const firstMessageItem = messageHelperA.getMessageItemLocator(firstMessage).last();
      const firstAvatar = firstMessageItem.locator(generateE2eSelector('avatar.image'));
      await expect(firstAvatar).toBeVisible({ timeout: 5000 });
      const firstAvatarSrc = await firstAvatar.getAttribute('src');
      firstAvatarHash = await getImageHash(firstAvatarSrc || '');
      expect(firstAvatarHash).not.toBeNull();
    });

    await AllureReporter.step('User A navigates to dev and updates avatar', async () => {
      await dual.pageA.goto(joinUrlPaths(MEZON_DEV || '', ROUTES.DIRECT_FRIENDS));
      await dual.pageA.waitForTimeout(10000);

      await profilePageA.openUserSettingProfile();
      await profilePageA.openProfileTab();
      await profilePageA.openUserProfileTab();

      const newAvatarPath = await fileSizeHelpers.createFileWithSize(
        'update_avatar_dev',
        5 * 1024 * 1024,
        'jpg'
      );
      await fileSizeHelpers.uploadFileDefault(newAvatarPath);
      await profilePageA.applyImageAvatar();
      await profilePageA.saveChangesUserProfile();
      await dual.pageA.waitForTimeout(3000);
    });

    await AllureReporter.step('User A returns to the DM and sends second message', async () => {
      await dual.pageA.goto(joinUrlPaths(MEZON_DEV || '', ROUTES.DIRECT_FRIENDS));
      await dual.pageA.waitForTimeout(5000);
      await friendPageA.createDM(userNameB);

      await messageHelperA.sendTextMessage(secondMessage);

      const secondMessageItem = messageHelperA.getMessageItemLocator(secondMessage).last();
      const secondAvatar = secondMessageItem.locator(generateE2eSelector('avatar.image'));
      await expect(secondAvatar).toBeVisible({ timeout: 5000 });
      const secondAvatarSrc = await secondAvatar.getAttribute('src');
      secondAvatarHash = await getImageHash(secondAvatarSrc || '');
      expect(secondAvatarHash).not.toBeNull();
    });

    await AllureReporter.step('Verify avatar hashes match each message send-time', async () => {
      expect(firstAvatarHash).not.toBeNull();
      expect(secondAvatarHash).not.toBeNull();
      expect(firstAvatarHash).not.toEqual(secondAvatarHash);

      const firstMessageItem = messageHelperA.getMessageItemLocator(firstMessage).first();
      const firstAvatarAfter = firstMessageItem.locator(generateE2eSelector('avatar.image'));
      const firstAvatarAfterSrc = await firstAvatarAfter.getAttribute('src');
      const firstAvatarAfterHash = await getImageHash(firstAvatarAfterSrc || '');

      expect(firstAvatarAfterHash).toBe(firstAvatarHash);
    });
  });
});
