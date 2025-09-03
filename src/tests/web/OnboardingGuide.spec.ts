import { AllureConfig, TestSetups } from '@/config/allure.config';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { OnboardingTask } from '@/types/onboarding.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { OnboardingHelpers } from '../../utils/onboardingHelpers';

test.describe('Onboarding Guide Task Completion', () => {
  let testClanName: string;
  let clanUrl: string;

  test.beforeAll(async ({ browser }) => {
    await TestSetups.clanTest({
      suite: AllureConfig.Suites.USER_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.USER_PROFILE,
      story: AllureConfig.Stories.PROFILE_SETUP,
      severity: AllureConfig.Severity.CRITICAL,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const homePage = new HomePage(page);
      await homePage.navigate();

      const clanPage = new ClanPageV2(page);
      await clanPage.navigate('/chat/direct/friends');
      const createClanClicked = await clanPage.clickCreateClanButton();
      if (createClanClicked) {
        testClanName = `KESON Test Clan ${Date.now()}`;
        await clanPage.createNewClan(testClanName);
        await page.waitForTimeout(5000);
        clanUrl = page.url();
      }
    } catch (error) {
      console.error('Error creating clan:', error);
    } finally {
      await context.close();
    }
  });

  test.afterAll(async ({ browser }) => {
    if (testClanName && clanUrl) {
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await page.goto(clanUrl);
        await page.waitForTimeout(3000);
        const clanPage = new ClanPageV2(page);
        await clanPage.deleteClan(testClanName);
      } catch (error) {
        console.error(`❌ Error deleting test clan: ${error}`);
      } finally {
        await context.close();
      }
    } else {
      console.log('⚠️ No clan name or URL available for cleanup');
    }
  });

  test.beforeEach(async ({ page }, testInfo) => {
    await AllureReporter.initializeTest(page, testInfo, {
      suite: AllureConfig.Suites.USER_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.USER_PROFILE,
      story: AllureConfig.Stories.PROFILE_SETUP,
      severity: AllureConfig.Severity.CRITICAL,
      testType: AllureConfig.TestTypes.E2E,
    });

    if (clanUrl) {
      await AllureReporter.step('Navigate to test clan', async () => {
        await page.goto(clanUrl);
        await page.waitForTimeout(3000);
      });
      await AllureReporter.addParameter('testClanName', testClanName);
      await AllureReporter.addParameter('clanUrl', clanUrl);
    }
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
});
