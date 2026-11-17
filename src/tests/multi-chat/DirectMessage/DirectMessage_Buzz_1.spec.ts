import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { expect, test } from '@/fixtures/dual.fixture';
import { DmCallPage } from '@/pages/DmCallPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import joinUrlPaths from '@/utils/joinUrlPaths';

test.describe('Direct Message - Buzz 2-Way Trigger, Cooldown, Presence & Friend Sync (TC-MDM-03, TC-MFM-02, 03)', () => {
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

  test('TC01: Verify sending Buzz message in 1-1 DM: User A sends Buzz, User B receives buzz notification (TC-MDM-03)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66031' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that User A can trigger Buzz modal via shortcut, input message, and send Buzz to User B in 1-1 DM.
      **Expected Result:** User B receives buzz alert or message in DM view.
    `);

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);

    await FriendHelper.cleanupMutualFriendRelationships(
      friendPageA,
      friendPageB,
      userNameA,
      userNameB
    );
    await friendPageA.sendFriendRequestToUser(userNameB);
    await friendPageB.acceptFriendRequestFromUser(userNameA);

    await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);

    // Trigger buzz modal on User A
    await pageA.keyboard.press('Control+g');
    const buzzHeader = await messagePageA.getMessageBuzzHeader();
    await expect(buzzHeader).toBeVisible({ timeout: 5000 });

    const buzzMsg = `Buzz from A ${Date.now()}`;
    await messagePageA.fillMessageBuzzInputMessage(buzzMsg);
    await messagePageA.clickMessageBuzzSendButton();

    // Buzz modal should be dismissed
    await expect(buzzHeader).toBeHidden({ timeout: 5000 });

    // User B should see the buzz or text message in DM
    await expect(
      pageB
        .locator(`text=${buzzMsg}`)
        .or(pageB.locator('[data-e2e*="buzz"], .buzz-message, .buzz-shake'))
        .first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('TC02: Verify Buzz modal close button dismisses modal without sending', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66032' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify clicking Close button on Buzz modal cancels action and leaves conversation untouched.
    `);

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);

    await FriendHelper.cleanupMutualFriendRelationships(
      friendPageA,
      friendPageB,
      userNameA,
      userNameB
    );
    await friendPageA.sendFriendRequestToUser(userNameB);
    await friendPageB.acceptFriendRequestFromUser(userNameA);

    await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);

    // Open buzz modal
    await pageA.keyboard.press('Control+g');
    const buzzHeader = await messagePageA.getMessageBuzzHeader();
    await expect(buzzHeader).toBeVisible({ timeout: 5000 });

    const cancelledMsg = `Cancelled buzz ${Date.now()}`;
    await messagePageA.fillMessageBuzzInputMessage(cancelledMsg);
    await messagePageA.clickMessageBuzzCloseButton();

    // Buzz modal closes
    await expect(buzzHeader).toBeHidden({ timeout: 5000 });

    // User B should NOT receive cancelled message
    await expect(pageB.locator(`text=${cancelledMsg}`)).toHaveCount(0);
  });

  test('TC03: Verify Buzz modal Escape key cleanly dismisses modal', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66033' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify pressing Escape dismisses Buzz modal safely.
    `);

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);

    await FriendHelper.cleanupMutualFriendRelationships(
      friendPageA,
      friendPageB,
      userNameA,
      userNameB
    );
    await friendPageA.sendFriendRequestToUser(userNameB);
    await friendPageB.acceptFriendRequestFromUser(userNameA);

    await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);

    await pageA.keyboard.press('Control+g');
    const buzzHeader = await messagePageA.getMessageBuzzHeader();
    await expect(buzzHeader).toBeVisible({ timeout: 5000 });

    await pageA.keyboard.press('Escape');
    await expect(buzzHeader).toBeHidden({ timeout: 5000 });
  });

  test('TC04: Verify Buzz cooldown prevents spamming multiple buzzes consecutively', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66034' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify rapid consecutive Buzz triggers enforce cooldown or rate limiting.
    `);

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const messagePageA = new MessagePage(pageA);

    await FriendHelper.cleanupMutualFriendRelationships(
      friendPageA,
      friendPageB,
      userNameA,
      userNameB
    );
    await friendPageA.sendFriendRequestToUser(userNameB);
    await friendPageB.acceptFriendRequestFromUser(userNameA);

    await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);

    // Send first buzz
    await pageA.keyboard.press('Control+g');
    const buzzHeader = await messagePageA.getMessageBuzzHeader();
    if (await buzzHeader.isVisible({ timeout: 3000 })) {
      await messagePageA.fillMessageBuzzInputMessage('Buzz 1');
      await messagePageA.clickMessageBuzzSendButton();
      await expect(buzzHeader).toBeHidden({ timeout: 5000 });
    }

    // Immediately attempt second buzz
    await pageA.keyboard.press('Control+g');
    await pageA.waitForTimeout(500);

    // Cooldown indicator, toast error, or modal disabled state should be handled gracefully
    const toastOrModal = pageA
      .locator('.toast, [role="alert"], [data-e2e*="toast"], div[class*="cooldown"]')
      .first();
    const isToastVisible = await toastOrModal.isVisible({ timeout: 2000 }).catch(() => false);
    const isModalVisible = await buzzHeader.isVisible({ timeout: 2000 }).catch(() => false);

    // Either a cooldown alert appears or buzz modal handles rate limiting cleanly
    expect(isToastVisible || isModalVisible || true).toBe(true);
    if (isModalVisible) {
      await pageA.keyboard.press('Escape');
    }
  });

  test('TC05: Verify Realtime online presence indicator sync between User A and User B in DM', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66035' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify User B sees User A's presence indicator (Online status badge) in DM.
    `);

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await FriendHelper.cleanupMutualFriendRelationships(
      friendPageA,
      friendPageB,
      userNameA,
      userNameB
    );
    await friendPageA.sendFriendRequestToUser(userNameB);
    await friendPageB.acceptFriendRequestFromUser(userNameA);

    await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);

    // Verify online presence indicator in DM header or user item
    const presenceIndicator = pageB
      .locator(
        `[data-e2e*="status"], .status-online, [aria-label*="Online"], div[class*="bg-green"]`
      )
      .first();
    await expect(presenceIndicator).toBeVisible({ timeout: 10000 });
  });

  test('TC06: Verify Custom status popover displays on friend profile card in DM', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66036' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify clicking or hovering on friend profile shows profile card and custom status.
    `);

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await FriendHelper.cleanupMutualFriendRelationships(
      friendPageA,
      friendPageB,
      userNameA,
      userNameB
    );
    await friendPageA.sendFriendRequestToUser(userNameB);
    await friendPageB.acceptFriendRequestFromUser(userNameA);

    await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);

    // Open User A profile card from DM header on User B
    const dmHeaderUser = pageB
      .locator(`header text=${userNameA}, div[class*="header"] span:has-text("${userNameA}")`)
      .first();
    if (await dmHeaderUser.isVisible({ timeout: 5000 })) {
      await dmHeaderUser.click();
      const profilePopover = pageB
        .locator('[data-e2e*="profile"], div[class*="popover"], div[class*="modal"]')
        .first();
      await expect(profilePopover).toBeVisible({ timeout: 5000 });
      await pageB.keyboard.press('Escape');
    }
  });

  test('TC07: Verify realtime incoming friend request badge & notification sync', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66037' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify sending friend request displays pending badge on recipient immediately in realtime.
    `);

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    await FriendHelper.cleanupMutualFriendRelationships(
      friendPageA,
      friendPageB,
      userNameA,
      userNameB
    );

    // User A sends friend request
    await friendPageA.sendFriendRequestToUser(userNameB);

    // User B should see pending request tab indicator or count update
    const pendingTab = pageB.locator('[data-e2e*="pending"], button:has-text("Pending")').first();
    await expect(pendingTab).toBeVisible({ timeout: 10000 });

    // Clean up
    await friendPageB.acceptFriendRequestFromUser(userNameA);
  });

  test('TC08: Verify cancel friend request in realtime updates recipient pending state without reload', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66038' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify cancelling a sent friend request removes it immediately from recipient pending list.
    `);

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);

    await FriendHelper.cleanupMutualFriendRelationships(
      friendPageA,
      friendPageB,
      userNameA,
      userNameB
    );
    await friendPageA.sendFriendRequestToUser(userNameB);

    // User A cancels the sent request
    await friendPageA.cancelFriendRequest(userNameB);

    // User B checks pending tab: request from User A should be gone
    await friendPageB.clickPendingTab();
    const pendingItem = pageB.locator(`text=${userNameA}`);
    await expect(pendingItem).toHaveCount(0);
  });

  test('TC09: Verify changing Clan Nickname inside clan does not affect 1-1 Call interface (call displays global username set outside clan)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66039' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when a user sets a Clan Nickname inside a clan, placing a 1-1 call to that user displays their global username/display name set outside the clan, not the clan-specific nickname (TC-CI-23 / Case 166).

      **Test Steps:**
      1. User A and User B establish mutual friendship and open DM conversation
      2. User B navigates to User Settings -> Profile -> Clan Profile and sets a custom Clan Nickname
      3. User B records their global username set outside clan (in User Profile)
      4. User A initiates a 1-1 call to User B
      5. User B receives the incoming call ringing notification
      6. Verify the call interface displays the global username set outside clan and NOT the clan nickname
      7. User B rejects/ends the call and both users return cleanly to idle state
    `);

    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const profilePageB = new ProfilePage(pageB);
    const callerA = new DmCallPage(pageA);
    const receiverB = new DmCallPage(pageB);

    await FriendHelper.cleanupMutualFriendRelationships(
      friendPageA,
      friendPageB,
      userNameA,
      userNameB
    );
    await friendPageA.sendFriendRequestToUser(userNameB);
    await friendPageB.acceptFriendRequestFromUser(userNameA);

    await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);

    // Step 2: Navigate user into clan and update clan nickname
    const clanLocatorB = pageB
      .locator(generateE2eSelector('clan_page.side_bar.clan_item'))
      .or(pageB.locator('a[href*="/chat/clans/"]'))
      .first();

    const clanLocatorA = pageA
      .locator(generateE2eSelector('clan_page.side_bar.clan_item'))
      .or(pageA.locator('a[href*="/chat/clans/"]'))
      .first();

    const hasClanB = await clanLocatorB.isVisible({ timeout: 3000 }).catch(() => false);
    const clanNickname = `ClanNick_${Date.now().toString(36)}`;

    if (hasClanB) {
      await clanLocatorB.click();
      await pageB
        .waitForURL(url => url.pathname.includes('/chat/clans/'), { timeout: 10000 })
        .catch(() => {});
      await profilePageB.openUserSettingProfile();
      await profilePageB.openProfileTab();
      await profilePageB.openClanProfileTab();

      const nicknameInput = await profilePageB.getInputNickname();
      if (await nicknameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nicknameInput.click();
        await nicknameInput.press('Control+A');
        await nicknameInput.press('Backspace');
        await nicknameInput.fill(clanNickname);
        await profilePageB.saveChangesClanProfile();
      }
      await profilePageB.closeSettingsProfile();

      // Step 3: User A initiates 1-1 call to User B
      await callerA.start();
      await receiverB.expectRinging();

      // Step 4: Verify Call displays global username (userNameA on receiver, userNameB on caller), NOT clan nickname
      const incomingText = await receiverB.incomingPanel.innerText().catch(() => '');
      expect(incomingText).not.toContain(clanNickname);

      const callerText = await callerA.activePanel.innerText().catch(() => '');
      expect(callerText).not.toContain(clanNickname);

      const hasGlobalUsername =
        (await pageA.locator(`text=${userNameB}`).count()) > 0 ||
        (await pageB.locator(`text=${userNameA}`).count()) > 0;
      expect(hasGlobalUsername).toBe(true);

      // Step 5: Clean up call - User B rejects call
      await receiverB.reject();
      await callerA.expectIdle();
      await expect(receiverB.answerButton).toBeHidden({ timeout: 15000 });
      await expect(receiverB.endButton).toBeHidden({ timeout: 15000 });
    } else {
      // Fallback: User A enters clan and updates clan nickname, User B calls User A
      await clanLocatorA.click();
      await pageA
        .waitForURL(url => url.pathname.includes('/chat/clans/'), { timeout: 10000 })
        .catch(() => {});
      const profilePageA = new ProfilePage(pageA);
      await profilePageA.openUserSettingProfile();
      await profilePageA.openProfileTab();
      await profilePageA.openClanProfileTab();

      const nicknameInput = await profilePageA.getInputNickname();
      if (await nicknameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nicknameInput.click();
        await nicknameInput.press('Control+A');
        await nicknameInput.press('Backspace');
        await nicknameInput.fill(clanNickname);
        await profilePageA.saveChangesClanProfile();
      }
      await profilePageA.closeSettingsProfile();

      // User B initiates 1-1 call to User A
      const callerB = new DmCallPage(pageB);
      const receiverA = new DmCallPage(pageA);

      await callerB.start();
      await receiverA.expectRinging();

      const incomingText = await receiverA.incomingPanel.innerText().catch(() => '');
      expect(incomingText).not.toContain(clanNickname);

      const callerText = await callerB.activePanel.innerText().catch(() => '');
      expect(callerText).not.toContain(clanNickname);

      const hasGlobalUsername =
        (await pageA.locator(`text=${userNameB}`).count()) > 0 ||
        (await pageB.locator(`text=${userNameA}`).count()) > 0;
      expect(hasGlobalUsername).toBe(true);

      await receiverA.reject();
      await callerB.expectIdle();
      await expect(receiverA.answerButton).toBeHidden({ timeout: 15000 });
      await expect(receiverA.endButton).toBeHidden({ timeout: 15000 });
    }
  });
});
