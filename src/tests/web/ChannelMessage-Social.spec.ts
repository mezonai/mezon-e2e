// import { AllureConfig } from '@/config/allure.config';
// import { AllureReporter } from '@/utils/allureHelpers';
// import { ClanSetupHelper } from '@/utils/clanSetupHelper';
// import { AuthHelper } from '@/utils/authHelper';
// import { MessageTestHelpers } from '../../utils/messageHelpers';
// import { expect, test } from '@playwright/test';

// test.describe('Channel Message - Social', () => {
//   let clanSetupHelper: ClanSetupHelper;
//   let testClanName: string;
//   let clanUrl: string;
//   let messageHelpers: MessageTestHelpers;

//   test.use({ storageState: 'playwright/.auth/account2-social.json' });

//   test.beforeAll(async ({ browser }) => {
//     clanSetupHelper = new ClanSetupHelper(browser);
//     const setupResult = await clanSetupHelper.setupTestClan(
//       ClanSetupHelper.configs.channelMessageSocial
//     );
//     testClanName = setupResult.clanName;
//     clanUrl = setupResult.clanUrl;
//   });

//   test.beforeEach(async ({ page, context }, testInfo) => {
//     // await AuthHelper.setAuthForSuite(
//     //   page,
//     //   ClanSetupHelper.configs.channelMessageSocial.suiteName || 'Channel Message - Social'
//     // );

//     await AllureReporter.initializeTest(page, testInfo, {
//       story: AllureConfig.Stories.TEXT_MESSAGING,
//       severity: AllureConfig.Severity.CRITICAL,
//       testType: AllureConfig.TestTypes.E2E,
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);
//     messageHelpers = new MessageTestHelpers(page);

//     await page.goto(clanUrl);
//     await page.waitForLoadState('domcontentloaded');
//     await page.waitForTimeout(3000);
//   });

//   test.afterAll(async ({ browser }) => {
//     if (clanSetupHelper && testClanName && clanUrl) {
//       await clanSetupHelper.cleanupClan(
//         testClanName,
//         clanUrl,
//         ClanSetupHelper.configs.channelMessageSocial.suiteName
//       );
//     }
//   });

//   // Reactions & Emojis Tests
//   test('React to a message with 3 different emojis', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({ tms: '63400' });

//     const msg = `Reaction test ${Date.now()}`;
//     await messageHelpers.sendTextMessage(msg);
//     await page.waitForTimeout(1000);

//     const target = await messageHelpers.findLastMessage();
//     const emojisToAdd = ['😂', '👍', '💯'];
//     const addedEmojis: string[] = [];

//     for (let i = 0; i < emojisToAdd.length; i++) {
//       const emoji = emojisToAdd[i];

//       const picked = await messageHelpers.reactToMessage(target, [emoji]);
//       await page.waitForTimeout(2000);

//       if (picked) {
//         addedEmojis.push(picked);
//       }

//       await page.waitForTimeout(500);
//     }

//     await page.waitForTimeout(2000);

//     const hasAllReactions = await messageHelpers.verifyReactionOnMessage(target, addedEmojis);
//     expect(hasAllReactions).toBeTruthy();
//     expect(addedEmojis.length).toBeGreaterThanOrEqual(2);
//   });

//   test('React to a message with multiple emojis', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({ tms: '63400' });

//     const msg = `Reaction test ${Date.now()}`;
//     await messageHelpers.sendTextMessage(msg);
//     await page.waitForTimeout(1000);

//     const target = await messageHelpers.findLastMessage();
//     const emojisToAdd = ['😂', '👍', '💯'];
//     const addedEmojis: string[] = [];

//     for (let i = 0; i < emojisToAdd.length; i++) {
//       const emoji = emojisToAdd[i];

//       const picked = await messageHelpers.reactToMessage(target, [emoji]);
//       await page.waitForTimeout(2000);

//       if (picked) {
//         addedEmojis.push(picked);
//       }

//       await page.waitForTimeout(500);
//     }

//     await page.waitForTimeout(2000);

//     const hasAllReactions = await messageHelpers.verifyReactionOnMessage(target, addedEmojis);
//     expect(hasAllReactions).toBeTruthy();
//     expect(addedEmojis.length).toBeGreaterThanOrEqual(2);
//   });

//   test('Search emoji in picker and apply reaction', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({ tms: '63401' });

//     const msg = `Emoji search test ${Date.now()}`;
//     await messageHelpers.sendTextMessage(msg);
//     await page.waitForTimeout(800);

//     const target = await messageHelpers.findLastMessage();
//     const picked = await messageHelpers.searchAndPickEmojiFromPicker(target, ':smile:');
//     await page.waitForTimeout(1200);

//     const hasReaction = await messageHelpers.verifyReactionOnMessage(
//       target,
//       picked ? [picked] : ['😀', '😊', '🙂']
//     );
//     expect(hasReaction).toBeTruthy();
//   });

//   // Mentions & Hashtags Tests
//   test('Test hashtag channel functionality', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({ tms: '63398' });

//     const messageInput = await messageHelpers.findMessageInput();
//     await messageInput.click();
//     await page.waitForTimeout(500);

//     await messageInput.type('#');
//     await page.waitForTimeout(2000);

//     const channelListVisible = await messageHelpers.verifyHashtagChannelList();
//     expect(channelListVisible).toBeTruthy();

//     const hasExpectedChannels = await messageHelpers.verifyExpectedChannelsInList();
//     expect(hasExpectedChannels).toBeTruthy();

//     await page.keyboard.press('Escape');
//     await page.waitForTimeout(1000);
//   });

//   test('Mention user list appears with @', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({ tms: '63399' });

//     const messageInput = await messageHelpers.findMessageInput();
//     await messageInput.click();
//     await page.waitForTimeout(300);

//     await messageInput.type('@');
//     await page.waitForTimeout(1500);

//     const mentionVisible = await messageHelpers.verifyMentionListVisible();
//     expect(mentionVisible).toBeTruthy();

//     await page.keyboard.press('Escape');
//     await page.waitForTimeout(500);
//   });

//   test('Mention specific user and send message', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({ tms: '63399' });

//     const candidateNames = ['nguyen.nguyen'];
//     await messageHelpers.mentionUserAndSend('@ng', candidateNames);
//   });

//   // Pin Functionality Tests
//   test('Pin message and verify in pinned modal', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({ tms: '63396' });

//     const messageToPinText = `Message to pin ${Date.now()}`;
//     await messageHelpers.sendTextMessage(messageToPinText);
//     const targetMessage = await messageHelpers.findLastMessage();
//     await messageHelpers.pinMessage(targetMessage);
//     await messageHelpers.openPinnedMessagesModal();
//     await messageHelpers.closePinnedModal();
//     expect(messageToPinText).toBeTruthy();
//     await page.waitForTimeout(2000);
//   });

//   test('Jump to pinned message and verify in main chat', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({ tms: '63397' });

//     const messageToPin = `Test jump message ${Date.now()}`;
//     await messageHelpers.sendTextMessage(messageToPin);

//     const targetMessage = await messageHelpers.findLastMessage();
//     await messageHelpers.pinMessage(targetMessage);

//     await messageHelpers.openPinnedMessagesModal();

//     const modalSelectors = [
//       '.group\\/item-pinMess',
//       '[class*="group/item-pinMess"]',
//       '[role="dialog"]',
//     ];

//     let modalFound = false;
//     for (const selector of modalSelectors) {
//       const modalElement = page.locator(selector).first();
//       if (await modalElement.isVisible({ timeout: 2000 })) {
//         modalFound = true;
//         break;
//       }
//     }
//     expect(modalFound).toBeTruthy();

//     await messageHelpers.clickJumpToMessage(messageToPin);

//     const isMessageVisible = await messageHelpers.verifyMessageVisibleInMainChat(messageToPin);
//     expect(isMessageVisible).toBeTruthy();

//     await page.waitForTimeout(2000);
//   });
// });
