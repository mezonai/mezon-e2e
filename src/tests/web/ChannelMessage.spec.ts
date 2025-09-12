// import { AllureConfig } from '@/config/allure.config';
// import { AllureReporter } from '@/utils/allureHelpers';
// import { expect, test } from '@playwright/test';
// import { WEBSITE_CONFIGS } from '../../config/environment';
// import { joinUrlPaths } from '../../utils/joinUrlPaths';
// import { LINK_TEST_URLS, MessageTestHelpers } from '../../utils/messageHelpers';
// import { AuthHelper } from '@/utils/authHelper';
// import { ClanPageV2 } from '@/pages/ClanPageV2';
// import { ChannelType, ChannelStatus } from '@/types/clan-page.types';
// import { ClanSetupHelper } from '@/utils/clanSetupHelper';

// const MEZON_BASE_URL = WEBSITE_CONFIGS.MEZON.baseURL || '';
// const DIRECT_CHAT_URL = joinUrlPaths(MEZON_BASE_URL, 'chat/direct/message/1955879210568388608/3');

// interface NavigationHelpers {
//   navigateToHomePage(): Promise<void>;
//   navigateToDirectChat(): Promise<void>;
//   clickUserInChatList(username: string): Promise<void>;
//   navigateToClanChannel(): Promise<void>;
// }

// test.describe('Channel Message Functionality', () => {
//   let messageHelpers: MessageTestHelpers;
//   let clanSetupHelper: ClanSetupHelper;
//   let testClanName: string;
//   let testClanUrl: string;

//   test.beforeAll(async ({ browser }) => {
//     clanSetupHelper = new ClanSetupHelper(browser);

//     const setupResult = await clanSetupHelper.setupTestClan(ClanSetupHelper.configs.messageTests);

//     testClanName = setupResult.clanName;
//     testClanUrl = setupResult.clanUrl;
//   });

//   test.afterAll(async ({ browser }) => {
//     if (clanSetupHelper && testClanName && testClanUrl) {
//       await clanSetupHelper.cleanupClan(
//         testClanName,
//         testClanUrl,
//         ClanSetupHelper.configs.messageTests.suiteName
//       );
//     }
//   });

//   const createNavigationHelpers = (page: any): NavigationHelpers => ({
//     async navigateToHomePage(): Promise<void> {
//       await page.goto(MEZON_BASE_URL);
//       await page.waitForLoadState('domcontentloaded');
//     },

//     async navigateToDirectChat(): Promise<void> {
//       const directFriendsUrl = joinUrlPaths(MEZON_BASE_URL, 'chat/direct/friends');
//       await page.goto(directFriendsUrl);
//       await page.waitForLoadState('networkidle');
//       await page.waitForTimeout(3000);
//     },

//     async clickUserInChatList(username: string): Promise<void> {
//       const userSelectors = [
//         `text=${username}`,
//         `[data-testid*="${username}"]`,
//         `div:has-text("${username}")`,
//         `.user-item:has-text("${username}")`,
//         `.direct-message:has-text("${username}")`,
//       ];

//       for (const selector of userSelectors) {
//         const element = page.locator(selector).first();
//         if (await element.isVisible({ timeout: 5000 })) {
//           await element.click();
//           await page.waitForLoadState('networkidle');
//           await page.waitForTimeout(3000);
//           return;
//         }
//       }

//       await page.goto(DIRECT_CHAT_URL);
//       await page.waitForLoadState('networkidle');
//       await page.waitForTimeout(3000);
//     },

//     async navigateToClanChannel(): Promise<void> {
//       await page.goto(testClanUrl);
//       await page.waitForLoadState('networkidle');
//       await page.waitForTimeout(3000);
//     },
//   });

//   test.beforeEach(async ({ page, context }, testInfo) => {
//     const accountUsed = await AuthHelper.setAuthForSuite(
//       page,
//       ClanSetupHelper.configs.messageTests.suiteName || 'Channel Message Tests'
//     );

//     await AllureReporter.initializeTest(page, testInfo, {
//       story: AllureConfig.Stories.TEXT_MESSAGING,
//       severity: AllureConfig.Severity.CRITICAL,
//       testType: AllureConfig.TestTypes.E2E,
//     });

//     await AllureReporter.addWorkItemLinks({
//       tms: '63368',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);

//     messageHelpers = new MessageTestHelpers(page);
//     const navigationHelpers = createNavigationHelpers(page);

//     await AllureReporter.step('Setup test environment', async () => {
//       await navigationHelpers.navigateToClanChannel();
//     });
//   });

//   test('Click into an image in the message and copy from detail', async ({ page }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63389',
//     });

//     await AllureReporter.addTestParameters({
//       testType: AllureConfig.TestTypes.E2E,
//       userType: AllureConfig.UserTypes.AUTHENTICATED,
//       severity: AllureConfig.Severity.NORMAL,
//     });

//     await AllureReporter.addDescription(`
//       **Test Objective:** Verify that users can click into an image in a message and copy it from the detail view.

//       **Test Steps:**
//       1. Find an image in a message
//       2. Click into the image to open detail view
//       3. Copy the image from detail view
//       4. Close modal and paste the image
//       5. Send the pasted image

//       **Expected Result:** Image should be successfully copied and pasted as a new message.
//     `);

//     await AllureReporter.addLabels({
//       tag: ['image-handling', 'copy-paste', 'media'],
//     });

//     const initialImageCount = await AllureReporter.step('Count initial images', async () => {
//       return await messageHelpers.countImages();
//     });

//     if (initialImageCount === 0) {
//       await AllureReporter.attachScreenshot(page, 'No Images Available for Test');
//       return;
//     }

//     const targetImage = await AllureReporter.step('Find target image', async () => {
//       return await messageHelpers.findImage();
//     });

//     const { imageToRightClick } = await AllureReporter.step(
//       'Click image and handle modal',
//       async () => {
//         return await messageHelpers.clickImageAndHandleModal(targetImage);
//       }
//     );

//     await AllureReporter.step('Copy image from detail view', async () => {
//       await messageHelpers.copyImage(imageToRightClick);
//     });

//     await AllureReporter.step('Close modal', async () => {
//       await messageHelpers.closeModal();
//     });

//     await AllureReporter.step('Paste and send image', async () => {
//       await messageHelpers.pasteAndSendImage();
//     });

//     await AllureReporter.step('Verify pasted image is visible', async () => {
//       await expect(page.locator('img[src*="blob:"]').last()).toBeVisible();
//     });

//     await AllureReporter.attachScreenshot(page, 'Image Copy Test Completed');
//   });

//   test('Copy image from context menu outside the message', async ({ page }) => {
//     const initialImageCount = await messageHelpers.countImages();
//     if (initialImageCount === 0) {
//       return;
//     }
//     const targetImage = await messageHelpers.findImage();
//     await messageHelpers.copyImage(targetImage);
//     await messageHelpers.pasteAndSendImage();
//     await expect(page.locator('img[src*="blob:"]').last()).toBeVisible();
//   });

//     await AllureReporter.step('Verify pasted image is visible', async () => {
//       await expect(page.locator('img[src*="blob:"]').last()).toBeVisible();
//     });

//     await AllureReporter.attachScreenshot(page, 'Image Copy Test Completed');
//   });

//   test('Copy image from context menu outside the message', async ({ page }) => {
//     const initialImageCount = await messageHelpers.countImages();
//     if (initialImageCount === 0) {
//       return;
//     }
//     const targetImage = await messageHelpers.findImage();
//     await messageHelpers.copyImage(targetImage);
//     await messageHelpers.pasteAndSendImage();
//     await expect(page.locator('img[src*="blob:"]').last()).toBeVisible();
//   });

//   test('Copy message text and send it', async ({ page }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63390',
//     });

//     const testMessage = `Test message ${Date.now()}`;
//     await messageHelpers.sendTextMessage(testMessage);

//     const targetMessage = await messageHelpers.findLastMessage();

//     const copiedText = await messageHelpers.copyText(targetMessage);
//     expect(copiedText).toBeTruthy();
//     expect(copiedText.trim().length).toBeGreaterThan(0);
//     expect(copiedText).toContain('Test message');

//     const pastedText = copiedText || 'Pasted message from clipboard';
//     await messageHelpers.sendTextMessage(pastedText);

//     await expect(page.locator(`text="${pastedText}"`).first()).toBeVisible();
//   });

//   test('Create topic discussion thread from message', async ({ page }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63391',
//     });

//     messageHelpers = new MessageTestHelpers(page);

//     const initialMessageCount = await messageHelpers.countMessages();

//     const originalMessage = `Original message ${Date.now()}`;
//     await messageHelpers.sendTextMessage(originalMessage);

//     const targetMessage = await messageHelpers.findLastMessage();

//     await messageHelpers.openTopicDiscussion(targetMessage);

//     const threadMessage = `Thread reply ${Date.now()}`;
//     await messageHelpers.sendMessageInThread(threadMessage);

//     const finalMessageCount = await messageHelpers.countMessages();
//     expect(finalMessageCount).toBeGreaterThanOrEqual(initialMessageCount + 1);
//   });

//   test('Create thread from message and send reply', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63392',
//     });

//     messageHelpers = new MessageTestHelpers(page);
//     await page.goto(testClanUrl);
//     await page.waitForLoadState('networkidle');
//     await page.waitForTimeout(3000);
//     const initialMessageCount = await messageHelpers.countMessages();

//     const originalMessage = `Thread starter message ${Date.now()}`;
//     await messageHelpers.sendTextMessage(originalMessage);

//     const targetMessage = await messageHelpers.findLastMessage();

//     const threadName = `My Test Thread ${Date.now()}`;
//     await messageHelpers.createThread(targetMessage, threadName);

//     const threadReply = `Thread reply ${Date.now()}`;
//     await messageHelpers.sendMessageInThread(threadReply, true);

//     const finalMessageCount = await messageHelpers.countMessages();
//     expect(finalMessageCount).toBeGreaterThanOrEqual(initialMessageCount + 1);
//   });

//   test('Delete message', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63393',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);

//     messageHelpers = new MessageTestHelpers(page);

//     const messageToDelete = `Message to delete ${Date.now()}`;
//     const targetMessage = await messageHelpers.sendTextMessageAndGetItem(messageToDelete);

//     await messageHelpers.deleteMessage(targetMessage);

//     const disappeared = await messageHelpers.waitForMessageToDisappear(messageToDelete, 10000);
//     expect(disappeared).toBeTruthy();
//   });

//   test('Edit message', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63394',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);

//     messageHelpers = new MessageTestHelpers(page);

//     const originalMessage = `Original message ${Date.now()}`;
//     await messageHelpers.sendTextMessage(originalMessage);

//     const targetMessage = await messageHelpers.findLastMessage();

//     try {
//       const editedContent = `Edited message ${Date.now()}`;
//       await messageHelpers.editMessage(targetMessage, editedContent);

//       await page.waitForTimeout(3000);

//       const updatedMessage = await messageHelpers.findLastMessage();
//       const messageText = await updatedMessage.textContent();

//       const hasOriginal = messageText?.includes('Original message');

//       expect(hasOriginal).toBeTruthy();
//     } catch {
//       expect(true).toBeTruthy();
//     }
//   });

//   test('Forward message - select target and send', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63395',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);

//     messageHelpers = new MessageTestHelpers(page);

//     const messageToForward = `Message to forward ${Date.now()}`;
//     await messageHelpers.sendTextMessage(messageToForward);

//     expect(true).toBeTruthy();
//   });

//   test('Forward message to general channel', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63395',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);

//     messageHelpers = new MessageTestHelpers(page);

//     const messageToForward = `Message to forward to general ${Date.now()}`;
//     const targetMessage = await messageHelpers.sendTextMessageAndGetItem(messageToForward);

//     await messageHelpers.forwardMessage(targetMessage, 'general');

//     await page.waitForTimeout(1500);
//   });

//   test('Pin message and verify in pinned modal', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63396',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);

//     messageHelpers = new MessageTestHelpers(page);

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
//     await AllureReporter.addWorkItemLinks({
//       tms: '63397',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);

//     messageHelpers = new MessageTestHelpers(page);

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

//   test('Test hashtag channel functionality', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63398',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);
//     messageHelpers = new MessageTestHelpers(page);
//     await page.goto(testClanUrl);
//     await page.waitForLoadState('networkidle');
//     await page.waitForTimeout(3000);

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
//     await AllureReporter.addWorkItemLinks({
//       tms: '63399',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);
//     messageHelpers = new MessageTestHelpers(page);
//     await page.goto(testClanUrl);
//     await page.waitForLoadState('networkidle');
//     await page.waitForTimeout(3000);

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
//     await AllureReporter.addWorkItemLinks({
//       tms: '63399',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);
//     messageHelpers = new MessageTestHelpers(page);
//     await page.goto(testClanUrl);
//     await page.waitForLoadState('networkidle');
//     await page.waitForTimeout(3000);

//     const candidateNames = ['nguyen.nguyen'];
//     await messageHelpers.mentionUserAndSend('@ng', candidateNames);
//   });

//   test('React to a message with 3 different emojis', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63400',
//     });

//     messageHelpers = new MessageTestHelpers(page);
//     await page.goto(testClanUrl);
//     await page.waitForLoadState('networkidle');
//     await page.waitForTimeout(3000);

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
//     await AllureReporter.addWorkItemLinks({
//       tms: '63400',
//     });

//     messageHelpers = new MessageTestHelpers(page);
//     await page.goto(testClanUrl);
//     await page.waitForLoadState('networkidle');
//     await page.waitForTimeout(3000);

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

//   test('Reply to a message and send', async ({ page, context }) => {
//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);
//     messageHelpers = new MessageTestHelpers(page);

//     const original = `Reply base ${Date.now()}`;
//     const target = await messageHelpers.sendTextMessageAndGetItem(original);
//     const replyText = `Reply content ${Date.now()}`;
//     await messageHelpers.replyToMessage(target, replyText);
//     await page.waitForTimeout(1000);
//     const ok = await messageHelpers.verifyLastMessageIsReplyTo(original, replyText);
//     const visible = await messageHelpers.isMessageVisible(replyText);
//     expect(ok || visible).toBeTruthy();
//   });

//   test('Search emoji in picker and apply reaction', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63401',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);
//     messageHelpers = new MessageTestHelpers(page);

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

//   test('Create topic discussion and send emoji message', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63391',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);
//     messageHelpers = new MessageTestHelpers(page);

//     const originalMsg = `Topic starter ${Date.now()}`;
//     const target = await messageHelpers.sendTextMessageAndGetItem(originalMsg);
//     await page.waitForTimeout(800);

//     await messageHelpers.openTopicDiscussion(target);
//     await page.waitForTimeout(2000);

//     const emojiMsg = '😀🎉👍';
//     await messageHelpers.sendMessageInThread(emojiMsg);
//     await page.waitForTimeout(3000);

//     const topicMessages = await messageHelpers.getMessagesFromTopicDrawer();
//     expect(emojiMsg).toEqual(topicMessages[topicMessages.length - 1].content);
//   });
//   //Dual user chat
//   // test.skip('Send message from short profile in clan channel', async ({ page, context }) => {
//   //   await AllureReporter.addWorkItemLinks({
//   //     tms: '63403',
//   //   });

//   //   messageHelpers = new MessageTestHelpers(page);

//   //   await messageHelpers.clickMembersButton();
//   //   await messageHelpers.clickMemberInList('nguyen.nguyen');

//   //   const testMessage = `Test message from Case 12 short profile 11${Date.now()}`;
//   //   await messageHelpers.sendMessageFromShortProfile(testMessage);

//   //   await page.waitForTimeout(2000);
//   // });

//   test('Send Message With Markdown', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63404',
//     });

//     messageHelpers = new MessageTestHelpers(page);

//     const markdownMessage = `\`\`\`Test markdown message with code block ${Date.now()}\`\`\``;
//     await messageHelpers.sendTextMessage(markdownMessage);

//     const isMarkdownRendered = await messageHelpers.verifyMarkdownMessage(markdownMessage);
//     expect(isMarkdownRendered).toBeTruthy();

//     await page.waitForTimeout(2000);
//   });

//   test('Send Message with Emoji', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63405',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);
//     messageHelpers = new MessageTestHelpers(page);

//     await page.goto(testClanUrl);
//     await page.waitForLoadState('networkidle');
//     await page.waitForTimeout(2000);

//     const baseMessage = `Test message with emoji ${Date.now()}`;
//     const emojiQuery = ':smile';

//     await messageHelpers.sendMessageWithEmojiPicker(baseMessage, emojiQuery);

//     const hasEmoji = await messageHelpers.verifyLastMessageHasEmoji();
//     expect(hasEmoji).toBeTruthy();

//     await page.waitForTimeout(2000);
//   });

//   test('Send text too large for convert to file txt', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63406',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);
//     messageHelpers = new MessageTestHelpers(page);

//     await page.goto(testClanUrl);
//     await page.waitForLoadState('networkidle');
//     await page.waitForTimeout(2000);

//     const longMessage = await messageHelpers.generateLongMessage(3000);
//     const fileConverted = await messageHelpers.sendLongMessageAndCheckFileConversion(longMessage);

//     expect(fileConverted).toBeTruthy();

//     await page.waitForTimeout(2000);
//   });

//   test('Send message with hashtag', async ({ page, context }) => {
//     messageHelpers = new MessageTestHelpers(page);

//     await page.goto(testClanUrl);
//     await page.waitForLoadState('networkidle');
//     await page.waitForTimeout(2000);

//     const baseMessage = `Hashtag test ${Date.now()}`;
//     await messageHelpers.sendMessageWithHashtag(baseMessage, '', 'general');

//     const hasHashtag = await messageHelpers.verifyLastMessageHasHashtag('general');
//     expect(hasHashtag).toBeTruthy();

//     await page.waitForTimeout(1500);
//   });

//   test('Send message with multiple links', async ({ page, context }) => {
//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);
//     messageHelpers = new MessageTestHelpers(page);

//     await page.goto(testClanUrl);
//     await page.waitForLoadState('networkidle');
//     await page.waitForTimeout(2000);
//     await messageHelpers.sendMessageWithMultipleLinks(LINK_TEST_URLS);

//     await page.waitForTimeout(2000);
//   });

//   test('Send message with buzz (Ctrl+G)', async ({ page, context }) => {
//     await AllureReporter.addWorkItemLinks({
//       tms: '63407',
//     });

//     await context.grantPermissions(['clipboard-read', 'clipboard-write']);
//     messageHelpers = new MessageTestHelpers(page);

//     await page.goto(testClanUrl);
//     await page.waitForLoadState('networkidle');
//     await page.waitForTimeout(2000);

//     const buzzMessage = `Buzz message test ${Date.now()}`;

//     await messageHelpers.sendBuzzMessage(buzzMessage);

//     await page.waitForTimeout(2000);
//   });
// });
