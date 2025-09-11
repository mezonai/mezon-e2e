import { AllureConfig, TestSetups } from '@/config/allure.config';
import { GLOBAL_CONFIG } from '@/config/environment';
import { MessgaePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { DirectMessageHelper } from '@/utils/directMessageHelper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect, test } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';

test.describe('Direct Message', () => {
  test.beforeAll(async () => {
    await TestSetups.chatTest({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: AllureConfig.SubSuites.DIRECT_MESSAGING,
      story: AllureConfig.Stories.TEXT_MESSAGING,
      severity: AllureConfig.Severity.CRITICAL,
    });
  });

  test.beforeEach(async ({ page }, testInfo) => {
    const accountUsed = await AuthHelper.setAuthForSuite(page, 'Direct Message');

    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63370',
    });

    const homePage = new HomePage(page);

    await AllureReporter.step('Navigate to direct friends page', async () => {
      await page.goto(joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS));
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    });
  });

  const now = new Date();
  const dateTimeString = now.toISOString().replace(/[:.]/g, '-');

  const messageText = `message-text-${dateTimeString}`;
  const nameGroupChat = `name-groupchat-${dateTimeString}`;

  test.skip('Create direct message ', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new direct message conversation.
      
      **Test Steps:**
      1. Count existing users before creating DM
      2. Create a new direct message
      3. Verify the direct message is created
      
      **Expected Result:** Direct message should be successfully created and user count should increase.
    `);

    await AllureReporter.addLabels({
      tag: ['direct-message', 'messaging', 'conversation-creation'],
    });

    const messagePage = new MessgaePage(page);
    const helpers = new DirectMessageHelper(page);

    const prevUsersCount = await AllureReporter.step('Get initial user count', async () => {
      return await helpers.countUsers();
    });

    await AllureReporter.addParameter('initialUserCount', prevUsersCount);

    await AllureReporter.step('Create direct message', async () => {
      await messagePage.createDM();
    });

    // await AllureReporter.step('Verify direct message is created', async () => {
    //   const DMCreated = await messagePage.isDMCreated();
    //   expect(DMCreated).toBe(true);
    // });

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

    const messagePage = new MessgaePage(page);

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

    const messagePage = new MessgaePage(page);
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

    const messagePage = new MessgaePage(page);

    await test.step(`Add more member to group chat`, async () => {
      await messagePage.addMoreMemberToGroup();
      await page.waitForTimeout(5000);
    });
  });

  test('Update name for group chat DM', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63506',
    });

    const messagePage = new MessgaePage(page);

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
    const messagePage = new MessgaePage(page);
    const helpers = new DirectMessageHelper(page);
    const prevUsersCount = await helpers.countUsers();

    if (prevUsersCount === 0) {
      await messagePage.createDM();
      await page.waitForTimeout(3000);
    }

    await test.step(`Close direct message`, async () => {
      await messagePage.closeDM();
      await page.waitForTimeout(3000);
    });

    await test.step('Verify direct message is closed', async () => {
      const DMClosed = await messagePage.isDMClosed(prevUsersCount);
      expect(DMClosed).toBeTruthy();
    });
  });

  test('Leave group', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63506',
    });

    const messagePage = new MessgaePage(page);
    const helpers = new DirectMessageHelper(page);
    const prevGroupCount = await helpers.countGroups();

    await test.step(`Leave group chat`, async () => {
      await messagePage.leaveGroupByXBtn();
      await page.waitForTimeout(4000);
    });

    await test.step('Verify group chat is left', async () => {
      const groupLeaved = await messagePage.isLeavedGroup(prevGroupCount);
      expect(groupLeaved).toBeTruthy();
    });
  });

  test('Pinned message should be removed when deleted', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63627',
    });

    const messagePage = new MessgaePage(page);

    let pinnedMessageId: string;

    await AllureReporter.step('Send a message and pin it', async () => {
      await messagePage.sendMessage(messageText);
      await messagePage.messages.last().waitFor({ state: 'visible', timeout: 10000 });
      pinnedMessageId = await messagePage.pinLastMessage();
    });

    await AllureReporter.step('Delete the pinned message', async () => {
      await messagePage.deleteLastMessage();
    });

    await AllureReporter.step('Verify pinned message is removed from list', async () => {
      const isStillPinned = await messagePage.isMessageStillPinned(pinnedMessageId);
      expect(isStillPinned).toBe(false);
    });

    await AllureReporter.attachScreenshot(page, 'Pinned Message Removed');
  });
});
