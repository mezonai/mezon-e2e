import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { Page } from '@playwright/test';
import { runChannelMessageCase } from './ChannelMessageTestHelpers';

test.describe('Channel Messages - Multiline and International Content', () => {
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
      `**Test Objective:** ${title}.\n\n**Test Steps:**\n1. Open the clan channel.\n2. Send the specified content.\n3. Verify the rendered message.\n\n**Expected Result:** The content is displayed correctly.`
    );
    await AllureReporter.addLabels({ tag: ['channel-message', 'international-content'] });
    await AllureReporter.step(title, () => runChannelMessageCase(page, id));
  }
  test('Verify that a multiline message can be sent with Shift+Enter', async ({ page }) =>
    execute(page, 6, 'Send and verify a multiline message'));
  test('Verify that Vietnamese content is rendered correctly', async ({ page }) =>
    execute(page, 7, 'Send and verify Vietnamese content'));
  test('Verify that CJK content is rendered correctly', async ({ page }) =>
    execute(page, 8, 'Send and verify CJK content'));
  test('Verify that right-to-left content is rendered correctly', async ({ page }) =>
    execute(page, 9, 'Send and verify right-to-left content'));
  test('Verify that combined emoji content is rendered correctly', async ({ page }) =>
    execute(page, 10, 'Send and verify combined emoji content'));
});
