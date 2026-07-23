import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import MessageSelector from '@/data/selectors/MessageSelector';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { MezonCredentials } from '@/types';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Direct Messages - Invoice Status, Conversation Pins, and Group Calls', () => {
  const clanFactory = new ClanFactory();
  const credentials: MezonCredentials = AccountCredentials.account2;
  const [userNameA] = getUsernamesFromEmails([credentials.email]);

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.directMessage1,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63370',
    });

    await TestSuiteHelper.setupBeforeEach({
      page,
      clanFactory,
      credentials,
    });
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({
      browser,
      clanFactory,
      credentials,
    });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test('Display invoice status in DM list and header', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that invoice (in-voice) status indicator is visible on the direct message friend list and in the DM chat header when a user is in an active voice call.

      **Test Steps:**
      1. Create a new voice channel
      2. Join the voice channel
      3. Navigate to direct friends page
      4. Open DM conversation with the current user (self)
      5. Verify invoice status indicator in friend list
      6. Verify invoice status indicator in DM header

      **Expected Result:** Invoice status indicator is visible on the friend list item and in the DM chat header when user is in an active voice session.
    `);

    await AllureReporter.addLabels({
      tag: ['direct-message', 'invoice-status', 'voice-status'],
    });

    const messageSelector = new MessageSelector(page);
    const clanPage = new ClanPage(page);
    const messagePage = new MessagePage(page);
    const messageHelper = new MessageTestHelpers(page);

    // Create a voice channel
    const voiceChannelName = `voice-${Date.now().toString(36).slice(-6)}`.slice(0, 20);

    await AllureReporter.addParameter('voiceChannelName', voiceChannelName);
    await AllureReporter.addParameter('channelType', ChannelType.VOICE);
    await AllureReporter.addParameter('channelStatus', ChannelStatus.PUBLIC);

    await AllureReporter.step(`Create new public voice channel: ${voiceChannelName}`, async () => {
      const channelCreated = await clanPage.createNewChannel(
        ChannelType.VOICE,
        voiceChannelName,
        ChannelStatus.PUBLIC
      );
      expect(channelCreated).toBe(true);
    });

    await AllureReporter.step('Verify voice channel is present', async () => {
      const channelExists = await clanPage.isNewChannelPresent(voiceChannelName);
      expect(channelExists).toBe(true);
    });

    await AllureReporter.step(`Join voice channel: ${voiceChannelName}`, async () => {
      const joinedVoice = await clanPage.joinVoiceChannel(voiceChannelName);
      expect(joinedVoice).toBe(true);
      await page.waitForTimeout(2000);
    });

    await AllureReporter.step('Verify user is in voice channel', async () => {
      const isInVoiceChannel = await clanPage.isJoinVoiceChannel(voiceChannelName);
      expect(isInVoiceChannel).toBe(true);
    });

    await AllureReporter.step(`Open DM conversation with current user: ${userNameA}`, async () => {
      await messagePage.openSearchModalbyPressCtrlK();
      await messageHelper.openDMByNameOnsearchModal(userNameA);
      await page.waitForTimeout(1500);
    });

    await AllureReporter.step('Verify invoice status indicator in friend list', async () => {
      const invoiceStatusInFriendList = messageSelector.invoiceStatusFriendList;
      await expect(invoiceStatusInFriendList).toBeVisible({ timeout: 5000 });
    });

    await AllureReporter.step('Verify invoice status indicator in DM header', async () => {
      const invoiceStatusInHeader = messageSelector.invoiceStatusDMHeader;
      await expect(invoiceStatusInHeader).toBeVisible({ timeout: 5000 });
    });

    await AllureReporter.attachScreenshot(page, `Invoice Status - DM List & Header - ${userNameA}`);
  });

  test('Pin Conversation on direct message list', async ({ page }) => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can pin conversation on direct message
      **Test Steps:**
      1. Create a dm
      2. Click pin conversation
      3. Verify dm is in pin list

      **Expected Result:** Verify that user can pin conversation on direct message
    `);

    await AllureReporter.addLabels({
      tag: ['direct-message', 'pin-conversation'],
    });

    const friendPage = new FriendPage(page);
    const messagePage = new MessagePage(page);
    const messageHelpers = new MessageTestHelpers(page);
    const account = AccountCredentials['account3'];
    const [userNameB] = getUsernamesFromEmails([account.email]);

    await AllureReporter.step('Add friend with a user and create dm', async () => {
      await friendPage.gotoFriendsPage();
      await page.waitForTimeout(2000);
      await messagePage.openSearchModalbyPressCtrlK();
      await messageHelpers.openDMByNameOnsearchModal(userNameB);
    });

    await AllureReporter.step('Pin converation on DM', async () => {
      await friendPage.pinConversation(userNameB);
    });
    await AllureReporter.step('Verify pinned conversation is visible on pin list', async () => {
      await friendPage.verifyPinnedConversationInPinList(userNameB, true);
      await friendPage.unpinConversation(userNameB);
    });
  });

  test('Unpin Conversation on direct message list', async ({ page }) => {
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that user can unpin conversation on direct message
      **Test Steps:**
      1. Create a dm
      2. Click pin conversation
      3. Verify dm is in pin list
      4. Unpin
      4. Verify dm is not in pin list

      **Expected Result:** Verify that user can unpin conversation on direct message
    `);

    await AllureReporter.addLabels({
      tag: ['direct-message', 'pin-conversation'],
    });

    const friendPage = new FriendPage(page);
    const messagePage = new MessagePage(page);
    const messageHelpers = new MessageTestHelpers(page);
    const account = AccountCredentials['account3'];
    const [userNameB] = getUsernamesFromEmails([account.email]);

    await AllureReporter.step('Add friend with a user and create dm', async () => {
      await friendPage.gotoFriendsPage();
      await page.waitForTimeout(2000);
      await messagePage.openSearchModalbyPressCtrlK();
      await messageHelpers.openDMByNameOnsearchModal(userNameB);
    });

    await AllureReporter.step('Pin converation on DM', async () => {
      await friendPage.pinConversation(userNameB);
    });
    await AllureReporter.step('Verify pinned conversation is visible on pin list', async () => {
      await friendPage.verifyPinnedConversationInPinList(userNameB, true);
    });
    await AllureReporter.step('Unpin converation on DM', async () => {
      await friendPage.unpinConversation(userNameB);
    });
    await AllureReporter.step('Verify pinned conversation is visible on pin list', async () => {
      await friendPage.verifyPinnedConversationInPinList(userNameB, false);
    });
  });

  test('Verify that button call is hidden on group header', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63506',
    });

    const messagePage = new MessagePage(page);

    await AllureReporter.step(`Create group chat`, async () => {
      await page.goto(ROUTES.DIRECT_FRIENDS);
      await messagePage.createGroup();
      await page.waitForTimeout(3000);
    });

    await AllureReporter.step('Verify call button is hidden on group header', async () => {
      const callButtonVisible = await messagePage.isCallButtonVisibleOnGroupHeader();
      expect(callButtonVisible).toBe(false);
    });

    await AllureReporter.step('Verify video call button is hidden on group header', async () => {
      const videoCallButtonVisible = await messagePage.isVideoCallButtonVisibleOnGroupHeader();
      expect(videoCallButtonVisible).toBe(false);
    });
  });
});
