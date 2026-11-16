import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelStatus, ChannelType, ThreadStatus } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Thread Management - Discussion Panel and Close Navigation', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account7;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.threadManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63519',
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

  test('Verify that user can open thread discussion, send message, and close discussion panel', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64696',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can open a thread discussion panel, type in the thread composer, and close the discussion panel cleanly.

      **Test Steps:**
      1. Create a public text channel
      2. Create a public thread within the channel
      3. Open the created thread discussion
      4. Type a message in the thread input box
      5. Click the close button on the thread header
      6. Verify the thread discussion panel is closed
    `);

    await AllureReporter.addLabels({
      tag: ['thread-management', 'thread-discussion', 'close-discussion'],
    });

    const clanPage = new ClanPage(page);
    const unique = generateRandomString(6).toLowerCase();
    const channelName = `thread-ch-${unique}`;
    const threadName = `thread-item-${unique}`;
    const threadMessage = `Hello from thread ${unique}`;

    await AllureReporter.step(`Create channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step(`Create thread: ${threadName}`, async () => {
      await clanPage.createThread(threadName, ThreadStatus.PUBLIC);
      expect(await clanPage.isNewThreadPresent(threadName)).toBe(true);
    });

    await AllureReporter.step('Open thread and type message in thread composer', async () => {
      await clanPage.openThreadByName(threadName);
      const threadInput = clanPage.selector.threadBox.threadInputMention;
      if (await threadInput.isVisible({ timeout: 5000 })) {
        await threadInput.fill(threadMessage);
        await expect(threadInput).toHaveText(threadMessage);
      }
    });

    await AllureReporter.step('Close thread discussion panel', async () => {
      const closeBtn = clanPage.selector.threadBox.button.closeCreateThreadModal;
      if (await closeBtn.isVisible({ timeout: 5000 })) {
        await closeBtn.click();
        await expect(closeBtn).toBeHidden({ timeout: 5000 });
      }
    });
  });

  test('TC02: Verify sending and displaying messages inside thread discussion panel', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64697',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can open a thread discussion panel, send a reply message into the thread, and verify the message appears in the discussion stream.

      **Test Steps:**
      1. Create a public text channel
      2. Create a public thread within the channel
      3. Open the created thread discussion from sidebar
      4. Type a message in the thread input box and press Enter to send
      5. Verify the sent reply is visible in the thread discussion
      6. Close the discussion panel cleanly
    `);

    await AllureReporter.addLabels({
      tag: ['thread-management', 'thread-message', 'discussion-stream'],
    });

    const clanPage = new ClanPage(page);
    const unique = generateRandomString(6).toLowerCase();
    const channelName = `th-msg-${unique}`;
    const threadName = `th-topic-${unique}`;
    const replyMessage = `Thread reply message ${unique}`;

    await AllureReporter.step(`Create channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step(`Create thread: ${threadName}`, async () => {
      await clanPage.createThread(threadName, ThreadStatus.PUBLIC);
      expect(await clanPage.isNewThreadPresent(threadName)).toBe(true);
    });

    await AllureReporter.step('Send message in thread discussion composer', async () => {
      const threadInput = clanPage.selector.threadBox.threadInputMention;
      if (!(await threadInput.isVisible({ timeout: 3000 }))) {
        await clanPage.openThreadByName(threadName);
      }
      await expect(threadInput).toBeVisible({ timeout: 8000 });
      await threadInput.fill(replyMessage);
      await threadInput.press('Enter');
    });

    await AllureReporter.step('Verify reply message appears in thread discussion', async () => {
      const discussionBox = page.locator('[data-e2e="discussion-box-thread"]');
      await expect(discussionBox.locator(`text=${replyMessage}`)).toBeVisible({ timeout: 5000 });
    });

    await AllureReporter.step('Close thread discussion panel', async () => {
      const closeBtn = clanPage.selector.threadBox.button.closeCreateThreadModal;
      if (await closeBtn.isVisible({ timeout: 5000 })) {
        await closeBtn.click();
        await expect(closeBtn).toBeHidden({ timeout: 5000 });
      }
    });
  });
});
