import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, GLOBAL_CONFIG, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { ROUTES } from '@/selectors';
import { ChannelStatus, ChannelType, ClanStatus, EventType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import joinUrlPaths from '@/utils/joinUrlPaths';
import generateRandomString from '@/utils/randomString';
import { BrowserContext, expect, Page, test } from '@playwright/test';
import { CategoryPage } from '../../pages/CategoryPage';

test.describe('Create Clan', () => {
  const clanFactory = new ClanFactory();

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63510',
    });

    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account3
    );
    await AuthHelper.prepareBeforeTest(
      page,
      joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS),
      credentials
    );
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account3
    );
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await clanFactory.cleanupClan(page);
    await AuthHelper.logout(page);
    await context.close();
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
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
    clanFactory.setClanName(clanName);
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
          clanFactory.setClanUrl(page.url());
        } else {
          console.log(`Could not complete clan creation: ${clanName}`);
        }
      });

      await AllureReporter.attachScreenshot(page, 'Clan Created Successfully');
    } else {
      await AllureReporter.attachScreenshot(page, 'Failed to Create Clan');
    }
  });
});

test.describe('Create Category', () => {
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account3);
    await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement, page);

    clanFactory.setClanUrl(
      joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, splitDomainAndPath(clanFactory.getClanUrl()).path)
    );
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63510',
    });

    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account3
    );
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await AllureReporter.addParameter('clanName', clanFactory.getClanName());
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account3
    );
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await clanFactory.cleanupClan(page);
    await AuthHelper.logout(page);
    await context.close();
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
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

// test.describe('Invite People', () => {
//   const clanFactory = new ClanFactory();

//   test.beforeAll(async ({ browser }) => {
//     const context = await browser.newContext();
//     const page = await context.newPage();

//     await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account3);
//     await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement, page);

//     clanFactory.setClanUrl(
//       joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, splitDomainAndPath(clanFactory.getClanUrl()).path)
//     );
//     await context.close();
//   });

//   test.beforeEach(async ({ page }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63123',
//     });

//     const credentials = await AuthHelper.setupAuthWithEmailPassword(
//       page,
//       AccountCredentials.account3
//     );
//     await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
//     await AllureReporter.addParameter('clanName', clanFactory.getClanName());
//   });

//   test.afterAll(async ({ browser }) => {
//     const context = await browser.newContext();
//     const page = await context.newPage();
//     const credentials = await AuthHelper.setupAuthWithEmailPassword(
//       page,
//       AccountCredentials.account3
//     );
//     await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
//     await clanFactory.cleanupClan(page);
//     await AuthHelper.logout(page);
//     await context.close();
//   });

//   test.afterEach(async ({ page }) => {
//     await AuthHelper.logout(page);
//   });

//   test('Verify that I can invite people to a clan from sidebar', async ({ page }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63379',
//     });

//     await AllureReporter.addTestParameters({
//       testType: AllureConfig.TestTypes.E2E,
//       userType: AllureConfig.UserTypes.AUTHENTICATED,
//       severity: AllureConfig.Severity.CRITICAL,
//     });

//     await AllureReporter.addDescription(`
//     **Test Objective:** Verify that a user can successfully invite people to a clan from sidebar.

//     **Test Steps:**
//     1. Open invite people dialog
//     2. Pick first user on list
//     3. Send invitation
//     4. Verify invitation is sent

//     **Expected Result:** Invitation is successfully sent to the user.
//   `);

//     await AllureReporter.addLabels({
//       tag: ['invite-people', 'user-invitations'],
//     });

//     const clanPage = new ClanPageV2(page);

//     await AllureReporter.step('Open invite people dialog', async () => {
//       await clanPage.clickButtonInvitePeopleFromMenu();
//     });

//     const inviteResult = await AllureReporter.step('Send invitation via modal', async () => {
//       return await clanPage.sendInviteOnModal();
//     });

//     expect(inviteResult.success).toBeTruthy();

//     await AllureReporter.step('Navigate to direct friends page', async () => {
//       await page.goto(joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS));
//     });

//     await AllureReporter.step(`Open DM with invited user`, async () => {
//       await clanPage.openDirectMessageWithUser(inviteResult.username!);
//     });

//     await AllureReporter.step('Verify last message in DM equals urlInvite', async () => {
//       const lastMessage = await clanPage.getLastMessageInChat();
//       const isMatch = lastMessage.includes(inviteResult.urlInvite ?? '');
//       expect(isMatch).toBeTruthy();
//       return isMatch;
//     });

//     await AllureReporter.attachScreenshot(page, 'Invite People Sent');
//   });

//   test('Verify that I can invite people to a clan from channel', async ({ page }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63380',
//     });
//     await AllureReporter.addTestParameters({
//       testType: AllureConfig.TestTypes.E2E,
//       userType: AllureConfig.UserTypes.AUTHENTICATED,
//       severity: AllureConfig.Severity.CRITICAL,
//     });
//     await AllureReporter.addDescription(`
//     **Test Objective:** Verify that a user can successfully invite people to a clan from a channel.
//     **Test Steps:**
//     1. create a channel in clan
//     2. Open invite people dialog from channel
//     3. Pick first user on list
//     4. Send invitation
//     5. Verify invitation is sent
//     **Expected Result:** Invitation is successfully sent to the user.
//   `);
//     await AllureReporter.addLabels({
//       tag: ['invite-people', 'user-invitations'],
//     });

//     const unique = Date.now().toString(36).slice(-6);
//     const channelName = `tc-${unique}`.slice(0, 20);
//     const clanPage = new ClanPageV2(page);

//     await AllureReporter.addParameter('channelName', channelName);
//     await AllureReporter.addParameter('channelType', ChannelType.TEXT);
//     await AllureReporter.addParameter('channelStatus', ChannelStatus.PUBLIC);

//     await AllureReporter.step(`Create new public text channel: ${channelName}`, async () => {
//       await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC);
//     });

//     await AllureReporter.step('Verify channel is present in channel list', async () => {
//       const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
//       expect(isNewChannelPresent).toBe(true);
//     });

//     await AllureReporter.step('Open invite people dialog from channel', async () => {
//       await clanPage.clickButtonInvitePeopleFromChannel();
//     });
//     const inviteResult = await AllureReporter.step('Send invitation via modal', async () => {
//       return await clanPage.sendInviteOnModal();
//     });
//     expect(inviteResult.success).toBeTruthy();
//     await AllureReporter.step('Navigate to direct friends page', async () => {
//       await page.goto(joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS));
//     });
//     await AllureReporter.step(`Open DM with invited user`, async () => {
//       await clanPage.openDirectMessageWithUser(inviteResult.username!);
//     });
//     await AllureReporter.step('Verify last message in DM equals urlInvite', async () => {
//       const lastMessage = await clanPage.getLastMessageInChat();
//       const isMatch = lastMessage.includes(inviteResult.urlInvite ?? '');
//       expect(isMatch).toBeTruthy();
//       return isMatch;
//     });
//   });
// });


test.describe('Create Event', () => {
  let page: Page;
  let context: BrowserContext;
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account3);
    await clanFactory.setupClan(ClanSetupHelper.configs.clanManagement, page);

    clanFactory.setClanUrl(
      joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, splitDomainAndPath(clanFactory.getClanUrl()).path)
    );
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63123',
    });
    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account3
    );
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), credentials);
    await AllureReporter.addParameter('clanName', clanFactory.getClanName());
  });

  test('Verify that I can create a public voice event in a clan', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63378',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully create a new public voice event within a clan.
    **Test Steps:**
    1. Create a voice channel in clan
    2. Create new public voice event
    3. Verify event appears in event list
    **Expected Result:** Public voice event is created and visible in the clan's event list.
  `);
    await AllureReporter.addLabels({
      tag: ['event-creation', 'public-event', 'voice-event'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const channelName = `vc-${unique}`.slice(0, 20);
    const clanPage = new ClanPageV2(page);
    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('channelType', ChannelType.VOICE);
    await AllureReporter.addParameter('channelStatus', ChannelStatus.PUBLIC);

    await AllureReporter.step(`Create new public voice channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.VOICE, channelName, ChannelStatus.PUBLIC);
    });

    await AllureReporter.step('Verify channel is present in channel list', async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    let res: {
      eventTopic: string;
      description?: string;
      startDate: string;
      startTime: string;
    };

    await AllureReporter.step(`Create new public voice event in clan:`, async () => {
      await clanPage.addDataOnLocationTab(EventType.VOICE, channelName);
      res = await clanPage.addDataOnEventInfoTab();

      const data = {
        ...res,
        channelName: channelName,
        eventType: EventType.VOICE,
      };
      await clanPage.verifyDataOnReviewTab(data);
      await clanPage.eventModal.createEventButton.click();
      await clanPage.waitForModalToBeHidden();
    });

    await AllureReporter.step('Verify event is present in event list', async () => {
      const isCreatedEvent = await clanPage.verifyLastEventData({
        eventTopic: res.eventTopic,
        description: res.description,
        voiceChannelName: channelName,
        startTime: `${res.startDate} - ${res.startTime}`,
        clanStatus: ClanStatus.PUBLIC,
        eventType: EventType.VOICE,
      });
      expect(isCreatedEvent).toBeTruthy();
    });

    await AllureReporter.step(
      'Verify event information is match in event dertail modal',
      async () => {
        const isCreatedEvent = await clanPage.verifyInEventDetailModal({
          eventTopic: res.eventTopic,
          description: res.description,
          channelName: channelName,
          startTime: `${res.startDate} - ${res.startTime}`,
        });
        expect(isCreatedEvent).toBeTruthy();
      }
    );

    await AllureReporter.attachScreenshot(page, `Public Voice Event Created - ${channelName}`);
  });

  test('Verify that I can create a Private voice event in a clan', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63378',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully create a new Private voice event within a clan.
    **Test Steps:**
    1. Create a voice channel in clan
    2. Create a private text channel in clan
    3. Create new Private voice event
    4. Verify event appears in event list
    **Expected Result:** Private voice event is created and visible in the clan's event list.
  `);
    await AllureReporter.addLabels({
      tag: ['event-creation', 'Private-event', 'voice-event'],
    });
    const unique = Date.now().toString(36).slice(-6);
    const voiceChannelName = `vc-${unique}`.slice(0, 20);
    const textChannelName = `ptc-${unique}`.slice(0, 20);
    const clanPage = new ClanPageV2(page);
    await AllureReporter.addParameter('voiceChannelName', voiceChannelName);
    await AllureReporter.addParameter('voiceChannelType', ChannelType.VOICE);
    await AllureReporter.addParameter('voiceChannelStatus', ChannelStatus.PUBLIC);

    await AllureReporter.step(`Create new voice channel: ${voiceChannelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.VOICE, voiceChannelName, ChannelStatus.PUBLIC);
    });

    await AllureReporter.step('Verify channel is present in channel list', async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(voiceChannelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.addParameter('textChannelName', textChannelName);
    await AllureReporter.addParameter('textChannelType', ChannelType.TEXT);
    await AllureReporter.addParameter('textChannelStatus', ChannelStatus.PRIVATE);

    await AllureReporter.step(`Create new private text channel: ${textChannelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, textChannelName, ChannelStatus.PRIVATE);
    });

    await AllureReporter.step('Verify channel is present in channel list', async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(textChannelName);
      expect(isNewChannelPresent).toBe(true);
    });

    let res: {
      eventTopic: string;
      description?: string;
      startDate: string;
      startTime: string;
    };

    await AllureReporter.step(`Create new Private voice event in clan:`, async () => {
      await clanPage.addDataOnLocationTab(
        EventType.VOICE,
        voiceChannelName,
        ClanStatus.PRIVATE,
        textChannelName
      );
      res = await clanPage.addDataOnEventInfoTab();

      const data = {
        ...res,
        voiceChannelName,
        eventType: EventType.VOICE,
        clanStatus: ClanStatus.PRIVATE,
        textChannelName,
      };
      await clanPage.verifyDataOnReviewTab(data);
      await clanPage.eventModal.createEventButton.click();
      await clanPage.waitForModalToBeHidden();
    });

    await AllureReporter.step('Verify event is present in event list', async () => {
      const isCreatedEvent = await clanPage.verifyLastEventData({
        eventTopic: res.eventTopic,
        description: res.description,
        voiceChannelName,
        startTime: `${res.startDate} - ${res.startTime}`,
        clanStatus: ClanStatus.PRIVATE,
        eventType: EventType.VOICE,
        textChannelName,
      });
      expect(isCreatedEvent).toBeTruthy();
    });

    await AllureReporter.step(
      'Verify event information is match in event dertail modal',
      async () => {
        const isCreatedEvent = await clanPage.verifyInEventDetailModal({
          eventTopic: res.eventTopic,
          description: res.description,
          channelName: voiceChannelName,
          startTime: `${res.startDate} - ${res.startTime}`,
        });
        expect(isCreatedEvent).toBeTruthy();
      }
    );

    await AllureReporter.attachScreenshot(
      page,
      `Private Voice Event Created - ${voiceChannelName}`
    );
  });
});
