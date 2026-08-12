import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { Page } from '@playwright/test';
import { runChannelMessageCase } from './ChannelMessageTestHelpers';

test.describe('Channel Messages - Ordering, Editing, and Deleting', () => {
  const credentials = AccountCredentials.account3;
  const clanFactory = new ClanFactory();
  test.beforeAll(async ({ browser }) =>
    TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelMessage3,
      credentials,
    })
  );
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
      `**Test Objective:** ${title}.\n\n**Test Steps:**\n1. Open the clan channel.\n2. Perform the message action.\n3. Verify message order or content.\n\n**Expected Result:** The message state is updated correctly.`
    );
    await AllureReporter.addLabels({ tag: ['channel-message', 'message-actions'] });
    await AllureReporter.step(title, () => runChannelMessageCase(page, id));
  }
  test('Verify that messages are displayed in the order they were sent', async ({ page }) =>
    execute(page, 16, 'Send two messages and verify their order'));
  test('Verify that a message containing emoji can be edited', async ({ page }) =>
    execute(page, 17, 'Edit an emoji message and verify its new content'));
  test('Verify that a message containing special characters can be deleted', async ({ page }) =>
    execute(page, 18, 'Delete a special-character message and verify it is removed'));
  test('Verify that canceling delete keeps the original message', async ({ page }) =>
    execute(page, 19, 'Cancel message deletion and verify the message remains'));
  test('Verify that canceling edit keeps the original message', async ({ page }) =>
    execute(page, 20, 'Cancel message editing and verify the original content remains'));
});
