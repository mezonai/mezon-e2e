import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { OnboardingHelpers } from '../../utils/onboardingHelpers';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { ChannelType, ChannelStatus } from '@/types/clan-page.types';
import { OnboardingTask } from '@/types/onboarding.types';

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
        testClanName = `Onboarding Test Clan ${Date.now()}`;
        await clanPage.createNewClan(testClanName);
        await page.waitForTimeout(5000);
        clanUrl = page.url();
        const testChannelName = `test-channel-${Date.now()}`;
        await clanPage.createNewChannel(
          ChannelType.TEXT,
          testChannelName,
          ChannelStatus.PUBLIC,
          true
        );

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
});
