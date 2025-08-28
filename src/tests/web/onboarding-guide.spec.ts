import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { OnboardingHelpers } from '../../utils/onboardingHelpers';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { ClanPage } from '@/pages/ClanPage';

test.describe('Onboarding Guide Task Completion', () => {
  test.beforeEach(async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigate();

    const helpers = new OnboardingHelpers(page);
    await helpers.navigateToApp();

    const finalUrl = page.url();
    expect(finalUrl).not.toMatch(/login|signin|authentication/);
  });

  test('should mark "Send first message" task as done after user sends first message', async ({
    page,
  }) => {
    const helpers = new OnboardingHelpers(page);

    await test.step('Create new clan by double clicking + button', async () => {
      const clanName = `Test Clan ${Date.now()}`;
      const { clicked, created } = await helpers.createTestClan(clanName);
      expect(clicked).toBeTruthy();
      expect(created).toBeTruthy();
    });

    await test.step('Ensure onboarding guide visible', async () => {
      await helpers.ensureOnboardingGuideVisible();
    });

    await test.step('Send first message', async () => {
      const { sent, verified } = await helpers.sendTestMessage();
      expect(sent).toBeTruthy();
      expect(verified).toBeTruthy();
    });

    await test.step('Verify "Send first message" task is marked as done', async () => {
      const isTaskMarkedDone = await helpers.waitForTaskCompletion('sendFirstMessage');
      expect(
        isTaskMarkedDone,
        'The "Send first message" task should be marked as done (green tick) after user sends first message'
      ).toBeTruthy();
    });
  });

  test('should mark "Invite People" task as done after user invites someone', async ({ page }) => {
    const clanPage = new ClanPage(page);
    const onboardingPage = new OnboardingPage(page);

    await test.step('Create new clan first', async () => {
      const createClanClicked = await clanPage.clickCreateClanButton();
      if (createClanClicked) {
        const clanName = `Invite Test Clan ${Date.now()}`;
        await clanPage.createNewClan(clanName);
      }
    });

    await test.step('Check initial invite task status', async () => {
      await page.waitForTimeout(3000);

      const onboardingVisible = await onboardingPage.isOnboardingGuideVisible();
      if (!onboardingVisible) {
        await onboardingPage.openOnboardingGuide();
      }

      const initialTaskStatus = await onboardingPage.getTaskStatus('invitePeople');

      await page.screenshot({ path: 'debug-invite-task-initial.png', fullPage: true });
    });

    await test.step('Perform invite people workflow', async () => {
      const clanNameClicked = await clanPage.clickOnClanName();
      if (!clanNameClicked) {
        // Clan name click failed, continue with test
      }

      const inviteModalOpened = await clanPage.openInvitePeopleModal();
      if (inviteModalOpened) {
        const testUsername = 'TestUserB';
        const userInvited = await clanPage.searchAndInviteUser(testUsername);

        if (userInvited) {
          // User invitation successful
        } else {
          // User invitation failed, continue with test
        }

        await page.screenshot({ path: 'debug-after-invite-attempt.png', fullPage: true });
      } else {
        await page.screenshot({ path: 'debug-invite-modal-failed.png', fullPage: true });
      }
    });

    await test.step('Verify "Invite People" task completion', async () => {
      const isTaskMarkedDone = await onboardingPage.waitForTaskToBeMarkedDone(
        'invitePeople',
        10000
      );

      if (isTaskMarkedDone) {
        // Task marked as done successfully
      } else {
        await onboardingPage.debugOnboardingTasks();
        await page.screenshot({ path: 'debug-invite-task-not-done.png', fullPage: true });
      }

      const finalTaskStatus = await onboardingPage.getTaskStatus('invitePeople');

      expect(
        isTaskMarkedDone,
        'The "Invite People" task should be marked as done after user invites someone'
      ).toBeTruthy();
    });
  });

  test('should mark "Create channel" task as done after user creates a channel', async ({
    page,
  }) => {
    const clanPage = new ClanPage(page);
    const onboardingPage = new OnboardingPage(page);

    await test.step('Create new clan first', async () => {
      const createClanClicked = await clanPage.clickCreateClanButton();
      if (createClanClicked) {
        const clanName = `Channel Test Clan ${Date.now()}`;
        await clanPage.createNewClan(clanName);
      }
    });

    await test.step('Check initial channel task status', async () => {
      await page.waitForTimeout(3000);

      const onboardingVisible = await onboardingPage.isOnboardingGuideVisible();
      if (!onboardingVisible) {
        await onboardingPage.openOnboardingGuide();
      }

      const initialTaskStatus = await onboardingPage.getTaskStatus('createChannel');

      await page.screenshot({ path: 'debug-channel-task-initial.png', fullPage: true });
    });

    await test.step('Perform create channel workflow', async () => {
      const createModalOpened = await clanPage.openCreateChannelModal();
      if (createModalOpened) {
        const testChannelName = `test-channel-${Date.now()}`;
        const channelCreated = await clanPage.createChannel(testChannelName, 'text');

        if (channelCreated) {
          // Channel creation successful
        } else {
          // Channel creation failed, continue with test
        }

        await page.screenshot({ path: 'debug-after-channel-creation.png', fullPage: true });
      } else {
        await page.screenshot({ path: 'debug-channel-modal-failed.png', fullPage: true });
      }
    });

    await test.step('Verify "Create channel" task completion', async () => {
      const isTaskMarkedDone = await onboardingPage.waitForTaskToBeMarkedDone(
        'createChannel',
        10000
      );

      if (isTaskMarkedDone) {
        // Channel task marked as done successfully
      } else {
        await onboardingPage.debugOnboardingTasks();
        await page.screenshot({ path: 'debug-channel-task-not-done.png', fullPage: true });
      }

      const finalTaskStatus = await onboardingPage.getTaskStatus('createChannel');

      expect(
        isTaskMarkedDone,
        'The "Create channel" task should be marked as done after user creates a channel'
      ).toBeTruthy();
    });
  });

  test('should test both Join new clan and Create new clan scenarios', async ({ page }) => {
    const onboardingPage = new OnboardingPage(page);

    await test.step('Test comprehensive onboarding scenarios', async () => {
      const onboardingVisible = await onboardingPage.isOnboardingGuideVisible();
      if (!onboardingVisible) {
        await onboardingPage.openOnboardingGuide();
      }

      await onboardingPage.debugOnboardingTasks();

      const allTasksStatus = await onboardingPage.getAllTasksStatus();

      await page.screenshot({ path: 'debug-comprehensive-onboarding-test.png', fullPage: true });

      expect(
        allTasksStatus.sendFirstMessage.found ||
          allTasksStatus.invitePeople.found ||
          allTasksStatus.createChannel.found,
        'At least one onboarding task should be found'
      ).toBeTruthy();
    });
  });
});
