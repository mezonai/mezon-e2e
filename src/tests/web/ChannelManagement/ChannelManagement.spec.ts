import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import TestSuiteHelper from '@/utils/testSuite.helper';
import test, { expect } from '@playwright/test';

test.describe('Channel Management', () => {
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

  test('Verify that I can create a new private text channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63916',
    });

    // Test metadata
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new private text channel within a clan.

      **Test Steps:**
      1. Generate unique channel name
      2. Create new private text channel
      3. Verify channel appears in channel list

      **Expected Result:** Private text channel is created and visible in the clan's channel list.
    `);

    await AllureReporter.addLabels({
      tag: [CHANNEL_CREATION_TAG, 'private-channel', TEXT_CHANNEL_TAG],
    });

    const ran = Math.floor(Math.random() * 999) + 1;
    const channelName = `text-channel-${ran}`;
    const clanPage = new ClanPage(page);

    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('channelType', ChannelType.TEXT);
    await AllureReporter.addParameter('channelStatus', ChannelStatus.PRIVATE);

    await AllureReporter.step(`Create new private text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PRIVATE);
    });

    await AllureReporter.step(VERIFY_CHANNEL_STEP, async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.attachScreenshot(page, `Private Text Channel Created - ${channelName}`);
  });

  test('Verify that I can create a new public text channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63917',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new public text channel within a clan.

      **Test Steps:**
      1. Generate unique channel name
      2. Create new public text channel
      3. Verify channel appears in channel list

      **Expected Result:** Public text channel is created and visible in the clan's channel list.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-creation', 'public-channel', 'text-channel'],
    });

    const ran = Math.floor(Math.random() * 999) + 1;
    const channelName = `text-channel-${ran}`;
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

    await AllureReporter.attachScreenshot(page, `Public Text Channel Created - ${channelName}`);
  });

  test('Verify that I can create a new voice channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63918',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new voice channel within a clan.
      
      **Test Steps:**
      1. Generate unique channel name
      2. Create new voice channel
      3. Verify channel appears in channel list
      
      **Expected Result:** Voice channel is created and visible in the clan's channel list.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-creation', 'voice-channel'],
    });

    const ran = Math.floor(Math.random() * 999) + 1;
    const channelName = `voice-channel-${ran}`;
    const clanPage = new ClanPage(page);

    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('channelType', ChannelType.VOICE);

    await AllureReporter.step(`Create new voice channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.VOICE, channelName);
    });

    await AllureReporter.step('Verify channel is present in channel list', async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.attachScreenshot(page, `Voice Channel Created - ${channelName}`);
  });

  test('Verify that I can create a new stream channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63919',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new stream channel within a clan.
      
      **Test Steps:**
      1. Generate unique channel name
      2. Create new stream channel
      3. Verify channel appears in channel list
      
      **Expected Result:** Stream channel is created and visible in the clan's channel list.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-creation', 'stream-channel'],
    });

    const ran = Math.floor(Math.random() * 999) + 1;
    const channelName = `text-channel-${ran}`;
    const clanPage = new ClanPage(page);

    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('channelType', ChannelType.STREAM);

    await AllureReporter.step(`Create new stream channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.STREAM, channelName);
    });

    await AllureReporter.step('Verify channel is present in channel list', async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.attachScreenshot(page, `Stream Channel Created - ${channelName}`);
  });

  test('Verify that I can edit name for channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63959',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully rename for channel within a clan.
      
      **Test Steps:**
      1. Create new channel
      2. Edit channel name
      3. Verify channel name is updated in channel list
      
      **Expected Result:** Channel display new name after edited.
    `);

    await AllureReporter.addLabels({
      tag: ['channel-creation', 'public-channel', 'text-channel', 'edit-channel'],
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
    await AllureReporter.addParameter('newChannelName', newChannelName);
    await AllureReporter.step(`Edit channel name to: ${newChannelName}`, async () => {
      await clanPage.editChannelName(channelName, newChannelName);
    });

    await page.waitForLoadState('domcontentloaded');

    await AllureReporter.step(
      'Verify channel is present in channel list with new name',
      async () => {
        const isEditedChannelPresent = await clanPage.isNewChannelPresent(newChannelName);
        expect(isEditedChannelPresent).toBe(true);
      }
    );
    await AllureReporter.attachScreenshot(page, `Channel Renamed - ${newChannelName}`);
  });
});