import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MezonCredentials } from '@/types';
import { ChannelType, ThreadStatus } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { ThreadTestHelpers } from '@/utils/threadHelpers';
import { test } from '@playwright/test';

test.describe('Thread Management - Module 2', () => {
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

  test('Verify that user can create a canvas in a thread', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '65998',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a canvas in a thread.
      
      **Test Steps:**
      1. Create a new thread
      2. Create a canvas while in the newly created thread
      3. Verify canvas is created successfully
      
      **Expected Result:** Canvas is created and visible in the thread.
    `);

    await AllureReporter.addLabels({
      tag: ['canvas', 'thread', 'creation'],
    });

    const threadName = `thread-canvas-${generateRandomString(10)}`;

    await AllureReporter.step('Create a new thread', async () => {
      const threadTestHelpers = new ThreadTestHelpers(page);
      await threadTestHelpers.createAndVerifyThread(ThreadStatus.PUBLIC, threadName);
    });

    const canvasTitle = `canvas title - ${generateRandomString(10)}`;
    const canvasContent = `canvas content - ${generateRandomString(10)}`;
    const clanPage = new ClanPage(page);

    await AllureReporter.step('Create a canvas while in the newly created thread', async () => {
      await clanPage.openCanvasManagementModal();
      await clanPage.createCanvas();
      await clanPage.fillCanvasTitle(canvasTitle);
      await clanPage.fillCanvasContent(canvasContent);
      await clanPage.saveCanvas();
    });

    await AllureReporter.step('Verify canvas is created successfully', async () => {
      await clanPage.assertCanvasContent(canvasTitle, canvasContent, true);
    });
  });
});
