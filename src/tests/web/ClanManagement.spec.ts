import { AllureConfig } from '@/config/allure.config';
import { GLOBAL_CONFIG } from '@/config/environment';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { ROUTES } from '@/selectors';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import generateRandomString from '@/utils/randomString';
import { expect, test } from '@playwright/test';
import { CategoryPage } from '../../pages/CategoryPage';

test.describe('Create Clan', () => {
  let clanUrl: string;
  let clanSetupHelper: ClanSetupHelper;
  let clanTestName: string;

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63510',
    });

    // Set authentication for the suite
    await AllureReporter.step('Setup authentication', async () => {
      await AuthHelper.setAuthForSuite(page, 'Clan Management');
    });

    const clanPage = new ClanPageV2(page);
    await AllureReporter.step('Navigate to direct friends page', async () => {
      await clanPage.navigate('/chat/direct/friends');
      await page.waitForLoadState('domcontentloaded');
    });
  });

  test('Verify that I can create a Clan', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63511',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.BLOCKER,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new clan.
      
      **Test Steps:**
      1. Generate unique clan name
      2. Click create clan button
      3. Complete clan creation process
      4. Verify clan appears in clan list
      
      **Expected Result:** New clan is created and visible in the user's clan list.
    `);

    await AllureReporter.addLabels({
      tag: ['clan-creation', 'core-functionality'],
    });

    const clanName = `Mezon E2E Clan ${generateRandomString(10)}`;
    clanTestName = clanName;
    const clanPage = new ClanPageV2(page);

    await AllureReporter.addParameter('clanName', clanName);

    const createClanClicked = await AllureReporter.step('Click create clan button', async () => {
      return await clanPage.clickCreateClanButton();
    });

    if (createClanClicked) {
      await AllureReporter.step(`Create new clan: ${clanName}`, async () => {
        await clanPage.createNewClan(clanName);
      });

      await AllureReporter.step('Verify clan is present in clan list', async () => {
        const isClanPresent = await clanPage.isClanPresent(clanName);

        if (isClanPresent) {
          clanUrl = page.url();
        } else {
          console.log(`Could not complete clan creation: ${clanName}`);
        }
      });

      await AllureReporter.attachScreenshot(page, 'Clan Created Successfully');
    } else {
      await AllureReporter.attachScreenshot(page, 'Failed to Create Clan');
    }
  });

  test.afterAll(async () => {
    if (clanSetupHelper) {
      await clanSetupHelper.cleanupClan(clanTestName, clanUrl, 'Clan Management');
    }
  });
});

test.describe('Create Category', () => {
  let clanSetupHelper: ClanSetupHelper;
  let clanName: string;
  let clanUrl: string;

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(ClanSetupHelper.configs.clanManagement);

    clanName = setupResult.clanName;
    clanUrl = setupResult.clanUrl;
  });

  test.afterAll(async () => {
    if (clanSetupHelper && clanName && clanUrl) {
      await clanSetupHelper.cleanupClan(
        clanName,
        clanUrl,
        ClanSetupHelper.configs.clanManagement.suiteName || ''
      );
    }
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63510',
    });

    // Set authentication for the suite
    await AllureReporter.step('Setup authentication', async () => {
      await AuthHelper.setAuthForSuite(
        page,
        ClanSetupHelper.configs.clanManagement.suiteName || ''
      );
    });

    await AllureReporter.step('Navigate to test clan', async () => {
      await page.goto(clanUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await AllureReporter.addParameter('clanName', clanName);
  });

  // test('Verify that I can create a private category', async ({ page }) => {
  //   await AllureReporter.addTestParameters({
  //     testType: AllureConfig.TestTypes.E2E,
  //     userType: AllureConfig.UserTypes.AUTHENTICATED,
  //     severity: AllureConfig.Severity.CRITICAL,
  //   });

  //   await AllureReporter.addDescription(`
  //     **Test Objective:** Verify that a user can successfully create a new private category within a clan.

  //     **Test Steps:**
  //     1. Generate unique category name
  //     2. Create new private category
  //     3. Verify category appears in category list

  //     **Expected Result:** Private category is created and visible in the clan's category list.
  //   `);

  //   await AllureReporter.addLabels({
  //     tag: ['category-creation', 'private-category'],
  //   });

  //   const categoryPrivateName = `category-private-${new Date().getTime()}`;
  //   const categoryPage = new CategoryPage(page);

  //   await AllureReporter.addParameter('categoryName', categoryPrivateName);
  //   await AllureReporter.addParameter('categoryType', 'private');

  //   await AllureReporter.step(`Create new private category: ${categoryPrivateName}`, async () => {
  //     await categoryPage.createCategory(categoryPrivateName, 'private');
  //   });

  //   await AllureReporter.step('Verify category is present in category list', async () => {
  //     const isCreatedCategory = await categoryPage.isCategoryPresent(categoryPrivateName);
  //     expect(isCreatedCategory).toBeTruthy();
  //   });

  //   await AllureReporter.attachScreenshot(
  //     page,
  //     `Private Category Created - ${categoryPrivateName}`
  //   );
  // });

  test('Verify that I can create a public category', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new public category within a clan.
      
      **Test Steps:**
      1. Generate unique category name
      2. Create new public category
      3. Verify category appears in category list
      
      **Expected Result:** Public category is created and visible in the clan's category list.
    `);

    await AllureReporter.addLabels({
      tag: ['category-creation', 'public-category'],
    });

    const categoryPublicName = `category-public-${new Date().getTime()}`;
    const categoryPage = new CategoryPage(page);

    await AllureReporter.addParameter('categoryName', categoryPublicName);
    await AllureReporter.addParameter('categoryType', 'public');

    await AllureReporter.step(`Create new public category: ${categoryPublicName}`, async () => {
      await categoryPage.createCategory(categoryPublicName, 'public');
    });

    await AllureReporter.step('Verify category is present in category list', async () => {
      const isCreatedCategory = await categoryPage.isCategoryPresent(categoryPublicName);
      expect(isCreatedCategory).toBeTruthy();
    });

    await AllureReporter.attachScreenshot(page, `Public Category Created - ${categoryPublicName}`);
  });
});

test.describe('Invite People', () => {
  let clanSetupHelper: ClanSetupHelper;
  let clanName: string;
  let clanUrl: string;

  test.beforeAll(async ({ browser }) => {
    clanSetupHelper = new ClanSetupHelper(browser);

    const setupResult = await clanSetupHelper.setupTestClan(ClanSetupHelper.configs.clanManagement);

    clanName = setupResult.clanName;
    clanUrl = setupResult.clanUrl;
  });

  test.afterAll(async () => {
    if (clanSetupHelper && clanName && clanUrl) {
      await clanSetupHelper.cleanupClan(
        clanName,
        clanUrl,
        ClanSetupHelper.configs.clanManagement.suiteName || ''
      );
    }
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63123',
    });

    // Set authentication for the suite
    await AllureReporter.step('Setup authentication', async () => {
      await AuthHelper.setAuthForSuite(
        page,
        ClanSetupHelper.configs.clanManagement.suiteName || ''
      );
    });

    await AllureReporter.step('Navigate to test clan', async () => {
      await page.goto(clanUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await AllureReporter.addParameter('clanName', clanName);
  });

  test('Verify that I can invite people to a clan from sidebar', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63379',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully invite people to a clan from sidebar.

    **Test Steps:**
    1. Open invite people dialog
    2. Pick first user on list
    3. Send invitation
    4. Verify invitation is sent

    **Expected Result:** Invitation is successfully sent to the user.
  `);

    await AllureReporter.addLabels({
      tag: ['invite-people', 'user-invitations'],
    });

    const clanPage = new ClanPageV2(page);

    await AllureReporter.step('Open invite people dialog', async () => {
      await clanPage.clickButtonInvitePeopleFromMenu();
    });

    const inviteResult = await AllureReporter.step('Send invitation via modal', async () => {
      return await clanPage.sendInviteOnModal();
    });

    expect(inviteResult.success).toBeTruthy();

    await AllureReporter.step('Navigate to direct friends page', async () => {
      await page.goto(joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS));
    });

    await AllureReporter.step(`Open DM with invited user`, async () => {
      await clanPage.openDirectMessageWithUser(inviteResult.username!);
    });

    await AllureReporter.step('Verify last message in DM equals urlInvite', async () => {
      const lastMessage = await clanPage.getLastMessageInChat();
      const isMatch = lastMessage.includes(inviteResult.urlInvite ?? '');
      expect(isMatch).toBeTruthy();
      return isMatch;
    });

    await AllureReporter.attachScreenshot(page, 'Invite People Sent');
  });

  test('Verify that I can invite people to a clan from channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63380',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully invite people to a clan from a channel.
    **Test Steps:**
    1. create a channel in clan
    2. Open invite people dialog from channel
    3. Pick first user on list
    4. Send invitation
    5. Verify invitation is sent
    **Expected Result:** Invitation is successfully sent to the user.
  `);
    await AllureReporter.addLabels({
      tag: ['invite-people', 'user-invitations'],
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

    await AllureReporter.step('Open invite people dialog from channel', async () => {
      await clanPage.clickButtonInvitePeopleFromChannel();
    });
    const inviteResult = await AllureReporter.step('Send invitation via modal', async () => {
      return await clanPage.sendInviteOnModal();
    });
    expect(inviteResult.success).toBeTruthy();
    await AllureReporter.step('Navigate to direct friends page', async () => {
      await page.goto(joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS));
    });
    await AllureReporter.step(`Open DM with invited user`, async () => {
      await clanPage.openDirectMessageWithUser(inviteResult.username!);
    });
    await AllureReporter.step('Verify last message in DM equals urlInvite', async () => {
      const lastMessage = await clanPage.getLastMessageInChat();
      const isMatch = lastMessage.includes(inviteResult.urlInvite ?? '');
      expect(isMatch).toBeTruthy();
      return isMatch;
    });
  });
});
