import { AllureConfig, TestSetups } from '@/config/allure.config';
import { GLOBAL_CONFIG } from '@/config/environment';
import { MessgaePage } from '@/pages/MessagePage';
import { AllureReporter } from '@/utils/allureHelpers';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect, test } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { ROUTES } from '@/selectors';

test.describe('Direct Message', () => {
  test.beforeAll(async () => {
    await TestSetups.chatTest({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: AllureConfig.SubSuites.FRIEND_MANAGEMENT,
      story: AllureConfig.Stories.TEXT_MESSAGING,
      severity: AllureConfig.Severity.CRITICAL,
    });
  });

  test.beforeEach(async ({ page }, testInfo) => {
    await AllureReporter.initializeTest(page, testInfo, {
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: AllureConfig.SubSuites.FRIEND_MANAGEMENT,
      story: AllureConfig.Stories.TEXT_MESSAGING,
      severity: AllureConfig.Severity.CRITICAL,
      testType: AllureConfig.TestTypes.E2E,
    });

    await AllureReporter.addWorkItemLinks({
      tms: '63460',
    });

    const homePage = new HomePage(page);

    await AllureReporter.step('Navigate to home page', async () => {
      await homePage.navigate();
    });

    await AllureReporter.step('Navigate to direct friends page', async () => {
      await page.goto(joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS));
    });
  });

  test('Verify that I can add a friend by add friend input with username - a non-friend user', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63461',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully add a friend.
      
      **Test Steps:**
      1. Add a friend
      2. Verify the friend request is shown in the pending friend requests list
    `);

    await AllureReporter.addLabels({
      tag: ['friend-management', 'add-friend'],
    });

    const messagePage = new MessgaePage(page);

    await AllureReporter.step('Add friend', async () => {
      await messagePage.addFriendByUsername('test');
      await page.waitForTimeout(3000);
    });

    await AllureReporter.step('Verify the friend request is sent', async () => {
      const friendRequestSent = await messagePage.isFriendRequestSent('test');
      expect(friendRequestSent).toBeTruthy();
    });
  });
});
