import { ClanPageV2 } from '@/pages/ClanPageV2';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { OnboardingTask } from '@/types/onboarding.types';
import { expect, test } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { OnboardingHelpers } from '../../utils/onboardingHelpers';

test.describe('Onboarding Guide Task Completion', () => {
  let testClanName: string;
  let clanUrl: string;

  test.beforeAll(async ({ browser }) => {
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

  test.beforeEach(async ({ page }) => {
    if (clanUrl) {
      await page.goto(clanUrl);
      await page.waitForTimeout(3000);
    }
  });

  test('should mark "Send first message" task as done after user sends first message', async ({
    page,
  }) => {
    const helpers = new OnboardingHelpers(page);
    await test.step('Ensure onboarding guide visible', async () => {
      await helpers.ensureOnboardingGuideVisible();
    });

    await test.step('Send first message', async () => {
      const { sent } = await helpers.sendTestMessage();
      expect(sent).toBe(true);
    });

    await test.step('Verify "Send first message" task is marked as done', async () => {
      const isTaskMarkedDone = await helpers.waitForTaskCompletion(
        OnboardingTask.SEND_FIRST_MESSAGE
      );
      expect(
        isTaskMarkedDone,
        'The "Send first message" task should be marked as done (green tick) after user sends first message'
      ).toBe(true);
    });
  });

  test('should mark "Create channel" task as done after user creates a channel', async ({
    page,
  }) => {
    const clanPage = new ClanPageV2(page);
    const onboardingPage = new OnboardingPage(page);

    await test.step('Check initial channel task status', async () => {
      await page.waitForTimeout(3000);

      const onboardingVisible = await onboardingPage.isOnboardingGuideVisible();
      if (!onboardingVisible) {
        await onboardingPage.openOnboardingGuide();
      }

      await page.screenshot({ path: 'screenshots/debug-channel-task-initial.png', fullPage: true });
    });

    await test.step('Perform create channel workflow', async () => {
      const testChannelName = `test-channel-${Date.now()}`;
      const channelCreated = await clanPage.createNewChannel(
        ChannelType.TEXT,
        testChannelName,
        ChannelStatus.PUBLIC
      );

      if (channelCreated) {
        await page.screenshot({
          path: 'screenshots/debug-after-channel-creation.png',
          fullPage: true,
        });
      } else {
        await page.screenshot({
          path: 'screenshots/debug-channel-creation-failed.png',
          fullPage: true,
        });
      }
    });

    await test.step('Verify "Create channel" task completion', async () => {
      const isTaskMarkedDone = await onboardingPage.waitForTaskToBeMarkedDone(
        OnboardingTask.CREATE_CHANNEL,
        10000
      );
      expect(isTaskMarkedDone).toBe(true);
    });
  });
});
