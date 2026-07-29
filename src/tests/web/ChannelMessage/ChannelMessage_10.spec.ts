import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { expect } from '@playwright/test';

test.describe('Channel Messages - Pinned Message List', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account8;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage8,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63366',
    });
    await TestSuiteHelper.setupBeforeEach({
      page,
      clanFactory,
      credentials,
    });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({
      browser,
      clanFactory,
      credentials,
    });
  });

  test('Verify that user can unpin a message from the pinned message list', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63400',
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that user can remove a pinned message from the pinned message list
    **Test Steps:**
    1. Create a new text channel
    2. Send a message to the channel
    3. Pin the message
    4. Open the pinned message list
    5. Click Remove Pin and confirm Unpin in the confirmation modal
    6. Verify the message is no longer pinned
    **Expected Result:** User can unpin the message from the pinned message list
  `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'pin-unpin', 'pinned-message-list', 'text-channel'],
    });

    const messageHelper = new MessageTestHelpers(page);
    const messagePage = new MessagePage(page);
    const clanPage = new ClanPage(page);
    const unique = Date.now().toString(36);
    const channelName = `tc-${unique}`.slice(0, 20);
    const message = `Pin list message - ${Date.now()}`;

    await AllureReporter.step('Create a new text channel', async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('Send message to the text channel', async () => {
      await page.waitForTimeout(2000);
      await messageHelper.sendTextMessage(message);
    });

    await AllureReporter.step('Pin message', async () => {
      await messagePage.pinLastMessage();
    });

    await AllureReporter.step('Unpin the message from the pinned message list', async () => {
      await messagePage.unpinMessageFromPinnedList(message);
    });

    await AllureReporter.step('Verify the message is unpinned', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      const isMessageUnpinned = await messagePage.verifyMessageIsUnpinned(message);
      expect(isMessageUnpinned).toBe(true);
    });
  });
});
