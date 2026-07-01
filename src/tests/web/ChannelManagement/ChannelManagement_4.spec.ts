import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import pressEsc from '@/utils/pressEsc';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { expect } from '@playwright/test';

test.describe('Channel Management - Module 2', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials['account2'];

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

  test('Verify that archived channel is hidden on modal search', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64611',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that archived channel is hidden on modal search  
      Steps:
      1. Create a text channel
      2. Archive channel
      3. Verify that archived channel is not in channel list
      4. Verify that archived channel is in archived channel list
      5. Search for archived channel in modal search
    
     **Expected Result:** User cannot find archived channel in modal search.
    `);
    await AllureReporter.addLabels({
      tag: ['archive-channel', 'text-channel', 'modal-search'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const channelName = `tc-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
    const messagePage = new MessagePage(page);
    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.step(`Create new text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });
    await AllureReporter.step('Archive channel by name', async () => {
      await channelSettings.archiveChannel(channelName);
    });
    await AllureReporter.step('Verify that archived channel is not in channel list', async () => {
      const isChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isChannelPresent).toBe(false);
    });
    await AllureReporter.step(
      'Verify that archived channel is in archived channel list',
      async () => {
        const isChannelInArchivedList = await channelSettings.isChannelInArchivedList(channelName);
        expect(isChannelInArchivedList).toBe(true);
        await clanPage.closeSettingsClan();
      }
    );
    await AllureReporter.step('Search for archived channel in modal search', async () => {
      await messagePage.openSearchModalbyPressCtrlK();
      const isNewChannelPresentOnSearchModal =
        await messagePage.isChannelPresentOnSearchModal(channelName);
      expect(isNewChannelPresentOnSearchModal).toBe(false);
      await pressEsc(page);
    });
  });

  test('Verify that archived channel is hidden on modal forward', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64611',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that archived channel is hidden on modal forward  
      Steps:
      1. Create a text channel
      2. Archive channel
      3. Verify that archived channel is not in channel list
      4. Verify that archived channel is in archived channel list
      5. Send message to channel
      6. Forward message to archived channel
    
     **Expected Result:** User cannot find archived channel in modal forward.
    `);
    await AllureReporter.addLabels({
      tag: ['archive-channel', 'text-channel', 'modal-forward'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const channelName = `tc-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
    const messagePage = new MessagePage(page);
    const messageHelper = new MessageTestHelpers(page);
    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.step(`Create new text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });
    await AllureReporter.step('Archive channel by name', async () => {
      await channelSettings.archiveChannel(channelName);
    });
    await AllureReporter.step('Verify that archived channel is not in channel list', async () => {
      const isChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isChannelPresent).toBe(false);
    });
    await AllureReporter.step(
      'Verify that archived channel is in archived channel list',
      async () => {
        const isChannelInArchivedList = await channelSettings.isChannelInArchivedList(channelName);
        expect(isChannelInArchivedList).toBe(true);
        await clanPage.closeSettingsClan();
      }
    );

    await AllureReporter.step('Send message to a channel', async () => {
      await clanPage.openChannelByName('general');
      const message = 'Test message';
      await messageHelper.sendTextMessage(message);
    });

    await AllureReporter.step('Search for archived channel in modal forward', async () => {
      await messagePage.openForwardMessageModal();
      const isArchivedChannelPresentOnForwardModal =
        await messagePage.isChannelPresentOnForwardModal(channelName);
      expect(isArchivedChannelPresentOnForwardModal).toBe(false);
      await messagePage.closeModalForwardMessage();
    });
  });

  test('Verify that archived thread is hidden on modal search', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64612',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that archived thread is hidden on modal search.  
      Steps:
      1. Create a channel
      2. Create a thread from channel
      3. Archive thread channel
      4. Verify that archived thread channel is not in thread list
      5. Open Search modal and search for archived thread channel

      **Expected Result:** User cannot find archived thread channel in modal search.
    `);
    await AllureReporter.addLabels({
      tag: ['archive-thread-channel', 'thread-channel', 'modal-search'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const channelName = `tc-${unique}`.slice(0, 20);
    const threadChannelName = `thread-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
    const messagePage = new MessagePage(page);
    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('threadChannelName', threadChannelName);
    await AllureReporter.step(`Create new text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });
    await AllureReporter.step(`Create new thread channel: ${threadChannelName}`, async () => {
      await clanPage.createThread(threadChannelName);
      const isNewThreadPresent = await clanPage.isNewThreadPresent(threadChannelName);
      expect(isNewThreadPresent).toBe(true);
    });
    await AllureReporter.step('Archive thread channel by name', async () => {
      await channelSettings.archiveChannel(threadChannelName, true);
    });
    await AllureReporter.step(
      'Verify that archived thread channel is not in thread list',
      async () => {
        const isThreadChannelPresent = await clanPage.isNewThreadPresent(threadChannelName);
        expect(isThreadChannelPresent).toBe(false);
      }
    );
    await AllureReporter.step('Search for archived thread in modal search', async () => {
      await messagePage.openSearchModalbyPressCtrlK();
      const isArchivedThreadPresent =
        await messagePage.isChannelPresentOnSearchModal(threadChannelName);
      expect(isArchivedThreadPresent).toBe(false);
      await pressEsc(page);
    });
  });

  test('Verify that archived thread is hidden on modal forward', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64612',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that archived thread is hidden on modal forward.  
      Steps:
      1. Create a channel
      2. Create a thread from channel
      3. Archive thread channel
      4. Verify that archived thread channel is not in thread list
      5. Send message to channel
      6. Open Forward modal and search for archived thread channel

      **Expected Result:** User cannot find archived thread channel in modal forward.
    `);
    await AllureReporter.addLabels({
      tag: ['archive-thread-channel', 'thread-channel', 'modal-forward'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const channelName = `tc-${unique}`.slice(0, 20);
    const threadChannelName = `thread-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
    const messagePage = new MessagePage(page);
    const messageHelper = new MessageTestHelpers(page);
    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('threadChannelName', threadChannelName);
    await AllureReporter.step(`Create new text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });
    await AllureReporter.step(`Create new thread channel: ${threadChannelName}`, async () => {
      await clanPage.createThread(threadChannelName);
      const isNewThreadPresent = await clanPage.isNewThreadPresent(threadChannelName);
      expect(isNewThreadPresent).toBe(true);
    });
    await AllureReporter.step('Archive thread channel by name', async () => {
      await channelSettings.archiveChannel(threadChannelName, true);
    });

    await AllureReporter.step(
      'Verify that archived thread channel is not in thread list',
      async () => {
        const isThreadChannelPresent = await clanPage.isNewThreadPresent(threadChannelName);
        expect(isThreadChannelPresent).toBe(false);
      }
    );

    await AllureReporter.step('Send message to a channel', async () => {
      await clanPage.openChannelByName('general');
      const message = 'Test message';
      await messageHelper.sendTextMessage(message);
    });

    await AllureReporter.step('Search for archived thread in modal forward', async () => {
      await messagePage.openForwardMessageModal();
      const isArchivedChannelPresentOnForwardModal =
        await messagePage.isChannelPresentOnForwardModal(threadChannelName);
      expect(isArchivedChannelPresentOnForwardModal).toBe(false);
      await messagePage.closeModalForwardMessage();
    });
  });
});
