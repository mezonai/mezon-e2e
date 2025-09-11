import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';
import { setupChannelMessageSuite } from './common/ChannelMessage-Base';

test.describe('Channel Message - Mentions & Hashtags', () => {
  const { getTestSuiteSetup } = setupChannelMessageSuite('Mentions Tests');

  test('Test hashtag channel functionality', async ({ page, context }) => {
    const { messageHelpers, testClanUrl } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63398',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const messageInput = await messageHelpers.findMessageInput();
    await messageInput.click();
    await page.waitForTimeout(500);

    await messageInput.type('#');
    await page.waitForTimeout(2000);

    const channelListVisible = await messageHelpers.verifyHashtagChannelList();
    expect(channelListVisible).toBeTruthy();

    const hasExpectedChannels = await messageHelpers.verifyExpectedChannelsInList();
    expect(hasExpectedChannels).toBeTruthy();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  });

  test('Mention user list appears with @', async ({ page, context }) => {
    const { messageHelpers, testClanUrl } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63399',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const messageInput = await messageHelpers.findMessageInput();
    await messageInput.click();
    await page.waitForTimeout(300);

    await messageInput.type('@');
    await page.waitForTimeout(1500);

    const mentionVisible = await messageHelpers.verifyMentionListVisible();
    expect(mentionVisible).toBeTruthy();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('Mention specific user and send message', async ({ page, context }) => {
    const { messageHelpers, testClanUrl } = getTestSuiteSetup();

    await AllureReporter.addWorkItemLinks({
      tms: '63399',
    });

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(testClanUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const candidateNames = ['nguyen.nguyen'];
    await messageHelpers.mentionUserAndSend('@ng', candidateNames);
  });
});
