import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, GLOBAL_CONFIG } from '@/config/environment';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { DirectMessageHelper } from '@/utils/directMessageHelper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect, test } from '@playwright/test';
import { randomInt } from 'crypto';

test.describe('Direct Message', () => {
  test.beforeAll(async () => {
    await TestSetups.chatTest({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: AllureConfig.SubSuites.DIRECT_MESSAGING,
      story: AllureConfig.Stories.TEXT_MESSAGING,
      severity: AllureConfig.Severity.CRITICAL,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63370',
    });

    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account4
    );
    await AuthHelper.prepareBeforeTest(
      page,
      joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS),
      credentials
    );
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  const now = new Date();
  const dateTimeString = now.toISOString().replace(/[:.]/g, '-');

  const messageText = `message-text-${dateTimeString}`;
  const nameGroupChat = `name-groupchat-${dateTimeString}`;

  test('Create direct message ', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new direct message conversation.

      **Test Steps:**
      1. Create a new direct message
      2. Verify the direct message is created

      **Expected Result:** Direct message should be successfully created and user count should increase.
    `);

    await AllureReporter.addLabels({
      tag: ['direct-message', 'messaging', 'conversation-creation'],
    });

    const messagePage = new MessagePage(page);

    await AllureReporter.step('Verify that i can open a DM', async () => {
      const firstUser = await messagePage.createDM();
      await expect(messagePage.groupName).toHaveText(firstUser, { timeout: 5000 });
    });

    await AllureReporter.attachScreenshot(page, 'Direct Message Created');
  });

  test('Send a message', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63505',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully send a message in a direct message conversation.
      
      **Test Steps:**
      1. Send a test message
      2. Verify the message is sent successfully
      
      **Expected Result:** Message should be sent and visible in the conversation.
    `);

    await AllureReporter.addLabels({
      tag: ['messaging', 'send-message', 'direct-message'],
    });

    const messagePage = new MessagePage(page);

    await AllureReporter.addParameter('messageText', messageText);

    await AllureReporter.step(`Send message: ${messageText}`, async () => {
      await messagePage.sendMessage(messageText);
      await page.waitForTimeout(3000);
    });

    await AllureReporter.step('Verify the message is sent', async () => {
      const messageSend = await messagePage.isMessageSend();
      expect(messageSend).toBeTruthy();
    });

    await AllureReporter.attachScreenshot(page, 'Message Sent Successfully');
  });

  test('Create group chat ', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63506',
    });

    const messagePage = new MessagePage(page);
    const helpers = new DirectMessageHelper(page);
    const prevGroupCount = await helpers.countGroups();

    await test.step(`Create group chat`, async () => {
      await messagePage.createGroup();
      await page.waitForTimeout(3000);
    });

    await test.step('Verify group chat is ceated', async () => {
      const groupCreated = await messagePage.isGroupCreated(prevGroupCount);
      expect(groupCreated).toBeTruthy();
    });
  });

  test('Add more member to group chat', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63506',
    });

    const messagePage = new MessagePage(page);

    await test.step(`Add more member to group chat`, async () => {
      await messagePage.addMoreMemberToGroup();
      await page.waitForTimeout(5000);
    });
  });

  test('Update name for group chat DM', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63506',
    });

    const messagePage = new MessagePage(page);

    await test.step(`Update name for group chat DM`, async () => {
      await messagePage.updateNameGroupChatDM(nameGroupChat);
      await page.waitForTimeout(3000);
    });

    await test.step('Verify the group name is updated', async () => {
      const groupNameUpdated = await messagePage.isGroupNameDMUpdated();
      expect(groupNameUpdated).toBeTruthy();
    });
  });

  test('Close direct message', async ({ page }) => {
    const messagePage = new MessagePage(page);
    const helpers = new DirectMessageHelper(page);

    let username: string;

    await AllureReporter.step('Verify that i can open a DM', async () => {
      const firstUser = await messagePage.createDM();
      username = firstUser;
      const isVisible = await helpers.scrollUntilVisible(username);
      expect(isVisible).toBeTruthy();
      await expect(messagePage.groupName).toHaveText(firstUser, { timeout: 5000 });
    });

    await AllureReporter.step(`Close direct message`, async () => {
      await messagePage.closeDM(username);
      await expect(messagePage.groupName).toBeHidden({ timeout: 5000 });
    });

    await AllureReporter.step('Verify direct message is closed', async () => {
      const DMClosed = await messagePage.isDMClosed(username);
      expect(DMClosed).toBeTruthy();
    });
  });

  test('Leave group', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63506',
    });

    const messagePage = new MessagePage(page);
    const nameUpdate = `Group updated ${dateTimeString}`;
    let groupName: string;

    await AllureReporter.step('Create group and update an unique name', async () => {
      await messagePage.createGroup();
      await expect(messagePage.groupName).toBeVisible({ timeout: 5000 });
      await messagePage.updateNameGroupChatDM(nameUpdate);
      await expect(messagePage.groupName).toHaveText(nameUpdate, { timeout: 5000 });
      const groupNameText = (await messagePage.groupName.innerText()).trim();
      expect(groupNameText).toBe(nameUpdate);
    });

    await AllureReporter.step(`Leave group chat`, async () => {
      const name = await messagePage.leaveGroupByXBtn();
      groupName = name;
    });

    await AllureReporter.step('Verify group chat is left', async () => {
      await expect(messagePage.userNamesInDM.filter({ hasText: groupName })).toHaveCount(0, {
        timeout: 5000,
      });
      const groupLeaved = await messagePage.isLeavedGroup(groupName);
      expect(groupLeaved).toBeTruthy();
    });
  });

  test('Pinned message should be removed when deleted', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63627',
    });

    const messagePage = new MessagePage(page);
    const indentityMessage = (Date.now() + randomInt(10)).toString();
    const messageToPinText = `Message to pin ${indentityMessage}`;

    await AllureReporter.step('Send a message and pin it', async () => {
      await messagePage.sendMessage(messageToPinText);
      await messagePage.messages.last().waitFor({ state: 'visible', timeout: 10000 });
      await messagePage.pinLastMessage();
    });

    await AllureReporter.step('Delete the pinned message', async () => {
      await messagePage.deleteLastMessage();
    });

    await AllureReporter.step('Verify pinned message is removed from list', async () => {
      const isStillPinned = await messagePage.isMessageStillPinned(indentityMessage);
      expect(isStillPinned).toBe(false);
    });

    await AllureReporter.attachScreenshot(page, 'Pinned Message Removed');
  });
});
