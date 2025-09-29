import { AllureConfig } from '@/config/allure.config';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import test, { expect } from '@playwright/test';

test.describe('Channel Management', () => {
  let clanSetupHelper: ClanSetupHelper;
  let clanName: string;
  let clanUrl: string;

  test.use({ storageState: 'playwright/.auth/account1.json' });

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(
      ClanSetupHelper.configs.channelManagement
    );

    clanName = setupResult.clanName;
    clanUrl = setupResult.clanUrl;
  });

  test.afterAll(async () => {
    if (clanSetupHelper && clanName && clanUrl) {
      await clanSetupHelper.cleanupClan(clanName, clanUrl);
    }
  });

  test.beforeEach(async ({ page }, testInfo) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63366',
    });

    // Navigate to the test clan
    await AllureReporter.step('Navigate to test clan', async () => {
      await page.goto(clanUrl, { waitUntil: 'domcontentloaded' });
    });

    await AllureReporter.addParameter('clanName', clanName);
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
      tag: ['channel-creation', 'private-channel', 'text-channel'],
    });

    const ran = Math.floor(Math.random() * 999) + 1;
    const channelName = `text-channel-${ran}`;
    const clanPage = new ClanPageV2(page);

    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('channelType', ChannelType.TEXT);
    await AllureReporter.addParameter('channelStatus', ChannelStatus.PRIVATE);

    await AllureReporter.step(`Create new private text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PRIVATE);
    });

    await AllureReporter.step('Verify channel is present in channel list', async () => {
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
    const clanPage = new ClanPageV2(page);

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
    const clanPage = new ClanPageV2(page);

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
    const clanPage = new ClanPageV2(page);

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
    const clanPage = new ClanPageV2(page);

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

test.describe('Voice Channel', () => {
  let clanSetupHelper: ClanSetupHelper;
  let clanName: string;
  let clanUrl: string;

  test.use({ storageState: 'playwright/.auth/account1.json' });

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(
      ClanSetupHelper.configs.channelManagement
    );

    clanName = setupResult.clanName;
    clanUrl = setupResult.clanUrl;
  });

  test.afterAll(async () => {
    if (clanSetupHelper && clanName && clanUrl) {
      await clanSetupHelper.cleanupClan(clanName, clanUrl);
    }
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63366',
    });

    // Navigate to the test clan
    await AllureReporter.step('Navigate to test clan', async () => {
      await page.goto(clanUrl, { waitUntil: 'domcontentloaded' });
    });

    await AllureReporter.addParameter('clanName', clanName);
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
    const clanPage = new ClanPageV2(page);

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
      const isLeaveVoiceChannelAfterReload  = await clanPage.isLeaveVoiceChannel(channelName);
      expect(isLeaveVoiceChannelAfterReload).toBe(true); 
    });

    await AllureReporter.attachScreenshot(page, `Voice Channel Created - ${channelName}`);
  });
});
