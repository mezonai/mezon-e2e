import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Messages - Multi-Choice Poll and Retract Vote', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account8;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage8,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('Verify that user can vote on multiple options and retract vote on poll card', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63402',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can create a multi-choice poll, vote on options, and retract their vote.

      **Test Steps:**
      1. Create a text channel
      2. Open poll modal
      3. Create poll with multiple choices allowed (allowMulti = true)
      4. Vote on option 1
      5. Verify vote state
      6. Retract vote using remove vote button
      7. Verify user can vote again
      8. Clean up channel

      **Expected Result:** Multi-choice poll allows voting and vote retraction works properly.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-message', 'poll', 'multi-vote', 'retract-vote'],
    });

    const messagePage = new MessagePage(page);
    const clanPage = new ClanPage(page);

    const unique = generateRandomString(6).toLowerCase();
    const channelName = `poll-multi-${unique}`;
    const question = `Favorite framework? (${unique})`;
    const answers = ['Playwright', 'Cypress', 'Selenium'];

    await AllureReporter.step(`Create text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step('Create multi-choice poll', async () => {
      await messagePage.openCreatePoll();
      await messagePage.createPoll(question, answers, true);
      await messagePage.verifyPollCard(question, answers);
    });

    await AllureReporter.step('Vote on option 0', async () => {
      await messagePage.votePollByIndex(0);
      await messagePage.verifyUserVoted(0);
    });

    await AllureReporter.step('Retract vote and verify voting can be redone', async () => {
      await messagePage.retractVote();
    });

    await AllureReporter.step('Vote on option 1 after retracting', async () => {
      await messagePage.votePollByIndex(1);
      await messagePage.verifyUserVoted(1);
    });
  });
});
