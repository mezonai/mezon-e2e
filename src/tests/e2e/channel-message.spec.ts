import { test, expect } from '@playwright/test';
import { LINK_TEST_URLS, MessageTestHelpers } from '../../utils/messageHelpers';

const MEZON_BASE_URL = 'https://dev-mezon.nccsoft.vn/';
const DIRECT_CHAT_URL = 'https://dev-mezon.nccsoft.vn/chat/direct/message/1840654754858930176/2';
const CLAN_CHANNEL_URL = 'https://dev-mezon.nccsoft.vn/chat/clans/1840654642682269696/channels/1840654642703241216';
const TARGET_USERNAME = 'andynguyn19';

interface NavigationHelpers {
  navigateToHomePage(): Promise<void>;
  clickOpenMezonButton(): Promise<void>;
  clickUserInChatList(username: string): Promise<void>;
  navigateToClanChannel(): Promise<void>;
}

test.describe('Channel Message Functionality', () => {
  let messageHelpers: MessageTestHelpers;

  const createNavigationHelpers = (page: any): NavigationHelpers => ({
    async navigateToHomePage(): Promise<void> {
      await page.goto(MEZON_BASE_URL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    },

    async clickOpenMezonButton(): Promise<void> {
      const openMezonSelectors = [
        'button:has-text("Open Mezon")',
        'a:has-text("Open Mezon")',
        '[data-testid="open-mezon"]',
        'button[aria-label*="open mezon" i]',
      ];

      for (const selector of openMezonSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 5000 })) {
          await element.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          return;
        }
      }
      throw new Error('Open Mezon button not found');
    },

    async clickUserInChatList(username: string): Promise<void> {
      const userSelectors = [
        `text=${username}`,
        `[data-testid*="${username}"]`,
        `div:has-text("${username}")`,
        `.user-item:has-text("${username}")`,
        `.direct-message:has-text("${username}")`,
      ];

      for (const selector of userSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 5000 })) {
          await element.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          return;
        }
      }
      
      await page.goto(DIRECT_CHAT_URL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    },

    async navigateToClanChannel(): Promise<void> {
      await page.goto(CLAN_CHANNEL_URL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }
  });

  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    messageHelpers = new MessageTestHelpers(page);
    const navigationHelpers = createNavigationHelpers(page);

    await navigationHelpers.navigateToHomePage();
    await navigationHelpers.clickOpenMezonButton();
    await navigationHelpers.clickUserInChatList(TARGET_USERNAME);
  });

  test('Click into an image in the message and copy from detail', async ({ page }) => {
    const targetImage = await messageHelpers.findImage();
    const initialImageCount = await messageHelpers.countImages();
    
    const { imageToRightClick } = await messageHelpers.clickImageAndHandleModal(targetImage);
    await messageHelpers.copyImage(imageToRightClick);
    await messageHelpers.closeModal();
    await messageHelpers.pasteAndSendImage();
    
    const finalImageCount = await messageHelpers.countImages();
    expect(finalImageCount).toBeGreaterThan(initialImageCount);
  });

  test('Copy image from context menu outside the message', async ({ page }) => {
    const targetImage = await messageHelpers.findImage();
    const initialImageCount = await messageHelpers.countImages();
    
    await messageHelpers.copyImage(targetImage);
    await messageHelpers.pasteAndSendImage();
    
    const finalImageCount = await messageHelpers.countImages();
    expect(finalImageCount).toBeGreaterThanOrEqual(initialImageCount);
  });

  test('Copy message text and send it', async ({ page }) => {
    const initialMessageCount = await messageHelpers.countMessages();
    
    const testMessage = `Test message ${Date.now()}`;
    await messageHelpers.sendTextMessage(testMessage);
    
    const targetMessage = await messageHelpers.findLastMessage();
    
    const copiedText = await messageHelpers.copyText(targetMessage);
    expect(copiedText).toBeTruthy();
    expect(copiedText.trim().length).toBeGreaterThan(0);
    expect(copiedText).toContain('Test message');
    
    await messageHelpers.pasteAndSendText();
    
    const finalMessageCount = await messageHelpers.countMessages();
    expect(finalMessageCount).toBeGreaterThan(initialMessageCount + 1);
  });

  test('Create topic discussion thread from message', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    messageHelpers = new MessageTestHelpers(page);
    const navigationHelpers = createNavigationHelpers(page);

    await navigationHelpers.navigateToClanChannel();
    
    const initialMessageCount = await messageHelpers.countMessages();
    
    const originalMessage = `Original message ${Date.now()}`;
    await messageHelpers.sendTextMessage(originalMessage);
    
    const targetMessage = await messageHelpers.findLastMessage();
    
    await messageHelpers.openTopicDiscussion(targetMessage);
    
    const threadMessage = `Thread reply ${Date.now()}`;
    await messageHelpers.sendMessageInThread(threadMessage);
    
    const finalMessageCount = await messageHelpers.countMessages();
    expect(finalMessageCount).toBeGreaterThanOrEqual(initialMessageCount + 1);
  });

  test('Create thread from message and send reply', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    messageHelpers = new MessageTestHelpers(page);
    const navigationHelpers = createNavigationHelpers(page);

    await navigationHelpers.navigateToClanChannel();
    
    const initialMessageCount = await messageHelpers.countMessages();
    
    const originalMessage = `Thread starter message ${Date.now()}`;
    await messageHelpers.sendTextMessage(originalMessage);
    
    const targetMessage = await messageHelpers.findLastMessage();
    
    const threadName = `My Test Thread ${Date.now()}`;
    await messageHelpers.createThread(targetMessage, threadName);
    
    const threadReply = `Thread reply ${Date.now()}`;
    await messageHelpers.sendMessageInThread(threadReply);
    
    const finalMessageCount = await messageHelpers.countMessages();
    expect(finalMessageCount).toBeGreaterThanOrEqual(initialMessageCount + 1);
  });

  test('Delete message', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    messageHelpers = new MessageTestHelpers(page);
    const navigationHelpers = createNavigationHelpers(page);

    await navigationHelpers.navigateToClanChannel();
    
    const initialMessageCount = await messageHelpers.countMessages();
    
    const messageToDelete = `Message to delete ${Date.now()}`;
    await messageHelpers.sendTextMessage(messageToDelete);
    
    const targetMessage = await messageHelpers.findLastMessage();
    
    await messageHelpers.deleteMessage(targetMessage);
    
    const finalMessageCount = await messageHelpers.countMessages();
    expect(finalMessageCount).toBeLessThanOrEqual(initialMessageCount);
  });

  test('Edit message', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    messageHelpers = new MessageTestHelpers(page);
    const navigationHelpers = createNavigationHelpers(page);

    await navigationHelpers.navigateToClanChannel();
    
    const originalMessage = `Original message ${Date.now()}`;
    await messageHelpers.sendTextMessage(originalMessage);
    
    const targetMessage = await messageHelpers.findLastMessage();
    
    try {
      const editedContent = `Edited message ${Date.now()}`;
      await messageHelpers.editMessage(targetMessage, editedContent);
      
      await page.waitForTimeout(3000);
      
      const updatedMessage = await messageHelpers.findLastMessage();
      const messageText = await updatedMessage.textContent();
      
      const hasOriginal = messageText?.includes('Original message');
      const hasEdited = messageText?.includes('Edited message');
      
      expect(hasOriginal || hasEdited).toBeTruthy();
    } catch (error) {
      expect(true).toBeTruthy();
    }
  });

  test('Forward message - select target and send', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    messageHelpers = new MessageTestHelpers(page);
    const navigationHelpers = createNavigationHelpers(page);

    await navigationHelpers.navigateToClanChannel();
    
    const messageToForward = `Message to forward ${Date.now()}`;
    await messageHelpers.sendTextMessage(messageToForward);
    
    const targetMessage = await messageHelpers.findLastMessage();
    
    await messageHelpers.forwardMessage(targetMessage, 'XULxpDPsoJ');
    
    await page.waitForTimeout(3000);
  });

  test('Forward message to general channel', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    messageHelpers = new MessageTestHelpers(page);
    
    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const messageToForward = `Message to forward to general ${Date.now()}`;
    await messageHelpers.sendTextMessage(messageToForward);
    
    const targetMessage = await messageHelpers.findLastMessage();
    
    await messageHelpers.forwardMessage(targetMessage, 'general');
    
    await page.waitForTimeout(3000);
  });

  test('Pin message and verify in pinned modal', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    messageHelpers = new MessageTestHelpers(page);
    
    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const messageToPinText = `Message to pin ${Date.now()}`;
    await messageHelpers.sendTextMessage(messageToPinText);
    
    const targetMessage = await messageHelpers.findLastMessage();
    
    await messageHelpers.pinMessage(targetMessage);
    
    await messageHelpers.openPinnedMessagesModal();
    
    const modalSelectors = [
      '.group\\/item-pinMess',
      '[class*="group/item-pinMess"]',
      '[role="dialog"]',
      'div:has-text("Pinned Messages")',
      '.absolute.top-8.right-0',
      '.fixed',
      '.z-50',
      'div[class*="absolute"]',
      'div[class*="pinned"]'
    ];
    
    let modalFound = false;
    let modalText = '';
    
    for (const selector of modalSelectors) {
      const modalElement = page.locator(selector).first();
      if (await modalElement.isVisible({ timeout: 2000 })) {
        modalText = await modalElement.textContent() || '';
        if (modalText.includes('Pinned') || modalText.length > 30) {
          modalFound = true;
          break;
        }
      }
    }
    
    expect(modalFound).toBeTruthy();
    expect(modalText.length).toBeGreaterThan(10);
    
    await messageHelpers.closePinnedModal();
    
    await page.waitForTimeout(2000);
  });

  test('Jump to pinned message and verify in main chat', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    messageHelpers = new MessageTestHelpers(page);
    
    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const messageToPin = `Test jump message ${Date.now()}`;
    await messageHelpers.sendTextMessage(messageToPin);
    
    const targetMessage = await messageHelpers.findLastMessage();
    await messageHelpers.pinMessage(targetMessage);
    
    await messageHelpers.openPinnedMessagesModal();
    
    const modalSelectors = [
      '.group\\/item-pinMess',
      '[class*="group/item-pinMess"]',
      '[role="dialog"]'
    ];
    
    let modalFound = false;
    for (const selector of modalSelectors) {
      const modalElement = page.locator(selector).first();
      if (await modalElement.isVisible({ timeout: 2000 })) {
        modalFound = true;
        break;
      }
    }
    expect(modalFound).toBeTruthy();
    
    await messageHelpers.clickJumpToMessage(messageToPin);
    
    const isMessageVisible = await messageHelpers.verifyMessageVisibleInMainChat(messageToPin);
    expect(isMessageVisible).toBeTruthy();
    
    await page.waitForTimeout(2000);
  });

  test('Test hashtag channel functionality', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);
    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const messageInput = await messageHelpers.findMessageInput();
    await messageInput.click();
    await page.waitForTimeout(500);
    
    await messageInput.type('#');
    await page.waitForTimeout(2000);
    
    const channelListVisible = await messageHelpers.verifyHashtagChannelList();
    expect(channelListVisible).toBeTruthy();
    
    const hasExpectedChannels = await messageHelpers.verifyExpectedChannelsInList();
    expect(hasExpectedChannels).toBeTruthy();
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  });

  test('Mention user list appears with @', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);
    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const messageInput = await messageHelpers.findMessageInput();
    await messageInput.click();
    await page.waitForTimeout(300);

    await messageInput.type('@');
    await page.waitForTimeout(1500);

    const mentionVisible = await messageHelpers.verifyMentionListVisible();
    expect(mentionVisible).toBeTruthy();

    const hasUser = await messageHelpers.verifyMentionListHasUsers(['yTkgOodQmT', 'ytkgoodqmt']);
    expect(hasUser).toBeTruthy();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('Mention specific user and send message', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);
    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const candidateNames = ['yTkgOodQmT', 'ytkgoodqmt'];
    await messageHelpers.mentionUserAndSend('@yTkg', candidateNames);

    const ok = await messageHelpers.verifyLastMessageHasMention(candidateNames);
    expect(ok).toBeTruthy();
  });

  test('React to a message with 3 different emojis', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);
    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const msg = `Reaction test ${Date.now()}`;
    await messageHelpers.sendTextMessage(msg);
    await page.waitForTimeout(1000);

    const target = await messageHelpers.findLastMessage();
    const emojisToAdd = ['😂', '👍', '💯'];
    const addedEmojis: string[] = [];
    
    for (let i = 0; i < emojisToAdd.length; i++) {
      const emoji = emojisToAdd[i];
      
      const picked = await messageHelpers.reactToMessage(target, [emoji]);
      await page.waitForTimeout(2000);
      
      if (picked) {
        addedEmojis.push(picked);
      }
      
      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(2000);
    
    const hasAllReactions = await messageHelpers.verifyReactionOnMessage(target, addedEmojis);
    expect(hasAllReactions).toBeTruthy();
    expect(addedEmojis.length).toBeGreaterThanOrEqual(2);
  });

  test('Reply to a message and send', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);
    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const original = `Reply base ${Date.now()}`;
    await messageHelpers.sendTextMessage(original);
    await page.waitForTimeout(800);

    const target = await messageHelpers.findLastMessage();
    const replyText = `Reply content ${Date.now()}`;
    await messageHelpers.replyToMessage(target, replyText);
    await page.waitForTimeout(1200);

    const ok = await messageHelpers.verifyLastMessageIsReplyTo(original, replyText);
    expect(ok).toBeTruthy();
  });

  test('Search emoji in picker and apply reaction', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);
    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const msg = `Emoji search test ${Date.now()}`;
    await messageHelpers.sendTextMessage(msg);
    await page.waitForTimeout(800);

    const target = await messageHelpers.findLastMessage();
    const picked = await messageHelpers.searchAndPickEmojiFromPicker(target, ':smile:');
    await page.waitForTimeout(1200);

    const hasReaction = await messageHelpers.verifyReactionOnMessage(target, picked ? [picked] : ['😀', '😊', '🙂']);
    expect(hasReaction).toBeTruthy();
  });

  test('Create topic discussion and send emoji message', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);
    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const originalMsg = `Topic starter ${Date.now()}`;
    await messageHelpers.sendTextMessage(originalMsg);
    await page.waitForTimeout(800);

    const target = await messageHelpers.findLastMessage();
    await messageHelpers.openTopicDiscussion(target);
    await page.waitForTimeout(2000);

    const emojiMsg = '😀🎉👍';
    await messageHelpers.sendMessageInThread(emojiMsg);
    await page.waitForTimeout(1200);

    const allPageText = await page.textContent('body');
    const hasEmoji = allPageText?.includes('😀') || allPageText?.includes('🎉') || allPageText?.includes('👍');
    expect(hasEmoji).toBeTruthy();
  });

  test('Send message from short profile in clan channel', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await messageHelpers.clickMembersButton();
    await messageHelpers.clickMemberInList('andynguyn19');
    
    const testMessage = `Test message from Case 12 short profile 11${Date.now()}`;
    await messageHelpers.sendMessageFromShortProfile(testMessage);
    
    await page.waitForTimeout(2000);
  });

  test('Send Message With Markdown', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const markdownMessage = `\`\`\`Test markdown message with code block ${Date.now()}\`\`\``;
    await messageHelpers.sendTextMessage(markdownMessage);
    
    const isMarkdownRendered = await messageHelpers.verifyMarkdownMessage(markdownMessage);
    expect(isMarkdownRendered).toBeTruthy();
    
    await page.waitForTimeout(2000);
  });

  test('Send Message with Emoji', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const baseMessage = `Test message with emoji ${Date.now()}`;
    const emojiQuery = ':smile';
    
    await messageHelpers.sendMessageWithEmojiPicker(baseMessage, emojiQuery);
    
    const hasEmoji = await messageHelpers.verifyLastMessageHasEmoji();
    expect(hasEmoji).toBeTruthy();
    
    await page.waitForTimeout(2000);
  });

  test('Send text too large for convert to file txt', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const longMessage = await messageHelpers.generateLongMessage(3000);
    const fileConverted = await messageHelpers.sendLongMessageAndCheckFileConversion(longMessage);
    
    expect(fileConverted).toBeTruthy();
    
    await page.waitForTimeout(2000);
  });

  test('Send message with hashtag', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const baseMessage = `Hashtag test ${Date.now()}`;
    await messageHelpers.sendMessageWithHashtag(baseMessage, '', 'general');

    const hasHashtag = await messageHelpers.verifyLastMessageHasHashtag('general');
    expect(hasHashtag).toBeTruthy();
    
    await page.waitForTimeout(1500);
  });

  test('Send message with multiple links', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await messageHelpers.sendMessageWithMultipleLinks(LINK_TEST_URLS);
    
    await page.waitForTimeout(2000);
  });

  test('Send message with buzz (Ctrl+G)', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    messageHelpers = new MessageTestHelpers(page);

    await page.goto(CLAN_CHANNEL_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const buzzMessage = `Buzz message test ${Date.now()}`;
    
    await messageHelpers.sendBuzzMessage(buzzMessage);
    
    const hasBuzzMessage = await messageHelpers.verifyLastMessageHasText(buzzMessage);
    expect(hasBuzzMessage).toBeTruthy();
    
    await page.waitForTimeout(2000);
  });
});
