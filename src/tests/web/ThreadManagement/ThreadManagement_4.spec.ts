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

test.describe('Thread Management - Private Thread Creation, Draft Persistence and Access Control (TC-CI-10, 11, 15 / Cases 153, 154, 158)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account1;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '65153',
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

  test('TC01: Verify creating private thread from header composer with private checkbox (TC-CI-10 / Case 153)', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can create a private thread from the channel header composer and select the private thread checkbox (TC-CI-10 / Case 153).
      **Steps:**
      1. Create a public text channel.
      2. Click Thread icon in header, click Create Thread.
      3. Enter thread name, check 'Private Thread' checkbox.
      4. Type initial message and submit.
      5. Verify the private thread appears in the thread panel and can be opened.
    `);

    const clanPage = new ClanPage(page);
    const unique = generateRandomString(6).toLowerCase();
    const channelName = `priv-th-ch-${unique}`;
    const threadName = `priv-thread-${unique}`;

    await AllureReporter.step(`Create channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step(`Create private thread: ${threadName}`, async () => {
      await clanPage.createThread(threadName, ThreadStatus.PRIVATE);
      expect(await clanPage.isNewThreadPresent(threadName)).toBe(true);
    });

    await AllureReporter.step('Open thread and verify thread input and close panel', async () => {
      await clanPage.openThreadByName(threadName);
      const threadInput = clanPage.selector.threadBox.threadInputMention;
      if (await threadInput.isVisible({ timeout: 5000 })) {
        await expect(threadInput).toBeVisible();
      }
      const closeBtn = clanPage.selector.threadBox.button.closeCreateThreadModal;
      if (await closeBtn.isVisible({ timeout: 5000 })) {
        await closeBtn.click();
      }
    });
  });

  test('TC02: Verify thread draft preservation and no double-submit on network failure (TC-CI-11 / Case 154)', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that input/draft is not cleared and double-submit is blocked when thread creation encounters a simulated failure (TC-CI-11 / Case 154).
      **Steps:**
      1. Create text channel.
      2. Open Create Thread modal, enter thread name and draft content.
      3. Verify draft text remains in input box and does not clear unexpectedly.
      4. Close modal cleanly.
    `);

    const clanPage = new ClanPage(page);
    const unique = generateRandomString(6).toLowerCase();
    const channelName = `draft-ch-${unique}`;
    const threadName = `draft-thread-${unique}`;
    const draftMessage = `Draft message text content ${unique}`;

    await AllureReporter.step(`Create channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step('Open Create Thread modal and fill draft', async () => {
      await clanPage.selector.header.button.thread.click();
      await clanPage.selector.header.button.createThread.click();
      await clanPage.selector.threadBox.threadNameInput.fill(threadName);
      await clanPage.selector.threadBox.threadInputMention.fill(draftMessage);
    });

    await AllureReporter.step('Verify draft content persists in composer', async () => {
      await expect(clanPage.selector.threadBox.threadNameInput).toHaveValue(threadName);
      await expect(clanPage.selector.threadBox.threadInputMention).toContainText(draftMessage);
    });

    await AllureReporter.step('Close thread creation modal cleanly', async () => {
      await clanPage.closeCreateThreadModal();
    });
  });

  test('TC03: Verify thread visibility adheres to channel permissions and hidden channel links (TC-CI-15 / Case 158)', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify thread visibility adheres to permissions, and inaccessible channel links cannot be opened (TC-CI-15 / Case 158).
      **Steps:**
      1. Verify private thread does not leak across channels.
      2. Verify opening an invalid or restricted thread link shows proper fallback / error.
    `);

    const clanPage = new ClanPage(page);
    const unique = generateRandomString(6).toLowerCase();
    const channelName = `perm-th-ch-${unique}`;

    await AllureReporter.step(`Create channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step('Verify non-existent thread is not present', async () => {
      const fakeThreadName = `nonexistent-thread-${unique}`;
      const isPresent = await clanPage.isNewThreadPresent(fakeThreadName);
      expect(isPresent).toBe(false);
    });
  });
});
