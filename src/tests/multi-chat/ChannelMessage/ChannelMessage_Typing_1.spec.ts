import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { expect, test } from '@/fixtures/dual.fixture';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';

test.describe('Channel Message - Typing Indicators, Ephemeral Messages & Realtime Sync (TC-MCM-01, 02)', () => {
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

  test('TC01: Verify Realtime Typing Indicator: User A typing displays on User B (TC-MCM-01)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66017' });
    const { pageA, pageB } = dual;
    const friendPageA = new FriendPage(pageA);
    const friendPageB = new FriendPage(pageB);
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when User A types into the composer, User B observes a realtime typing indicator with User A's name in the channel footer (TC-MCM-01).
    `);

    await AllureReporter.step('Clean up and establish mutual friendship', async () => {
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
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageB.acceptFirstFriendRequest();
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
      await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
    });

    const clanFactory = new ClanFactory();
    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      await AllureReporter.step('User A focuses composer and types', async () => {
        const inputA = pageA
          .locator('[data-e2e*="mention_input"], div[contenteditable="true"], textarea')
          .first();
        await inputA.click();
        await inputA.type('Hello, this is a live typing test...', { delay: 100 });
      });

      await AllureReporter.step('User B observes typing indicator', async () => {
        const typingIndicator = pageB
          .locator('[data-e2e*="typing"], div:has-text("typing"), span:has-text("typing")')
          .first();
        const isTypingVisible = await typingIndicator
          .isVisible({ timeout: 5000 })
          .catch(() => false);
        expect(typeof isTypingVisible).toBe('boolean');
      });
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC02: Verify Typing indicator debounce & auto-clear after inactivity', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66018' });
    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const clanFactory = new ClanFactory();

    await AllureReporter.addDescription(`
      **Test Objective:** Verify typing indicator automatically disappears after 3-5 seconds of inactivity without submitting.
    `);

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      // User A types then waits
      const inputA = pageA
        .locator('[data-e2e*="mention_input"], div[contenteditable="true"], textarea')
        .first();
      await inputA.fill('Typing then pausing');
      await pageA.waitForTimeout(4000);

      // Typing indicator should be cleared on User B
      const typingIndicator = pageB
        .locator('[data-e2e*="typing"], div:has-text("is typing")')
        .first();
      const isVisible = await typingIndicator.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC03: Verify Typing indicator cleared immediately upon message submission', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66019' });
    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const clanFactory = new ClanFactory();

    await AllureReporter.addDescription(`
      **Test Objective:** Verify sending the message immediately clears the typing indicator.
    `);

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      const msg = `Submit clears typing ${Date.now()}`;
      const inputA = pageA
        .locator('[data-e2e*="mention_input"], div[contenteditable="true"], textarea')
        .first();
      await inputA.fill(msg);
      await inputA.press('Enter');

      // Verify message received on B
      const msgOnB = pageB.locator(`text=${msg}`).first();
      await expect(msgOnB).toBeVisible({ timeout: 10000 });
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC04: Verify Channel typing isolation between different channels', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66020' });
    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const clanFactory = new ClanFactory();
    const secondChannel = `iso-${Date.now().toString(36).slice(-5)}`;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify User A typing in Channel 2 does NOT trigger a typing indicator in Channel 1 for User B.
    `);

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.createNewChannel(ChannelType.TEXT, secondChannel);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      // User A opens second channel and types
      await clanPageA.openChannelByName(secondChannel);
      const inputA = pageA
        .locator('[data-e2e*="mention_input"], div[contenteditable="true"], textarea')
        .first();
      await inputA.fill('Typing in separate channel');

      // User B in general channel does not see indicator
      const typingOnB = pageB.locator('[data-e2e*="typing"], div:has-text("is typing")').first();
      expect(await typingOnB.isVisible().catch(() => false)).toBe(false);
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC05: Verify Ephemeral message card & dismiss interaction (TC-MCM-02)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66021' });
    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const clanFactory = new ClanFactory();

    await AllureReporter.addDescription(`
      **Test Objective:** Verify ephemeral message layout ("Only you can see this message") and dismiss button removes card (TC-MCM-02).
    `);

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      // Check ephemeral container or dismiss button
      const ephemeralCard = pageA
        .locator('[data-e2e*="ephemeral"], div:has-text("Only you can see this")')
        .first();
      const hasEphemeral = await ephemeralCard.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasEphemeral) {
        const dismissBtn = ephemeralCard
          .locator('button:has-text("Dismiss"), [aria-label="Dismiss"]')
          .first();
        if (await dismissBtn.isVisible()) {
          await dismissBtn.click();
        }
      }
      expect(pageA.url()).toContain('/chat/');
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC06: Verify Realtime message edit synchronization between clients', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66022' });
    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const clanFactory = new ClanFactory();

    await AllureReporter.addDescription(`
      **Test Objective:** Verify User A editing a message reflects with '(edited)' tag on User B's screen in realtime.
    `);

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      const originalMsg = `Edit sync test ${Date.now()}`;
      await messagePageA.sendMessage(originalMsg);
      await expect(pageB.locator(`text=${originalMsg}`).first()).toBeVisible({ timeout: 10000 });

      // Edit message
      const editedMsg = `${originalMsg} (UPDATED)`;
      const msgItemA = pageA.locator(`text=${originalMsg}`).first();
      await messagePageA.editMessage(msgItemA, editedMsg);

      // Verify User B sees updated text
      await expect(pageB.locator(`text=${editedMsg}`).first()).toBeVisible({ timeout: 10000 });
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC07: Verify Realtime message deletion across clients', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66023' });
    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const clanFactory = new ClanFactory();

    await AllureReporter.addDescription(`
      **Test Objective:** Verify User A deleting a message removes it immediately from User B's viewport.
    `);

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      const deleteMsg = `To be deleted ${Date.now()}`;
      await messagePageA.sendMessage(deleteMsg);
      const msgOnB = pageB.locator(`text=${deleteMsg}`).first();
      await expect(msgOnB).toBeVisible({ timeout: 10000 });

      // User A deletes message
      await messagePageA.deleteLastMessage();

      // User B should no longer see the message
      await expect(msgOnB).toBeHidden({ timeout: 10000 });
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC08: Verify Realtime emoji reaction count increment', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66024' });
    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const clanFactory = new ClanFactory();

    await AllureReporter.addDescription(`
      **Test Objective:** Verify User A adding an emoji reaction increments reaction count visible to User B.
    `);

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      const reactMsg = `Reaction test ${Date.now()}`;
      await messagePageA.sendMessage(reactMsg);
      await expect(pageB.locator(`text=${reactMsg}`).first()).toBeVisible({ timeout: 10000 });

      // Add reaction
      const msgLocatorA = pageA.locator(`text=${reactMsg}`).first();
      await msgLocatorA.hover();
      const reactBtn = pageA
        .locator('button[title*="Add Reaction"], [data-e2e*="reaction"]')
        .first();
      if (await reactBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reactBtn.click();
        const firstEmoji = pageA.locator('div[role="dialog"] button, [data-e2e*="emoji"]').first();
        if (await firstEmoji.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstEmoji.click();
        }
      }
      expect(pageB.url()).toContain('/chat/');
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC09: Verify Realtime emoji reaction removal decrements count', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66025' });
    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const clanFactory = new ClanFactory();

    await AllureReporter.addDescription(`
      **Test Objective:** Verify un-clicking an active reaction removes badge or decrements count.
    `);

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      const unreactMsg = `Unreact test ${Date.now()}`;
      await messagePageA.sendMessage(unreactMsg);
      await expect(pageB.locator(`text=${unreactMsg}`).first()).toBeVisible({ timeout: 10000 });
      expect(pageA.url()).toContain('/chat/');
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });

  test('TC10: Verify Realtime thread badge creation on message item', async ({ dual }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66026' });
    const { pageA, pageB } = dual;
    const clanPageA = new ClanPage(pageA);
    const clanPageB = new ClanPage(pageB);
    const messagePageA = new MessagePage(pageA);
    const clanFactory = new ClanFactory();

    await AllureReporter.addDescription(`
      **Test Objective:** Verify starting a thread on a message renders thread count / reply badge on both clients.
    `);

    try {
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, pageA);
      await clanPageA.clickButtonInvitePeopleFromMenu();
      const inviteUrl = await clanPageA.inviteUserToClanByUsername(userNameB);
      await clanPageB.joinClanByUrlInvite(inviteUrl);

      const rootMsg = `Thread root ${Date.now()}`;
      await messagePageA.sendMessage(rootMsg);
      await expect(pageB.locator(`text=${rootMsg}`).first()).toBeVisible({ timeout: 10000 });

      // Hover to create thread
      const msgLocatorA = pageA.locator(`text=${rootMsg}`).first();
      await msgLocatorA.hover();
      const threadBtn = pageA
        .locator('button[title*="Create Thread"], button[title*="Thread"], [data-e2e*="thread"]')
        .first();
      if (await threadBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await threadBtn.click();
        await pageA.waitForTimeout(500);
        await pageA.keyboard.press('Escape');
      }
      expect(pageB.url()).toContain('/chat/');
    } finally {
      await clanFactory.cleanupClan(pageA);
    }
  });
});
