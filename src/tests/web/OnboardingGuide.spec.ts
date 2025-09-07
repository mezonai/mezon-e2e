import { AllureConfig } from '@/config/allure.config';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { OnboardingTask } from '@/types/onboarding.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';
import { OnboardingHelpers } from '../../utils/onboardingHelpers';
import generateRandomString from '@/utils/randomString';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { WEBSITE_CONFIGS } from '@/config/environment';
import { ROUTES } from '@/selectors';

test.describe('Onboarding Guide Task Completion', () => {
  let createdClanName: string;
  test.beforeEach(async ({ page }, testInfo) => {
    // await AllureReporter.initializeTest(page, testInfo, {
    //   suite: AllureConfig.Suites.USER_MANAGEMENT,
    //   subSuite: AllureConfig.SubSuites.USER_PROFILE,
    //   story: AllureConfig.Stories.PROFILE_SETUP,
    //   severity: AllureConfig.Severity.CRITICAL,
    //   testType: AllureConfig.TestTypes.E2E,
    // });

    await AllureReporter.addWorkItemLinks({
      tms: '63452',
    });

    await AllureReporter.step('Create clan and navigate to channel', async () => {
      const clanPage = new ClanPageV2(page);
      const clanName = `Onboarding Clan ${generateRandomString(10)}`;
      await clanPage.navigate(joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL || '', ROUTES.DIRECT_FRIENDS));
      await clanPage.clickCreateClanButton();
      await clanPage.createNewClan(clanName);
      createdClanName = clanName;
      const isClanPresent = await clanPage.isClanPresent(clanName);
      if (!isClanPresent) return;
    });
  });
  test.afterEach(async ({ page }) => {
    if (!createdClanName) return;
    const clanPage = new ClanPageV2(page);
    await AllureReporter.step('Cleanup: delete created clan', async () => {
      const deleted = await clanPage.deleteClan(createdClanName);
      if (!deleted) {
        await AllureReporter.attachScreenshot(page, 'Cleanup Failed - Delete Clan');
      }
    });
    createdClanName = '';
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
      await AllureReporter.addParameter('messageSent', sent);
    });

    await AllureReporter.step('Verify "Send first message" task is marked as done', async () => {
      await page.waitForTimeout(2000);
      
      const isTaskMarkedDone = await helpers.waitForTaskCompletion(
        OnboardingTask.SEND_FIRST_MESSAGE,
        15000
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

    const clanPage = new ClanPageV2(page);
    const onboardingPage = new OnboardingPage(page);
    const testChannelName = `test-channel-${Date.now()}`;

    await AllureReporter.addParameter('testChannelName', testChannelName);
    await AllureReporter.addParameter('channelType', ChannelType.TEXT);
    await AllureReporter.addParameter('channelStatus', ChannelStatus.PUBLIC);

    await AllureReporter.step('Check initial channel task status', async () => {
      await page.waitForTimeout(3000);

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
         20000
       );
       
       expect(isTaskMarkedDone).toBe(true);
       await AllureReporter.addParameter(
         'channelTaskCompletionStatus',
         isTaskMarkedDone ? 'Completed' : 'Not Completed'
       );
     });

    await AllureReporter.attachScreenshot(page, 'Create Channel Task Completed');
  });
});
