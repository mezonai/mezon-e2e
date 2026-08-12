import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { Page } from '@playwright/test';
import { runChannelMessageCase } from './ChannelMessageTestHelpers';

test.describe('Channel Messages - URLs and Draft Persistence', () => {
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
      `**Test Objective:** ${title}.\n\n**Test Steps:**\n1. Open the clan channel.\n2. Perform the URL or draft action.\n3. Verify links or composer content.\n\n**Expected Result:** The URL or draft state is correct.`
    );
    await AllureReporter.addLabels({ tag: ['channel-message', 'links-and-drafts'] });
    await AllureReporter.step(title, () => runChannelMessageCase(page, id));
  }
  test('Verify that a plain URL is rendered without changing message text', async ({ page }) =>
    execute(page, 26, 'Send a plain URL and verify its text and link'));
  test('Verify that multiple URLs are rendered in one message', async ({ page }) =>
    execute(page, 27, 'Send multiple URLs and verify both links'));
  test('Verify that malformed URL-like text is not rendered as a link', async ({ page }) =>
    execute(page, 28, 'Send malformed URL-like text and verify no link is created'));
  test('Verify that opening the pinned-message panel keeps the draft', async ({ page }) =>
    execute(page, 29, 'Open and close pinned messages and verify the draft remains'));
  test('Verify that opening the member panel keeps the draft', async ({ page }) =>
    execute(page, 30, 'Open and close the member panel and verify the draft remains'));
});
