import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import MessageSelector from '@/data/selectors/MessageSelector';
import { FriendPage } from '@/pages/FriendPage';
import { MessagePage } from '@/pages/MessagePage';
import { MezonCredentials } from '@/types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails } from '@/utils/dualTestHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Direct Message 2', () => {
  const clanFactory = new ClanFactory();
  const credentials: MezonCredentials = AccountCredentials.account3;
  const [userNameA] = getUsernamesFromEmails([credentials.email]);

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.directMessage1,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63370',
    });

    await TestSuiteHelper.setupBeforeEach({
      page,
      clanFactory,
      credentials,
    });
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({
      browser,
      clanFactory,
      credentials,
    });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test('Verify Input is not focused on Search modal when standing at Direct Message', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '66038',
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Input is not focused on Search modal when standing at Direct Message
      **Test Steps:**
      1. Send friend request and create a DM
      2. Click on DM chat input to track it
      3. Press Ctrl + K to open search modal
      4. Enter text in search modal
      5. Verify only search modal input is filled, DM chat input is not filled
    `);

    await AllureReporter.addLabels({
      tag: ['direct-message', 'search-modal', 'input'],
    });

    const friendPage = new FriendPage(page);
    const messagePage = new MessagePage(page);
    const messageHelpers = new MessageTestHelpers(page);
    const messageSelector = new MessageSelector(page);
    const account = AccountCredentials['account4'];
    const [userNameB] = getUsernamesFromEmails([account.email]);
    const searchModalText = 'testing search modal input';

    await AllureReporter.step('Add friend with a user and create dm', async () => {
      await messagePage.openSearchModalbyPressCtrlK();
      await messageHelpers.openDMByNameOnsearchModal(userNameB);
    });

    await AllureReporter.step('Track DM input and open search modal', async () => {
      await messageSelector.messageInput.click();
      await messagePage.openSearchModalbyPressCtrlK();
    });

    await AllureReporter.step('Fill text in search modal', async () => {
      await messageSelector.searchInput.click();
      await page.keyboard.type(searchModalText);
    });

    await AllureReporter.step('Verify only search modal input has text', async () => {
      const searchInputText = await messageSelector.searchInput.inputValue();
      expect(searchInputText).toContain(searchModalText);

      const dmInputText = await messageSelector.messageInput.innerText();
      expect(dmInputText).not.toContain(searchModalText);
    });

    await AllureReporter.step('Close search modal', async () => {
      await messagePage.closeSearchModal();
    });
  });
});
