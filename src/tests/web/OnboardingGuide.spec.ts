import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { OnboardingTask } from '@/types/onboarding.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { OnboardingHelpers } from '@/utils/onboardingHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Onboarding Guide Task Completion', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account5;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.onboarding,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63452',
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

  test('should mark "Send first message" task as done after user sends first message', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that the onboarding guide correctly marks the "Send first message" task as completed after a user sends their first message.

      **Test Steps:**
      1. Ensure onboarding guide is visible
      2. Send a test message in the current channel
      3. Verify the "Send first message" task is marked as done (green tick)

      **Expected Result:** The "Send first message" task should show as completed with a green checkmark after the user sends their first message.
    `);

    await AllureReporter.addLabels({
      tag: ['onboarding', 'first-message', 'task-completion', 'user-guidance'],
    });

    const helpers = new OnboardingHelpers(page);

    await AllureReporter.step('Ensure onboarding guide is visible', async () => {
      await helpers.ensureOnboardingGuideVisible();
    });

    await AllureReporter.step('Send first message', async () => {
      const { sent } = await helpers.sendTestMessage();
      expect(sent).toBe(true);
      await AllureReporter.addParameter('messageSent', sent);
    });

    await AllureReporter.step('Verify "Send first message" task is marked as done', async () => {
      const isTaskMarkedDone = await helpers.waitForTaskCompletion(
        OnboardingTask.SEND_FIRST_MESSAGE
      );
      expect(
        isTaskMarkedDone,
        'The "Send first message" task should be marked as done (green tick) after user sends first message'
      ).toBe(true);
      await AllureReporter.addParameter(
        'taskCompletionStatus',
        isTaskMarkedDone ? 'Completed' : 'Not Completed'
      );
    });

    await AllureReporter.attachScreenshot(page, 'Send First Message Task Completed');
  });

  test('should mark "Create channel" task as done after user creates a channel', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that the onboarding guide correctly marks the "Create channel" task as completed after a user creates a new channel.
      
      **Test Steps:**
      1. Check initial channel task status in onboarding guide
      2. Create a new channel (text channel, public)
      3. Verify the "Create channel" task is marked as done
      
      **Expected Result:** The "Create channel" task should show as completed with a green checkmark after successfully creating a channel.
    `);

    await AllureReporter.addLabels({
      tag: ['onboarding', 'channel-creation', 'task-completion', 'clan-management'],
    });

    const clanPage = new ClanPage(page);
    const onboardingPage = new OnboardingPage(page);
    const testChannelName = `test-channel-${Date.now()}`;

    await AllureReporter.addParameter('testChannelName', testChannelName);
    await AllureReporter.addParameter('channelType', ChannelType.TEXT);
    await AllureReporter.addParameter('channelStatus', ChannelStatus.PUBLIC);

    await AllureReporter.step('Check initial channel task status', async () => {
      const onboardingVisible = await onboardingPage.isOnboardingGuideVisible();
      if (!onboardingVisible) {
        await onboardingPage.openOnboardingGuide();
      }

      await AllureReporter.attachScreenshot(page, 'Initial Channel Task Status');
    });

    let channelCreated = false;
    await AllureReporter.step('Perform create channel workflow', async () => {
      channelCreated = await clanPage.createNewChannel(
        ChannelType.TEXT,
        testChannelName,
        ChannelStatus.PUBLIC
      );

      await AllureReporter.addParameter(
        'channelCreationResult',
        channelCreated ? 'Success' : 'Failed'
      );

      if (channelCreated) {
        await AllureReporter.attachScreenshot(page, 'Channel Created Successfully');
      } else {
        await AllureReporter.attachScreenshot(page, 'Channel Creation Failed');
      }
    });

    await AllureReporter.step('Verify "Create channel" task completion', async () => {
      const isTaskMarkedDone = await onboardingPage.waitForTaskToBeMarkedDone(
        OnboardingTask.CREATE_CHANNEL,
        10000
      );
      expect(isTaskMarkedDone).toBe(true);
      await AllureReporter.addParameter(
        'channelTaskCompletionStatus',
        isTaskMarkedDone ? 'Completed' : 'Not Completed'
      );
    });

    await AllureReporter.attachScreenshot(page, 'Create Channel Task Completed');
  });

  test('Verify that user can enable onboarding on clan settings', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63368',
      github_issue: '10991',
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that user can enable onboarding on clan settings

    **Test Steps:**
    1. Open clan settings -> onboarding tab
    2. Click enable onboarding
    3. Click setup question
    4. Add task
    5. Add question, answer title, answer description and save

    **Expected Result:** Verify that user can enable onboarding on clan settings
  `);

    await AllureReporter.addLabels({
      tag: ['clan-setting', 'onboarding', 'pre-question', 'enable'],
    });

    const clanPage = new ClanPage(page);
    const onboardingPage = new OnboardingPage(page);
    const data = {
      question: 'This is question',
      answerTitle: 'This is answer title',
      answerDescription: 'This is answer description',
      taskName: 'Send a message',
    };

    await AllureReporter.step('Enable onboarding on clan', async () => {
      await clanPage.openClanSettings();
      await onboardingPage.verifyEnableOnboardingOnClanSettingsSidebar(false);
      await onboardingPage.openOnboardingTab();
      await onboardingPage.clickEnableOnboarding();
    });

    await AllureReporter.step('Enable onboarding', async () => {
      await onboardingPage.addTaskOnboarding(data.taskName);
      await onboardingPage.clickBackOnboardingModal();
      await onboardingPage.addPrequestionOnboaring(
        data.question,
        data.answerTitle,
        data.answerDescription
      );
    });

    await AllureReporter.step('Verify onboarding is enable', async () => {
      await onboardingPage.verifyEnableOnboardingOnClanSettingsSidebar();
    });
  });

  test('Verify that onboarding page is visible and data is match', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63368',
      github_issue: '10991',
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that onboarding page is visible and data is match

    **Test Steps:**
    1. Open clan settings -> onboarding tab
    2. Click enable onboarding
    3. Click setup question
    4. Add question, answer title, answer description and save
    5. Verify pre-question is visible on preview

    **Expected Result:** Verify that onboarding page is visible and data is match
  `);

    await AllureReporter.addLabels({
      tag: ['clan-setting', 'onboarding', 'task'],
    });

    const clanPage = new ClanPage(page);
    const onboardingPage = new OnboardingPage(page);
    const data = {
      question: 'This is question',
      answerTitle: 'This is answer title',
      answerDescription: 'This is answer description',
      taskName: 'Send a message',
    };

    await AllureReporter.step('Enable onboarding on clan', async () => {
      await clanPage.openClanSettings();
      await onboardingPage.verifyEnableOnboardingOnClanSettingsSidebar(false);
      await onboardingPage.openOnboardingTab();
      await onboardingPage.clickEnableOnboarding();
    });

    await AllureReporter.step('Enable onboarding', async () => {
      await onboardingPage.addTaskOnboarding(data.taskName);
      await onboardingPage.clickBackOnboardingModal();
      await onboardingPage.addPrequestionOnboaring(
        data.question,
        data.answerTitle,
        data.answerDescription
      );
    });

    await AllureReporter.step('Verify onboarding is enable', async () => {
      await onboardingPage.verifyEnableOnboardingOnClanSettingsSidebar();
      await clanPage.closeSettingsClan();
    });

    await AllureReporter.step('Verify onboarding page is enable and data is match', async () => {
      await onboardingPage.verifyOnboardingPageVisible();
      await onboardingPage.openOnboardingPage();
      await onboardingPage.verifyOnboardingSetupByType(
        'question',
        data.answerTitle,
        data.answerDescription,
        data.question
      );
      await onboardingPage.verifyOnboardingSetupByType('mission', data.taskName);
    });
  });

  test('Verify that onboarding settings is match on preview mode', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63368',
      github_issue: '10991',
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that onboarding settings is match on preview mode

    **Test Steps:**
    1. Open clan settings -> onboarding tab
    2. Click enable onboarding
    3. Click setup question
    4. Add question, answer title, answer description and save
    5. Verify pre-question is visible on preview

    **Expected Result:** Verify that onboarding settings is match on preview mode
  `);

    await AllureReporter.addLabels({
      tag: ['clan-setting', 'onboarding', 'task', 'preview-mode'],
    });

    const clanPage = new ClanPage(page);
    const onboardingPage = new OnboardingPage(page);
    const data = {
      question: 'This is question',
      answerTitle: 'This is answer title',
      answerDescription: 'This is answer description',
      taskName: 'Send a message',
    };

    await AllureReporter.step('Enable onboarding on clan', async () => {
      await clanPage.openClanSettings();
      await onboardingPage.verifyEnableOnboardingOnClanSettingsSidebar(false);
      await onboardingPage.openOnboardingTab();
      await onboardingPage.clickEnableOnboarding();
    });

    await AllureReporter.step('Enable onboarding', async () => {
      await onboardingPage.addTaskOnboarding(data.taskName);
      await onboardingPage.clickBackOnboardingModal();
      await onboardingPage.addPrequestionOnboaring(
        data.question,
        data.answerTitle,
        data.answerDescription
      );
    });

    await AllureReporter.step('Verify onboarding is enable', async () => {
      await onboardingPage.verifyEnableOnboardingOnClanSettingsSidebar();
    });

    await AllureReporter.step(
      'Verify that onboarding settings is match on preview mode',
      async () => {
        await onboardingPage.openOnboardingPreviewMode();
        await onboardingPage.verifyOnboardingSetupByType(
          'question',
          data.answerTitle,
          data.answerDescription,
          data.question
        );
        await onboardingPage.verifyOnboardingSetupByType('mission', data.taskName);
        await onboardingPage.closeOnboardingPreviewMode();
        await clanPage.closeSettingsClan();
      }
    );
  });
});
