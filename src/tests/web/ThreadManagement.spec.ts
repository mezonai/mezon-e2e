import { AllureConfig } from '@/config/allure.config';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import test, { expect } from '@playwright/test';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import generateRandomString from '@/utils/randomString';

test.describe('Thread in Private Channel', () => {
  let clanSetupHelper: ClanSetupHelper;
  let clanName: string;
  let clanUrl: string;

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(
      ClanSetupHelper.configs.threadManagement
    );

    clanName = setupResult.clanName;
    clanUrl = setupResult.clanUrl;
  });

  test.afterAll(async ({ browser }) => {
    if (clanSetupHelper && clanName && clanUrl) {
      await clanSetupHelper.cleanupClan(
        clanName,
        clanUrl,
        ClanSetupHelper.configs.threadManagement.suiteName
      );
    }
  });

  test.beforeEach(async ({ page }) => {
    await AuthHelper.setAuthForSuite(
      page,
      ClanSetupHelper.configs.threadManagement.suiteName || 'Thread Management'
    );

    await AllureReporter.addWorkItemLinks({
      tms: '63519',
    });

    await AllureReporter.step('Navigate to test thread', async () => {
      await page.goto(clanUrl);
      const clanPage = new ClanPageV2(page);
      const privateChannelName = `private-channel-${generateRandomString(5)}`;
      await clanPage.createNewChannel(ChannelType.TEXT, privateChannelName, ChannelStatus.PRIVATE);
      const channelUrl = page.url();
      await page.goto(channelUrl);
    });

    await AllureReporter.addParameter('clanName', clanName);
  });

  test('Verify that I can create a new public thread in a private channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63580',
      github_issue: '9421',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new public thread in a private channel within a clan.
      
      **Test Steps:**
      1. Generate unique thread name
      2. Create new public thread in a private channel
      3. Verify thread appears in thread list
      
      **Expected Result:** Public thread is created and visible in the clan's thread list.
    `);

    await AllureReporter.addLabels({
      tag: ['thread-creation', 'public-thread', 'private-channel'],
    });

    const threadName = `public-thread-${generateRandomString(5)}`;
    const clanPage = new ClanPageV2(page);

    await AllureReporter.addParameter('threadName', threadName);
    await AllureReporter.addParameter('threadStatus', ChannelStatus.PUBLIC);

    await AllureReporter.step(`Create new public thread: ${threadName}`, async () => {
      await clanPage.createThread(threadName);
    });

    await AllureReporter.step('Verify thread is present in thread list', async () => {
      const isNewThreadPresent = await clanPage.isNewThreadPresent(threadName);
      expect(isNewThreadPresent).toBe(true);
    });

    await AllureReporter.attachScreenshot(page, `Public Thread Created - ${threadName}`);
  });

  test('Verify that I can create a new private thread in a private channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63581',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new private thread in a private channel within a clan.
      
      **Test Steps:**
      1. Generate unique thread name
      2. Create new private thread in a private channel
      3. Verify thread appears in thread list
      
      **Expected Result:** Private thread is created and visible in the clan's thread list.
    `);

    await AllureReporter.addLabels({
      tag: ['thread-creation', 'private-thread', 'private-channel'],
    });

    const threadName = `private-thread-${generateRandomString(5)}`;
    const clanPage = new ClanPageV2(page);

    await AllureReporter.addParameter('threadName', threadName);
    await AllureReporter.addParameter('threadStatus', ChannelStatus.PRIVATE);

    await AllureReporter.step(`Create new private thread: ${threadName}`, async () => {
      await clanPage.createThread(threadName, ChannelStatus.PRIVATE);
    });

    await AllureReporter.step('Verify thread is present in thread list', async () => {
      const isNewThreadPresent = await clanPage.isNewThreadPresent(threadName);
      expect(isNewThreadPresent).toBe(true);
    });

    await AllureReporter.attachScreenshot(page, `Private Thread Created - ${threadName}`);
  });
});

test.describe('Thread in Public Channel', () => {
  let clanSetupHelper: ClanSetupHelper;
  let clanName: string;
  let clanUrl: string;

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(
      ClanSetupHelper.configs.threadManagement
    );

    clanName = setupResult.clanName;
    clanUrl = setupResult.clanUrl;
  });

  test.afterAll(async ({ browser }) => {
    if (clanSetupHelper && clanName && clanUrl) {
      await clanSetupHelper.cleanupClan(
        clanName,
        clanUrl,
        ClanSetupHelper.configs.threadManagement.suiteName
      );
    }
  });

  test.beforeEach(async ({ page }) => {
    await AuthHelper.setAuthForSuite(
      page,
      ClanSetupHelper.configs.threadManagement.suiteName || 'Thread Management'
    );

    await AllureReporter.addWorkItemLinks({
      tms: '63519',
    });

    await AllureReporter.step('Navigate to test thread', async () => {
      await page.goto(clanUrl);
      const clanPage = new ClanPageV2(page);
      const publicChannelName = `public-channel-${generateRandomString(5)}`;
      await clanPage.createNewChannel(ChannelType.TEXT, publicChannelName);
      const channelUrl = page.url();
      await page.goto(channelUrl);
    });

    await AllureReporter.addParameter('clanName', clanName);
  });

  test('Verify that I can create a new public thread in a public channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63580',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new public thread in a public channel within a clan.
      
      **Test Steps:**
      1. Generate unique thread name
      2. Create new public thread in a public channel
      3. Verify thread appears in thread list
      
      **Expected Result:** Public thread is created and visible in the clan's thread list.
    `);

    await AllureReporter.addLabels({
      tag: ['thread-creation', 'public-thread', 'public-channel'],
    });

    const threadName = `public-thread-${generateRandomString(5)}`;
    const clanPage = new ClanPageV2(page);

    await AllureReporter.addParameter('threadName', threadName);
    await AllureReporter.addParameter('threadStatus', ChannelStatus.PUBLIC);

    await AllureReporter.step(`Create new public thread: ${threadName}`, async () => {
      await clanPage.createThread(threadName);
    });

    await AllureReporter.step('Verify thread is present in thread list', async () => {
      const isNewThreadPresent = await clanPage.isNewThreadPresent(threadName);
      expect(isNewThreadPresent).toBe(true);
    });

    await AllureReporter.attachScreenshot(page, `Public Thread Created - ${threadName}`);
  });

  test('Verify that I can create a new private thread in a public channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63581',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new private thread in a public channel within a clan.
      
      **Test Steps:**
      1. Generate unique thread name
      2. Create new private thread in a public channel
      3. Verify thread appears in thread list
      
      **Expected Result:** Private thread is created and visible in the clan's thread list.
    `);

    await AllureReporter.addLabels({
      tag: ['thread-creation', 'private-thread', 'public-channel'],
    });

    const threadName = `private-thread-${generateRandomString(5)}`;
    const clanPage = new ClanPageV2(page);

    await AllureReporter.addParameter('threadName', threadName);
    await AllureReporter.addParameter('threadStatus', ChannelStatus.PRIVATE);

    await AllureReporter.step(`Create new private thread: ${threadName}`, async () => {
      await clanPage.createThread(threadName, ChannelStatus.PRIVATE);
    });

    await AllureReporter.step('Verify thread is present in thread list', async () => {
      const isNewThreadPresent = await clanPage.isNewThreadPresent(threadName);
      expect(isNewThreadPresent).toBe(true);
    });

    await AllureReporter.attachScreenshot(page, `Private Thread Created - ${threadName}`);
  });
});
