import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { FriendHelper } from '@/utils/friend.helper';

import joinUrlPaths from '@/utils/joinUrlPaths';

import { test } from '@/fixtures/dual.fixture';

test.describe('Friend Management - Block User', () => {
  const accountA = AccountCredentials['accountKien10'];
  const accountB = AccountCredentials['accountKien1'];
  const userNameA = accountA.email.split('@')[0];
  const userNameB = accountB.email.split('@')[0];
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
        await dual.pageB.waitForTimeout(200);
        const credentials = await AuthHelper.setupAuthWithEmailPassword(dual.pageB, accountB);
        await AuthHelper.prepareBeforeTest(
          dual.pageB,
          joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS),
          credentials
        );
      },
    });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

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
    await test.step('Establish friendship between users', async () => {
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageB.acceptFirstFriendRequest();
      await friendPageA.assertAllFriend(userNameB);
    });
  });
  test.afterEach(async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await Promise.allSettled([
      friendPageA.unblockFriend(userNameB),
      friendPageB.unblockFriend(userNameA),
    ]);
    await dual.parallel({
      A: async () => {
        await AuthHelper.logout(dual.pageA);
      },
      B: async () => {
        await AuthHelper.logout(dual.pageB);
      },
    });
  });

  // test('Blocked users excluded from DM member search and add-member flows', async ({ dual }) => {
  //   await AllureReporter.addWorkItemLinks({
  //     tms: '63492',
  //   });
  //   const { pageA, pageB } = dual;
  //   const friendPageA = new FriendPage(pageA);
  //   const friendPageB = new FriendPage(pageB);
  //   const messagePageA = new MessagePage(pageA);
  //   const messagePageB = new MessagePage(pageB);
  //   const accountC = AccountCredentials['account2-1'];
  //   const userNameC = accountC.email.split('@')[0];
  //   const dmSearchPlaceholder = 'Type the username of a friend';
  //   const friendListItemSelector = '[data-e2e="chat.direct_message.friend_list.friend_item"]';

  //   await AllureReporter.addDescription(`
  //     **Test Objective:** Verify blocked friends are filtered out from the DM picker and add-member modal through \`useFriends.filteredFriends\`.

  //     **Test Steps:**
  //     1. Establish friendships between User A, User B, and auxiliary User C
  //     2. Confirm User B is available in both DM creation and add-member modals before blocking
  //     3. User A blocks User B
  //     4. Validate User B is hidden from DM creation and add-member modals for User A
  //     5. Validate blocked User B cannot find User A when initiating a DM
  //     6. Remove the auxiliary friendship

  //     **Expected Result:** Blocked users never appear in DM search or add-member flows, while other friends remain searchable.
  //   `);

  //   await test.step('Ensure no existing friendship with User C and send request', async () => {
  //     await friendPageA.removeFriend(userNameC);
  //     await friendPageA.removeFriendRequest(userNameC);
  //     await friendPageA.sendFriendRequestToUser(userNameC);
  //   });

  //   await test.step('User C accepts User A friend request', async () => {
  //     const { pageC } = dual;

  //     const credentialsC = await AuthHelper.setupAuthWithEmailPassword(pageC, accountC);
  //     await AuthHelper.prepareBeforeTest(
  //       pageC,
  //       joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS),
  //       credentialsC
  //     );
  //     const friendPageC = new FriendPage(pageC);
  //     await friendPageC.acceptFirstFriendRequest();
  //     await friendPageC.assertAllFriend(userNameA);
  //   });

  //   await test.step('User B logs back in and friendship with User A is verified', async () => {
  //     await friendPageB.assertAllFriend(userNameA);
  //     await friendPageA.gotoFriendsPage();
  //     await friendPageA.assertAllFriend(userNameC);
  //   });

  //   await test.step('User B appears in add-member modal before blocking', async () => {
  //     await friendPageA.createDM(userNameC);
  //     await expect(messagePageA.dmHeaderAddMemberAction).toBeVisible({ timeout: 10000 });
  //     await messagePageA.dmHeaderAddMemberAction.click();
  //     const addMemberSearch = pageA.getByPlaceholder(dmSearchPlaceholder);
  //     await addMemberSearch.waitFor({ state: 'visible', timeout: 5000 });
  //     await addMemberSearch.fill(userNameB);
  //     const candidateBeforeBlock = pageA
  //       .locator(friendListItemSelector)
  //       .filter({ hasText: userNameB });
  //     await expect(candidateBeforeBlock).toHaveCount(1);
  //     await pageA.keyboard.press('Escape');
  //     await addMemberSearch.waitFor({ state: 'detached', timeout: 5000 });
  //   });

  //   await test.step('User B appears in DM creation modal before blocking', async () => {
  //     await messagePageA.buttonCreateGroupSidebar.click();
  //     const dmSearchInput = pageA.getByPlaceholder(dmSearchPlaceholder);
  //     await dmSearchInput.waitFor({ state: 'visible', timeout: 5000 });
  //     await dmSearchInput.fill(userNameB);
  //     const dmCandidateB = pageA.locator(friendListItemSelector).filter({ hasText: userNameB });
  //     await expect(dmCandidateB).toHaveCount(1);
  //     await dmSearchInput.fill(userNameC);
  //     const dmCandidateC = pageA.locator(friendListItemSelector).filter({ hasText: userNameC });
  //     await expect(dmCandidateC).toHaveCount(1);
  //     await pageA.keyboard.press('Escape');
  //     await dmSearchInput.waitFor({ state: 'detached', timeout: 5000 });
  //   });

  //   await test.step('User A blocks User B', async () => {
  //     await friendPageA.blockFriend(userNameB);
  //     await friendPageA.assertBlockFriend(userNameB);
  //   });

  //   await test.step('User B is hidden in DM creation modal after blocking', async () => {
  //     await messagePageA.buttonCreateGroupSidebar.click();
  //     const dmSearchInput = pageA.getByPlaceholder(dmSearchPlaceholder);
  //     await dmSearchInput.waitFor({ state: 'visible', timeout: 5000 });
  //     await dmSearchInput.fill(userNameB);
  //     const blockedCandidate = pageA.locator(friendListItemSelector).filter({ hasText: userNameB });
  //     await expect(blockedCandidate).toHaveCount(0);
  //     await dmSearchInput.fill(userNameC);
  //     const stillVisibleFriend = pageA
  //       .locator(friendListItemSelector)
  //       .filter({ hasText: userNameC });
  //     await expect(stillVisibleFriend).toHaveCount(1);
  //     await pageA.keyboard.press('Escape');
  //     await dmSearchInput.waitFor({ state: 'detached', timeout: 5000 });
  //   });

  //   await test.step('User B is hidden in add-member modal after blocking', async () => {
  //     await friendPageA.createDM(userNameC);
  //     await expect(messagePageA.dmHeaderAddMemberAction).toBeVisible({ timeout: 10000 });
  //     await messagePageA.dmHeaderAddMemberAction.click();
  //     const addMemberSearch = pageA.getByPlaceholder(dmSearchPlaceholder);
  //     await addMemberSearch.waitFor({ state: 'visible', timeout: 5000 });
  //     await addMemberSearch.fill(userNameB);
  //     const blockedCandidateAddMember = pageA
  //       .locator(friendListItemSelector)
  //       .filter({ hasText: userNameB });
  //     await expect(blockedCandidateAddMember).toHaveCount(0);
  //     await pageA.keyboard.press('Escape');
  //     await addMemberSearch.waitFor({ state: 'detached', timeout: 5000 });
  //   });

  //   await test.step('Blocked User B cannot find User A when creating DM', async () => {
  //     await messagePageB.gotoDMPage();
  //     await messagePageB.buttonCreateGroupSidebar.click();
  //     const dmSearchInputB = pageB.getByPlaceholder(dmSearchPlaceholder);
  //     await dmSearchInputB.waitFor({ state: 'visible', timeout: 5000 });
  //     await dmSearchInputB.fill(userNameA);
  //     const candidateAOnB = pageB.locator(friendListItemSelector).filter({ hasText: userNameA });
  //     await expect(candidateAOnB).toHaveCount(0);
  //     await pageB.keyboard.press('Escape');
  //     await dmSearchInputB.waitFor({ state: 'detached', timeout: 5000 });
  //   });

  //   await test.step('Cleanup auxiliary friendship with User C', async () => {
  //     await friendPageA.removeFriend(userNameC);
  //   });
  // });

  test('Should remove call action in DM header after blocking friend', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Confirm that blocking a friend removes the call action from the DM header for both participants. 
      
      **Test Steps:**
      1. Users open a direct message conversation
      2. Verify the call action is visible in the header for both users
      3. User A blocks User B from the DM
      4. Validate that the call action disappears for both users
      
      **Expected Result:** The call action is no longer available in the DM header for either side once the block is applied.
    `);

    await test.step('Open DM between User A and User B', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await test.step('Verify call action visible before blocking', async () => {
      await messagePageA.assertDMHeaderCallVisible();
      await messagePageB.assertDMHeaderCallVisible();
    });

    await test.step('User A blocks User B from the DM', async () => {
      await friendPageA.blockFriendFromDM(userNameB);
      await friendPageA.page.waitForTimeout(1000);
    });

    await test.step('Verify call action removed for blocked pair', async () => {
      await messagePageA.assertDMHeaderCallNotVisible();
      await messagePageB.assertDMHeaderCallNotVisible();
    });
  });

  test('Should remove add member action in DM header after blocking friend', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Ensure blocking a friend removes the add member action from the DM header for the blocked pair. 
      
      **Test Steps:**
      1. Users open a direct message conversation
      2. Verify the add member action is visible in the header for both users
      3. User A blocks User B from the DM
      4. Confirm the add member action is removed for both users
      
      **Expected Result:** The DM header no longer shows the add member action for either side after blocking.
    `);

    await test.step('Open DM between User A and User B', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await test.step('Verify add member action visible before blocking', async () => {
      await messagePageA.assertDMHeaderAddMemberVisible();
      await messagePageB.assertDMHeaderAddMemberVisible();
    });

    await test.step('User A blocks User B from the DM', async () => {
      await friendPageA.blockFriendFromDM(userNameB);
      await friendPageA.page.waitForTimeout(1000);
    });

    await test.step('Verify add member action removed for blocked pair', async () => {
      await messagePageA.assertDMHeaderAddMemberNotVisible();
      await messagePageB.assertDMHeaderAddMemberNotVisible();
    });
  });

  test('Should remove video call action in DM header after blocking friend', async ({ dual }) => {
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const messagePageB = new MessagePage(pageB);

    await AllureReporter.addDescription(`
        **Test Objective:** Ensure blocking a friend removes the video call action from the DM header for the blocked pair. 
        
        **Test Steps:**
        1. Users open a direct message conversation
        2. Verify the video call action is visible in the header for both users
        3. User A blocks User B from the DM
        4. Confirm the video call action is removed for both users
        
        **Expected Result:** The DM header no longer shows the video call action for either side after blocking.
      `);

    await test.step('Open DM between User A and User B', async () => {
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    await test.step('Verify add member action visible before blocking', async () => {
      await messagePageA.assertDMHeaderVideoCallVisible();
      await messagePageB.assertDMHeaderVideoCallVisible();
    });

    await test.step('User A blocks User B from the DM', async () => {
      await friendPageA.blockFriendFromDM(userNameB);
      await friendPageA.page.waitForTimeout(1000);
    });

    await test.step('Verify add member action removed for blocked pair', async () => {
      await messagePageA.assertDMHeaderVideoCallNotVisible();
      await messagePageB.assertDMHeaderVideoCallNotVisible();
    });
  });
});
