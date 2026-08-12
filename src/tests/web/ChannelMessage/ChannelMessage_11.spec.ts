import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { Page } from '@playwright/test';
import { runChannelMessageCase } from './ChannelMessageTestHelpers';

test.describe('Channel Messages - Empty Input and Duplicate Submission', () => {
  const credentials = AccountCredentials.account3;
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage3,
      credentials,
    });
  });
  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });
  test.afterEach(async ({ page }) => AuthHelper.logout(page));
  test.afterAll(async ({ browser }) =>
    TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials })
  );

  async function execute(page: Page, id: number, title: string): Promise<void> {
    await AllureReporter.addDescription(
      `**Test Objective:** ${title}.\n\n**Test Steps:**\n1. Open the clan channel.\n2. Perform the input action.\n3. Verify the message state.\n\n**Expected Result:** ${title}.`
    );
    await AllureReporter.addLabels({ tag: ['channel-message', 'input-validation'] });
    await AllureReporter.step(title, () => runChannelMessageCase(page, id));
  }

  test('Verify that an empty message cannot be sent', async ({ page }) =>
    execute(page, 1, 'Submit an empty message and verify no message is created'));
  test('Verify that a spaces-only message cannot be sent', async ({ page }) =>
    execute(page, 2, 'Submit a spaces-only message and verify no message is created'));
  test('Verify that a tabs-only message cannot be sent', async ({ page }) =>
    execute(page, 3, 'Submit a tabs-only message and verify no message is created'));
  test('Verify that a newlines-only message cannot be sent', async ({ page }) =>
    execute(page, 4, 'Submit a newlines-only message and verify no message is created'));
  test('Verify that repeated Enter does not create duplicate messages', async ({ page }) =>
    execute(page, 5, 'Press Enter repeatedly and verify only one message is created'));
});
