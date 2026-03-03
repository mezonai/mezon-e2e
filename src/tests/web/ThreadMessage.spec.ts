import { AccountCredentials } from '@/config/environment';
import { INVALID_THREAD_NAME, VALID_THREAD_NAME } from '@/constants/ThreadName';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MezonCredentials } from '@/types';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test, type Locator } from '@playwright/test';

test.describe('Thread in Public Channel', () => {
  const clanFactory = new ClanFactory();
  const credentials: MezonCredentials = AccountCredentials.account7;
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

    const _credentials = await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), _credentials);

    await AllureReporter.step('Create public channel for thread testing', async () => {
      const clanPage = new ClanPage(page);
      const publicChannelName = `public-channel-${generateRandomString(5)}`;
      await clanPage.createNewChannel(ChannelType.TEXT, publicChannelName);
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

  test('Verify that I can create thread based on any messages in a public channel', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63580',
      github_issue: '9657',
    });

    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);

    const initMessage = `thread-init-${generateRandomString(6)}`;
    const threadReply = `Thread reply ${Date.now()}`;
    let messageLocator: Locator;

    await AllureReporter.step('Sent initial message to channel', async () => {
      const messageElement = await messageHelper.sendTextMessageAndGetItem(initMessage);
      messageLocator = messageElement;
      expect(await clanPage.verifyMessageSent(initMessage)).toBeTruthy();
    });

    await AllureReporter.step('Attempt create thread with invalid name', async () => {
      await messageLocator.hover();
      await messageLocator.click({ button: 'right' });
      await messageHelper.createThreadByMessage();

      await messageHelper.fillThreadName(INVALID_THREAD_NAME);
      await messageHelper.sendMessageInThread(threadReply, true);

      const existsInvalid = await clanPage.isNewThreadPresent(INVALID_THREAD_NAME);
      expect(existsInvalid).toBeFalsy();

      const initMsgInThread = messageHelper.getThreadMessageItemByText(initMessage);
      expect(initMsgInThread).toBeVisible({ timeout: 3000 });
    });

    await AllureReporter.step('Fix thread name to valid and create', async () => {
      await messageHelper.fillThreadName(VALID_THREAD_NAME);
      await messageHelper.sendMessageInThread(threadReply, true);
      const initMsgInThread = messageHelper.getThreadMessageItemByText(initMessage);
      await expect(initMsgInThread).toBeVisible({ timeout: 3000 });
      const existsValid = await clanPage.isNewThreadPresent(VALID_THREAD_NAME);
      expect(existsValid).toBeTruthy();
    });

    await AllureReporter.step('Verify initial message still in thread box', async () => {
      const initMsgInThread = messageHelper.getThreadMessageItemByText(initMessage);
      await expect(initMsgInThread).toBeVisible({ timeout: 3000 });
    });

    await AllureReporter.step('Re-open thread from thread list', async () => {
      await clanPage.closeCreateThreadModal();
      await clanPage.openThread(VALID_THREAD_NAME);
      const initMsgReopened = messageHelper.verifyInitMessageInThread(initMessage);
      await expect(initMsgReopened).toBeVisible({ timeout: 3000 });
    });
  });

  test('Verify that I cannot create thread from message in other thread', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63581',
      github_issue: '9658',
    });
    const messageHelper = new MessageTestHelpers(page);
    const initMessage = `thread-init-${generateRandomString(6)}`;

    await AllureReporter.step('Create thread and send message in it', async () => {
      const messageElement = await messageHelper.sendTextMessageAndGetItem(initMessage);
      await messageElement.hover();
      await messageElement.click({ button: 'right' });
      await messageHelper.createThreadByMessage();
      await messageHelper.fillThreadName(VALID_THREAD_NAME);
      await messageHelper.sendMessageInThread(initMessage, true);
      const initMsgInThread = messageHelper.getThreadMessageItemByText(initMessage);
      await expect(initMsgInThread).toBeVisible({ timeout: 3000 });
    });

    await AllureReporter.step(
      'Try to create thread from message in thread and verify cannot',
      async () => {
        const msgInThread = messageHelper.getThreadMessageItemByText(initMessage);
        await msgInThread.hover();
        await msgInThread.click({ button: 'right' });
        const canSeeCreateThreadOption = await messageHelper.canSeeCreateThreadOption();
        expect(canSeeCreateThreadOption).toBeFalsy();
      }
    );
  });
});
