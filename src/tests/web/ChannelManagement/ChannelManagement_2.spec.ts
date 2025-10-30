import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { expect } from '@playwright/test';

test.describe('Channel Management - Module 2', () => {
  const CHANNEL_CREATION_TAG = 'channel-creation';
  const TEXT_CHANNEL_TAG = 'text-channel';
  const VERIFY_CHANNEL_STEP = 'Verify channel is present in channel list';

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

  test('Verify that channel name overview reflect correct when user enter characters or click reset', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63377',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that channel name overview reflect correct when user enter characters or click reset.
      
      **Test Steps:**
      1. Create new channel
      2. Open modal edit channel
      3. Edit channel name and reset it
      
      **Expected Result:** channel name overview reflect correct when user enter characters or click reset.
    `);

    await AllureReporter.addLabels({
      tag: [
        'channel-creation',
        'public-channel',
        'text-channel',
        'edit-channel-name',
        'reset-edit',
      ],
    });

    const unique = Date.now().toString(36).slice(-6);
    const channelName = `tc-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);

    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('channelType', ChannelType.TEXT);
    await AllureReporter.addParameter('channelStatus', ChannelStatus.PUBLIC);

    await AllureReporter.step(`Create new public text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC);
    });

    await AllureReporter.step('Verify channel is present in channel list', async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    const newChannelName = `${channelName}-ed`.slice(0, 20);

    await AllureReporter.step(`Open modal edit channel name: ${channelName}`, async () => {
      await clanPage.openChannelSettings(channelName);
    });

    await AllureReporter.step(
      `Verify channel name overview reflect correct: ${newChannelName}`,
      async () => {
        await clanPage.verifyChannelNameOverviewWhenEditingChannelName(channelName, newChannelName);
      }
    );

    await AllureReporter.attachScreenshot(
      page,
      `Channel name overview reflect correct when user enter characters or click reset`
    );
  });

  test('Verify that i can change public to private channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63377',
      github_issue: '9641',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully change public channel to private channel.
    
    **Test Steps:**
    1. Create new public channel
    2. Change channel status to private
    3. Verify channel status is private
    
    **Expected Result:** Channel status is changed to private.
  `);

    await AllureReporter.addLabels({
      tag: ['channel-status', 'private-channel'],
    });

    const clanPage = new ClanPage(page);
    const channelSettingPage = new ChannelSettingPage(page);
    const channelName = `channel-${generateRandomString(10)}`;

    await AllureReporter.step('Create new public channel', async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC);

      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });
    await AllureReporter.step('Change channel status to private', async () => {
      await clanPage.openChannelSettings(channelName);
      const isChannelStatusChanged = await channelSettingPage.changeChannelStatus();
      expect(isChannelStatusChanged).toBe(true);
    });

    await AllureReporter.step('Verify channel status is private', async () => {
      const isPrivateChannel = await channelSettingPage.verifyChannelStatusIsPrivate(channelName);
      expect(isPrivateChannel).toBe(true);
    });
  });

  test('Verify that i can change private to public channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63377',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully change private channel to public channel.
      
      **Test Steps:**
      1. Create new private channel
      2. Change channel status to public
      3. Verify channel status is public
      
      **Expected Result:** Channel status is changed to public.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-status', 'public-channel'],
    });

    const clanPage = new ClanPage(page);
    const channelSettingPage = new ChannelSettingPage(page);
    const channelName = `channel-${generateRandomString(10)}`;

    await AllureReporter.step('Create new private channel', async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PRIVATE);
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('Change channel status to public', async () => {
      await clanPage.openChannelSettings(channelName);
      const isChannelStatusChanged = await channelSettingPage.changeChannelStatus();
      expect(isChannelStatusChanged).toBe(true);
    });

    await AllureReporter.step('Verify channel status is public', async () => {
      const isPublicChannel = await channelSettingPage.verifyChannelStatusIsPublic(channelName);
      expect(isPublicChannel).toBe(true);
    });
  });

  test('Verify that I can join and leave a voice channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63996',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully join and leave a voice channel within a clan.
      
      **Test Steps:**
      1. Create new voice channel
      2. Join voice channel
      3. Verify user is in voice channel
      4. Leave voice channel
      5. Verify user is not in voice channel
      
      **Expected Result:** User can successfully join and leave a voice channel.
    `);

    await AllureReporter.addLabels({
      tag: ['voice-channel', 'join-channel', 'leave-channel'],
    });

    const ran = Math.floor(Math.random() * 999) + 1;
    const channelName = `voice-channel-${ran}`;
    const clanPage = new ClanPage(page);

    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('channelType', ChannelType.VOICE);

    await AllureReporter.step(`Create new voice channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.VOICE, channelName);
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('Join voice channel', async () => {
      await clanPage.joinVoiceChannel(channelName);
      const isUserInVoiceChannel = await clanPage.isJoinVoiceChannel(channelName);
      expect(isUserInVoiceChannel).toBe(true);
    });

    await AllureReporter.step('Leave voice channel', async () => {
      await clanPage.leaveVoiceChannel(channelName);
      const isLeaveVoiceChannel = await clanPage.isLeaveVoiceChannel(channelName);
      expect(isLeaveVoiceChannel).toBe(true);
      await page.reload();
      const isLeaveVoiceChannelAfterReload = await clanPage.isLeaveVoiceChannel(channelName);
      expect(isLeaveVoiceChannelAfterReload).toBe(true);
    });

    await AllureReporter.attachScreenshot(page, `Voice Channel Created - ${channelName}`);
  });
});
