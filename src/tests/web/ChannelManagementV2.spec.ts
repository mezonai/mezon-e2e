import { AllureConfig } from '@/config/allure.config';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import test, { expect } from '@playwright/test';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { ClanDataFactory } from '@/data/factories/ClanDataFactory';
import { GLOBAL_CONFIG, WEBSITE_CONFIGS } from '@/config/environment';
import { ROUTES } from '@/selectors';
import joinUrlPaths from '@/utils/joinUrlPaths';

test.describe('Create New Channels', () => {
  const testClanData = new ClanDataFactory();

  test.beforeAll(async ({ browser }) => {
    new ClanSetupHelper(browser);
    const { suiteName = 'Channel Management' } = ClanSetupHelper.configs.channelManagement;
    const context = await browser.newContext();
    const page = await context.newPage();

    await AuthHelper.setAuthForSuite(page, suiteName);

    await page.goto(WEBSITE_CONFIGS.MEZON.baseURL || '');
    const clanPage = new ClanPageV2(page);
    await page.goto(joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS));

    await testClanData.setupTestClan(clanPage, suiteName);

    await context.close();
    console.log(`✅ Test clan setup complete: ${testClanData.getClanName()}`);
  });

  test.afterAll(async ({ browser }) => {
    const { suiteName = 'Channel Management' } = ClanSetupHelper.configs.channelManagement;
    const context = await browser.newContext();
    const page = await context.newPage();

    await AuthHelper.setAuthForSuite(page, suiteName);

    await page.goto(testClanData.getClanUrl());
    const clanPage = new ClanPageV2(page);

    await testClanData.cleanupTestClan(clanPage);

    await context.close();
  });

  test.beforeEach(async ({ page }, testInfo) => {
    await AuthHelper.setAuthForSuite(page, 'Channel Management');

    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63366',
    });

    await AllureReporter.step('Navigate to test clan', async () => {
      await page.goto(testClanData.getClanUrl());
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
    });

    await AllureReporter.addParameter('clanName', testClanData.getClanName());
  });

  test('Verify that I can create a new private text channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63374',
    });

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
      tms: '63374',
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
      tms: '63374',
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
      tms: '63374',
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
});
