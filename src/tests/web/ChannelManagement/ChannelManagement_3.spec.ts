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
import { OnboardingHelpers } from '@/utils/onboardingHelpers';
import pressEsc from '@/utils/pressEsc';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { expect } from '@playwright/test';

test.describe('Channel Management - Deletion, Permissions, and Archiving', () => {
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
  test('Verify that permission settings not visible on stream channel and voice channel', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64610',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that permission settings are not visible on stream channel and voice channel.  
      Steps:
      1. Create a stream channel
      2. Verify that permission settings not visible on stream channel
      3. Create a voice channel
      4. Verify that permission settings not visible on voice channel
      **Expected Result:** Permission settings are not visible on stream channel and voice channel.
    `);
    await AllureReporter.addLabels({
      tag: ['stream-channel', 'voice-channel', 'permission-settings'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const streamChannelName = `sc-${unique}`.slice(0, 20);
    const voiceChannelName = `vc-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
    await AllureReporter.addParameter('streamChannelName', streamChannelName);
    await AllureReporter.addParameter('voiceChannelName', voiceChannelName);
    await AllureReporter.step(`Create new stream channel: ${streamChannelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.STREAM, streamChannelName);
      const isStreamChannelPresent = await clanPage.isNewChannelPresent(streamChannelName);
      expect(isStreamChannelPresent).toBe(true);
    });
    await AllureReporter.step(
      'Verify that permission settings not visible on stream channel',
      async () => {
        await clanPage.openChannelSettings(streamChannelName);
        const isPermissionSettingsVisible = await channelSettings.isPermissionSettingsVisible();
        expect(isPermissionSettingsVisible).toBe(false);
        await clanPage.closeSettingsChannel();
      }
    );
    await AllureReporter.step(`Create new voice channel: ${voiceChannelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.VOICE, voiceChannelName);
      const isVoiceChannelPresent = await clanPage.isNewChannelPresent(voiceChannelName);
      expect(isVoiceChannelPresent).toBe(true);
    });
    await AllureReporter.step(
      'Verify that permission settings not visible on voice channel',
      async () => {
        await clanPage.openChannelSettings(voiceChannelName);
        const isPermissionSettingsVisible = await channelSettings.isPermissionSettingsVisible();
        expect(isPermissionSettingsVisible).toBe(false);
        await clanPage.closeSettingsChannel();
      }
    );
  });
  test('Verify that user can archive a channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64611',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can archive a channel.  
      Steps:
      1. Create a text channel
      2. Archive channel
      3. Verify that archived channel is not in channel list
      4. Verify that archived channel is in archived channel list
      **Expected Result:** User can archive a channel and archived channel is moved to archived channel list.
    `);
    await AllureReporter.addLabels({
      tag: ['archive-channel', 'text-channel'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const channelName = `tc-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
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
  });
  test('Verify that user can restore an archived channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64611',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can restore an archived channel.  
      Steps:
      1. Create a text channel
      2. Archive channel
      3. Verify that archived channel is not in channel list
      4. Verify that archived channel is in archived channel list
      5. Restore archived channel
      6. Verify that restored channel is in channel list
      7. Verify that restored channel is not in archived channel list
      **Expected Result:** User can restore an archived channel and it is moved back to the regular channel list.
    `);
    await AllureReporter.addLabels({
      tag: ['archive-channel', 'text-channel'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const channelName = `tc-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
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
      }
    );
    await AllureReporter.step('Restore archived channel', async () => {
      await channelSettings.restoreArchivedChannel(channelName);
      await clanPage.closeSettingsClan();
    });

    await AllureReporter.step('Verify that restored channel is in channel list', async () => {
      await page.reload();
      const isChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isChannelPresent).toBe(true);
    });

    await AllureReporter.step(
      'Verify that restored channel is not in archived channel list',
      async () => {
        const isChannelInArchivedList = await channelSettings.isChannelInArchivedList(channelName);
        expect(isChannelInArchivedList).toBe(false);
        await clanPage.closeSettingsClan();
      }
    );
  });
  test('Verify that user can archive a thread channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64612',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can archive a thread channel.  
      Steps:
      1. Create a channel
      2. Create a thread from channel
      3. Archive thread channel
      4. Verify that archived thread channel is not in thread list

      **Expected Result:** User can archive a thread channel and archived thread channel is moved to archived channel list.
    `);
    await AllureReporter.addLabels({
      tag: ['archive-thread-channel', 'thread-channel'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const channelName = `tc-${unique}`.slice(0, 20);
    const threadChannelName = `thread-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);
    const channelSettings = new ChannelSettingPage(page);
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
  });
});
