import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { Page } from '@playwright/test';
import { runChannelMessageCase } from './ChannelMessageTestHelpers';

test.describe('Channel Messages - Safe Content and Composer State', () => {
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
      `**Test Objective:** ${title}.\n\n**Test Steps:**\n1. Open the clan channel.\n2. Perform the content or composer action.\n3. Verify the expected state.\n\n**Expected Result:** The content and composer remain consistent.`
    );
    await AllureReporter.addLabels({ tag: ['channel-message', 'composer-state'] });
    await AllureReporter.step(title, () => runChannelMessageCase(page, id));
  }
  test('Verify that HTML-like content is rendered safely', async ({ page }) =>
    execute(page, 11, 'Send HTML-like content and verify it is not executed'));
  test('Verify that quotes and slashes are rendered correctly', async ({ page }) =>
    execute(page, 12, 'Send and verify quotes and slash characters'));
  test('Verify that Escape keeps composer text when no attachment is selected', async ({ page }) =>
    execute(page, 13, 'Press Escape and verify composer text remains'));
  test('Verify that the composer is cleared after sending a message', async ({ page }) =>
    execute(page, 14, 'Send a message and verify the composer is cleared'));
  test('Verify that a sent message remains after page reload', async ({ page }) =>
    execute(page, 15, 'Reload the page and verify sent content remains'));
});
