import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { Page } from '@playwright/test';
import { runChannelMessageCase } from './ChannelMessageTestHelpers';

test.describe('Channel Messages - Markdown Rendering', () => {
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
      `**Test Objective:** ${title}.\n\n**Test Steps:**\n1. Open the clan channel.\n2. Send the markdown message.\n3. Verify the rendered content.\n\n**Expected Result:** Markdown content is displayed correctly.`
    );
    await AllureReporter.addLabels({ tag: ['channel-message', 'markdown'] });
    await AllureReporter.step(title, () => runChannelMessageCase(page, id));
  }
  test('Verify that bold markdown content can be sent', async ({ page }) =>
    execute(page, 21, 'Send and verify bold markdown content'));
  test('Verify that inline-code markdown content can be sent', async ({ page }) =>
    execute(page, 22, 'Send and verify inline-code markdown content'));
  test('Verify that level-one header markdown content can be sent', async ({ page }) =>
    execute(page, 23, 'Send and verify a level-one header title'));
  test('Verify that level-two header markdown content can be sent', async ({ page }) =>
    execute(page, 24, 'Send and verify a level-two header title'));
  test('Verify that fenced block-code markdown content can be sent', async ({ page }) =>
    execute(page, 25, 'Send and verify block code enclosed by three backticks'));
});
