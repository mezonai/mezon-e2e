import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import {
  getUsernamesFromEmails,
  setupDualUsersInParallel,
  setupDualUsersSequentially,
} from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { expect } from '@playwright/test';
import { test } from '../../../fixtures/dual.fixture';

test.describe('Channel Message 5', () => {
  const accountA = AccountCredentials['accountKien2'];
  const accountB = AccountCredentials['accountKien3'];
  const accountC = AccountCredentials['accountKien4'];
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
    const clanFactory = new ClanFactory();
    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage5, pageA);
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

    await AllureReporter.step('verify it is visible on channel member list', async () => {
      await clanPageA.openMemberList();
      const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameA);
      await profilePageA.verifyNewProfileStatusVisibleDueToLocator(
        memberItem,
        currentProfileStatus
      );
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
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
    const clanFactory = new ClanFactory();
    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage5, pageA);
    });

    await AllureReporter.step('verify it is visible on channel short profile', async () => {
      await clanPageA.openMemberList();
      const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameA);
      await memberItem.click();
      const profileLocator = await profilePageA.getUserProfileLocator();
      await profilePageA.verifyNewProfileStatusVisibleDueToLocator(
        profileLocator,
        currentProfileStatus
      );
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
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
    const clanFactory = new ClanFactory();
    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage5, pageA);
    });

    await AllureReporter.step('verify it is visible on channel full profile', async () => {
      await clanPageA.openMemberList();
      const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameA);
      await clanPageA.openContextModalOnMemberList(memberItem);
      const profileLocator = await profilePageA.getUserProfileLocator();
      await profilePageA.verifyNewProfileStatusVisibleDueToLocator(
        profileLocator,
        currentProfileStatus
      );
      await pageA.keyboard.press('Escape');
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that user cannot forward message for another one who has been blocked', async ({
    dual,
  }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messageHelperA = new MessageTestHelpers(pageA);

    await AllureReporter.addDescription(`
        **Test Objective:** Ensure that a user cannot forward messages to a friend who has been blocked. 
        
        **Test Steps:**
        1. Users open a direct message conversation
        2. User A sends a message in the DM
        3. User A attempts to forward the message to User B (who is then blocked)
        4. User A blocks User B from the DM
        5. User A attempts to forward another message to User B after blocking
        
        **Expected Result:** User cannot forward messages to a friend who has been blocked
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

    await test.step('Open DM between User A and User B', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await test.step('User A blocks User B from the DM', async () => {
      await friendPageA.blockFriendFromDM(userNameB);
      await friendPageA.page.waitForTimeout(1000);
    });
    const clanFactory = new ClanFactory();
    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage5, pageA);
    });

    await AllureReporter.step(
      'User A send a message on channel, forward message and verify block user not in modal ',
      async () => {
        const messageContent = `Message to forward ${Date.now()}`;
        await messageHelperA.sendTextMessage(messageContent);
        await messagePageA.openForwardMessageModal();

        const isBlockedUserPresentOnForwardModal =
          await messagePageA.isChannelPresentOnForwardModal(userNameB);
        expect(isBlockedUserPresentOnForwardModal).toBe(false);

        await dual.pageA.keyboard.press('Escape');
      }
    );

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });

  test('Verify that user A can not add friend after block user B', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);

    await AllureReporter.addDescription(`
        **Test Objective:** Verify that user A can not add friend after block user B. 
        
        **Test Steps:**
        1. Users open a direct message conversation
        2. User A sends a message in the DM
        3. User A attempts to forward the message to User B (who is then blocked)
        4. User A blocks User B from the DM
        5. User A attempts to forward another message to User B after blocking
        
        **Expected Result:** Verify that user A can not add friend after block user B
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

    await test.step('Open DM between User A and User B', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    const clanFactory = new ClanFactory();
    await AllureReporter.step('User A creates a clan', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage5, pageA);
    });

    await AllureReporter.step('User A invite user B to clan and user B accept it', async () => {
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const url = await clanPageA.inviteUserToClanByUsername(userNameB);
      await pageB.waitForTimeout(1000);
      await clanPageB.joinClanByUrlInvite(url);
    });

    await test.step('User A blocks User B from the DM', async () => {
      await friendPageB.createDM(userNameA);
      await friendPageB.blockFriendFromDM(userNameA);
      await friendPageB.page.waitForTimeout(1000);
    });

    await AllureReporter.step('User A send request to add User B as friend again', async () => {
      await clanPageA.openMemberList();
      const memberItem = await clanPageA.getMemberItemIn2ndSideBarbyUsername(userNameB);
      await memberItem.click({ button: 'right' });
      const isVisible = await clanPageA.verifyAddFriendButtonVisibleOnModal();
      await expect(isVisible).toBeFalsy();
    });

    await AllureReporter.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
