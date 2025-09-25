import { AllureConfig } from '@/config/allure.config';
import { ChannelSettingPage } from '@/pages/ChannelSettingPage';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import generateRandomString from '@/utils/randomString';
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

    const clanPage = new ClanPageV2(page);
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

    const clanPage = new ClanPageV2(page);
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
});
