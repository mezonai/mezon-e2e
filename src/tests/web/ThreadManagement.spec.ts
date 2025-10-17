import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MezonCredentials } from '@/types';
import { ChannelStatus, ChannelType, ThreadStatus } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { ThreadTestHelpers } from '@/utils/threadHelpers';
import test from '@playwright/test';

test.describe('Thread in Private Channel', () => {
  const clanFactory = new ClanFactory();
  const credentials: MezonCredentials = AccountCredentials.account7;
  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.threadManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63519',
    });

    const _credentials = await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), _credentials);

    await AllureReporter.step('Create private channel for thread testing', async () => {
      const clanPage = new ClanPage(page);
      const privateChannelName = `private-channel-${generateRandomString(5)}`;
      await clanPage.createNewChannel(ChannelType.TEXT, privateChannelName, ChannelStatus.PRIVATE);
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

    const threadTestHelpers = new ThreadTestHelpers(page);
    await threadTestHelpers.createAndVerifyThread(ThreadStatus.PUBLIC);
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

    const threadTestHelpers = new ThreadTestHelpers(page);
    await threadTestHelpers.createAndVerifyThread(ThreadStatus.PRIVATE);
  });
});

test.describe('Thread in Public Channel', () => {
  const clanFactory = new ClanFactory();
  const credentials: MezonCredentials = AccountCredentials.account7;
  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.threadManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63519',
    });

    const _credentials = await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), _credentials);

    await AllureReporter.step('Create public channel for thread testing', async () => {
      const clanPage = new ClanPage(page);
      const publicChannelName = `public-channel-${generateRandomString(5)}`;
      await clanPage.createNewChannel(ChannelType.TEXT, publicChannelName);
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

    const threadTestHelpers = new ThreadTestHelpers(page);
    await threadTestHelpers.createAndVerifyThread(ThreadStatus.PUBLIC);
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

    const threadTestHelpers = new ThreadTestHelpers(page);
    await threadTestHelpers.createAndVerifyThread(ThreadStatus.PRIVATE);
  });
});
