import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { OnboardingHelpers } from '@/utils/onboardingHelpers';
import pressEsc from '@/utils/pressEsc';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { expect } from '@playwright/test';

test.describe('Channel Management - Module 2', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials['account1'];

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63366',
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

  test('verify that I can delete a channel, deleted channel not in forward list and search modal ', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64609',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully delete a channel.
      
      **Test Steps:**
      1. Create a text channel
      2. Delete channel
      3. Verify channel not visible on forward list
      4. Verify channel not visible on search modal
      
      **Expected Result:** User can can successfully delete a channel.
    `);

    await AllureReporter.addLabels({
      tag: ['text-channel', 'delete-channel'],
    });

    const unique = Date.now().toString(36).slice(-6);
    const channelName = `tc-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
    const helpers = new OnboardingHelpers(page);
    const messagePage = new MessagePage(page);

    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('channelType', ChannelType.TEXT);

    await AllureReporter.step(`Create new text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('Delete channel by name', async () => {
      await clanPage.openChannelSettings(channelName);
      await channelSettings.deleteChannel();
    });

    await AllureReporter.step('Verify that deleted channel is not in forward list', async () => {
      await clanPage.openChannelByName('general');
      const { sent } = await helpers.sendTestMessage();
      expect(sent).toBe(true);

      await messagePage.openForwardMessageModal();
      const isNewChannelPresentOnForwardModal =
        await messagePage.isChannelPresentOnForwardModal(channelName);
      expect(isNewChannelPresentOnForwardModal).toBe(false);

      await messagePage.closeModalForwardMessage();
    });

    await AllureReporter.step('Verify that deleted channel is not in search modal', async () => {
      await messagePage.openSearchModalbyPressCtrlK();
      const isNewChannelPresentOnSearchModal =
        await messagePage.isChannelPresentOnSearchModal(channelName);
      expect(isNewChannelPresentOnSearchModal).toBe(false);
      await pressEsc(page);
    });

    await AllureReporter.attachScreenshot(page, `Text Channel deleted - ${channelName}`);
  });

  test('verify that Channel is moved to new category after switching category', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '65041',
      github_issue: '11089',
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully move a channel to new category.
      
      **Test Steps:**
      1. Create a category and do not enable show empty categories
      2. Create a text channel in default category
      3. Open channel settings and move to new category
      4. Verify category is present in sidebar
      
      **Expected Result:** User can can successfully move a channel to new category.
    `);

    const categoryName = `category-${generateRandomString(5)}`;
    const channelName = `channel-${generateRandomString(5)}`;

    const clanPage = new ClanPage(page);
    const menuPanel = new ClanMenuPanel(page);
    const channelSettings = new ChannelSettingPage(page);

    await AllureReporter.step('Create a category', async () => {
      await menuPanel.createCategory(categoryName);
      await menuPanel.toggleShowEmptyCategory();
    });

    await AllureReporter.step('Create a text channel in default category', async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('Open channel settings and move to new category', async () => {
      await clanPage.openChannelSettings(channelName);
      await channelSettings.openCategoryTab();
      await channelSettings.selectCategory(categoryName);
      await channelSettings.closeChannelSettings();
    });

    await AllureReporter.step('Verify channel is moved to new category', async () => {
      const isCategoryPresent = await menuPanel.isCategoryPresent(categoryName);
      expect(isCategoryPresent).toBe(true);
      await page.reload();
      const isCategoryPresentAfterReload = await menuPanel.isCategoryPresent(categoryName);
      expect(isCategoryPresentAfterReload).toBe(true);
    });
  });
});
