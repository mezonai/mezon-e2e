import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { ChannelType, ThreadStatus } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import joinUrlPaths from '@/utils/joinUrlPaths';
import generateRandomString from '@/utils/randomString';
import { ThreadTestHelpers } from '@/utils/threadHelpers';
import test from '@playwright/test';

// test.describe('Thread in Private Channel', () => {
//   const clanFactory = new ClanFactory();

//   test.beforeAll(async ({ browser }) => {
//     const context = await browser.newContext();
//     const page = await context.newPage();

//     await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account7);
//     await clanFactory.setupClan(ClanSetupHelper.configs.threadManagement, page);

//     clanFactory.setClanUrl(
//       joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, splitDomainAndPath(clanFactory.getClanUrl()).path)
//     );
//     await context.close();
//   });

//   test.beforeEach(async ({ page }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63519',
//     });

//     const credentials = await AuthHelper.setupAuthWithEmailPassword(
//       page,
//       AccountCredentials.account7
//     );
//     await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);

//     await AllureReporter.step('Create private channel for thread testing', async () => {
//       const clanPage = new ClanPageV2(page);
//       const privateChannelName = `private-channel-${generateRandomString(5)}`;
//       await clanPage.createNewChannel(ChannelType.TEXT, privateChannelName, ChannelStatus.PRIVATE);
//     });
//   });

//   test.afterAll(async ({ browser }) => {
//     const context = await browser.newContext();
//     const page = await context.newPage();
//     const credentials = await AuthHelper.setupAuthWithEmailPassword(
//       page,
//       AccountCredentials.account7
//     );
//     await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
//     await clanFactory.cleanupClan(page);
//     // await AuthHelper.logout(page);
//     await context.close();
//   });

//   // test.afterEach(async ({ page }) => {
//   //   await AuthHelper.logout(page);
//   // });

//   // test('Verify that I can create a new public thread in a private channel', async ({ page }) => {
//   //   await AllureReporter.addWorkItemLinks({
//   //     tms: '63580',
//   //     github_issue: '9421',
//   //   });

//   //   await AllureReporter.addTestParameters({
//   //     testType: AllureConfig.TestTypes.E2E,
//   //     userType: AllureConfig.UserTypes.AUTHENTICATED,
//   //     severity: AllureConfig.Severity.CRITICAL,
//   //   });

//   //   await AllureReporter.addDescription(`
//   //     **Test Objective:** Verify that a user can successfully create a new public thread in a private channel within a clan.

//   //     **Test Steps:**
//   //     1. Generate unique thread name
//   //     2. Create new public thread in a private channel
//   //     3. Verify thread appears in thread list

//   //     **Expected Result:** Public thread is created and visible in the clan's thread list.
//   //   `);

//   //   await AllureReporter.addLabels({
//   //     tag: ['thread-creation', 'public-thread', 'private-channel'],
//   //   });

//   //   const threadTestHelpers = new ThreadTestHelpers(page);
//   //   await threadTestHelpers.createAndVerifyThread(ThreadStatus.PUBLIC);
//   // });

//   // test('Verify that I can create a new private thread in a private channel', async ({ page }) => {
//   //   await AllureReporter.addWorkItemLinks({
//   //     tms: '63581',
//   //   });

//   //   await AllureReporter.addTestParameters({
//   //     testType: AllureConfig.TestTypes.E2E,
//   //     userType: AllureConfig.UserTypes.AUTHENTICATED,
//   //     severity: AllureConfig.Severity.CRITICAL,
//   //   });

//   //   await AllureReporter.addDescription(`
//   //     **Test Objective:** Verify that a user can successfully create a new private thread in a private channel within a clan.

//   //     **Test Steps:**
//   //     1. Generate unique thread name
//   //     2. Create new private thread in a private channel
//   //     3. Verify thread appears in thread list

//   //     **Expected Result:** Private thread is created and visible in the clan's thread list.
//   //   `);

//   //   await AllureReporter.addLabels({
//   //     tag: ['thread-creation', 'private-thread', 'private-channel'],
//   //   });

//   //   const threadTestHelpers = new ThreadTestHelpers(page);
//   //   await threadTestHelpers.createAndVerifyThread(ThreadStatus.PRIVATE);
//   // });
// });

test.describe('Thread in Public Channel', () => {
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account7);
    await clanFactory.setupClan(ClanSetupHelper.configs.threadManagement, page);

    clanFactory.setClanUrl(
      joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, splitDomainAndPath(clanFactory.getClanUrl()).path)
    );
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63519',
    });

    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account7
    );
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);

    await AllureReporter.step('Create public channel for thread testing', async () => {
      const clanPage = new ClanPageV2(page);
      const publicChannelName = `public-channel-${generateRandomString(5)}`;
      await clanPage.createNewChannel(ChannelType.TEXT, publicChannelName);
    });
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account7
    );
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await clanFactory.cleanupClan(page);
    // await AuthHelper.logout(page);
    await context.close();
  });

  // test.afterEach(async ({ page }) => {
  //   await AuthHelper.logout(page);
  // });

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
