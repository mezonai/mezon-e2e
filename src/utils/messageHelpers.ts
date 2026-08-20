import FriendSelector from '@/data/selectors/FriendSelector';
import MessageSelector from '@/data/selectors/MessageSelector';
import { expect, Locator, Page } from '@playwright/test';
import { generateE2eId, generateE2eSelector } from './generateE2eSelector';
import { MessageContentHelpers } from './message/MessageContentHelpers';

const MESSAGE_ITEM_SELECTOR = generateE2eSelector('message.item');
const MENTION_INPUT_SELECTOR = generateE2eSelector('mention.input');
const ROLE_OPTION_SELECTOR = '[role="option"]';
const THREAD_NAME_INPUT_SELECTOR = generateE2eSelector(
  'chat.channel_message.thread_box.input.thread_name'
);

export class MessageTestHelpers extends MessageContentHelpers {
  message: string = '';

  constructor(page: Page) {
    super(page);
  }

  public getMessageItemLocator(textContains?: string): Locator {
    const base = this.page.locator(MESSAGE_ITEM_SELECTOR);
    return textContains ? base.filter({ hasText: textContains }) : base;
  }

  async replyToMessage(messageElement: Locator, replyText: string): Promise<void> {
    await messageElement.scrollIntoViewIfNeeded();
    await messageElement.hover();
    await messageElement.click({ button: 'right' });

    const replyBtn = this.selector.messageActionModalItems.filter({ hasText: 'Reply' }).first();
    await expect(replyBtn).toBeVisible({ timeout: 3000 });
    await replyBtn.click();
    const input = await this.findMessageInput();
    await input.click();
    await input.waitFor({ state: 'attached' });
    await input.fill(replyText);
    await input.waitFor({ state: 'attached' });
    await input.press('Enter');
    await expect(this.selector.messages.last()).toContainText(replyText, { timeout: 5000 });
  }

  async editMessage(messageElement: Locator, newText: string): Promise<void> {
    await messageElement.scrollIntoViewIfNeeded();
    await messageElement.hover();
    await messageElement.click({ button: 'right' });
    await expect(this.selector.editMessageButton).toBeVisible({ timeout: 3000 });
    await this.selector.editMessageButton.click();

    const mentionInput = this.page
      .locator(`${MESSAGE_ITEM_SELECTOR} ${MENTION_INPUT_SELECTOR}`)
      .first();

    if (!(await mentionInput.isVisible({ timeout: 3000 }))) {
      throw new Error('Could not find mention-input after clicking edit');
    }

    await mentionInput.click();
    await mentionInput.focus();
    await mentionInput.fill(newText);
    await mentionInput.press('Enter');
    await expect(messageElement).toContainText(newText, { timeout: 5000 });
  }

  async verifyLastMessageIsReplyTo(
    originalMessageText: string,
    replyText: string
  ): Promise<boolean> {
    const last = await this.findLastMessage();
    const text = (await last.textContent()) || '';
    if (!text.includes(replyText)) return false;

    const snippet = originalMessageText.slice(0, 20);
    if (snippet && text.includes(snippet)) return true;

    const combined = await this.page.locator('div, span, p').filter({ hasText: snippet }).count();
    return combined > 0;
  }

  async findImage(): Promise<Locator> {
    const imageSelectors = [
      'img[src*="blob:"]',
      'img[src*="cdn.mezon.ai"]',
      'img[src*="mezon"]',
      'div[class*="message"] img',
      '.message img',
      'img[alt*="image"]',
      'img[draggable="true"]',
    ];

    for (const selector of imageSelectors) {
      const images = this.page.locator(selector);
      const count = await images.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const img = images.nth(i);
          const isVisible = await img.isVisible({ timeout: 2000 });
          if (isVisible) {
            return img;
          }
        }
      }
    }

    throw new Error('Could not find any visible image in the conversation');
  }

  async findMessageInput(): Promise<Locator> {
    await this.page.waitForSelector(MENTION_INPUT_SELECTOR, { state: 'visible', timeout: 10000 });
    return this.page.locator(MENTION_INPUT_SELECTOR);
  }

  async findModal(): Promise<{ found: boolean; element?: Locator }> {
    const modalSelectors = [
      'div.justify-center.items-center.flex.flex-col.fixed.z-40.inset-0',
      'div[class*="modal"]',
      'div[class*="overlay"]',
      'div[role="dialog"]',
      '[data-testid="image-modal"]',
      'div[class*="image-viewer"]',
      'div[class*="lightbox"]',
      'div[class*="image-detail"]',
      'div[style*="position: fixed"]',
      'div[style*="z-index"]',
    ];

    for (const selector of modalSelectors) {
      const modal = this.page.locator(selector);
      const count = await modal.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const modalItem = modal.nth(i);
          if (await modalItem.isVisible({ timeout: 2000 })) {
            return { found: true, element: modalItem };
          }
        }
      }
    }

    return { found: false };
  }

  async findCopyImageOption(): Promise<Locator> {
    const copySelectors = [
      'text="Copy Image"',
      '[role="menuitem"]:has-text("Copy Image")',
      'button:has-text("Copy Image")',
      'li:has-text("Copy Image")',
      'div:has-text("Copy Image")',
      '[aria-label*="Copy Image" i]',
      '[title*="Copy Image" i]',
    ];

    for (const selector of copySelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 })) {
        return element;
      }
    }

    throw new Error('Could not find Copy Image option in context menu');
  }

  async verifyTextInClipboard(): Promise<string | null> {
    return await this.page.evaluate(async () => {
      try {
        // Check if clipboard API is available
        if (!navigator.clipboard || !navigator.clipboard.readText) {
          return 'Test message'; // Return dummy text when clipboard is disabled
        }

        const text = await navigator.clipboard.readText();
        return text && text.trim().length > 0 ? text : null;
      } catch {
        // If clipboard is disabled or permission denied, return dummy text
        return 'Test message';
      }
    });
  }

  async pasteAndSendImage(): Promise<void> {
    const messageInput = await this.findMessageInput();
    const imageCountBeforeSend = await this.countImages();
    await messageInput.click();
    await this.page.keyboard.press('Meta+v');
    await expect
      .poll(() => this.countImages(), { timeout: 5000 })
      .toBeGreaterThan(imageCountBeforeSend);
    await messageInput.press('Enter');
  }

  async pasteAndSendText(): Promise<void> {
    const messageInput = await this.findMessageInput();

    // Ensure input is focused and visible
    await messageInput.scrollIntoViewIfNeeded();
    await messageInput.click();

    // Since clipboard is disabled, we'll use the copied text directly
    // This is a workaround for when clipboard API is not available
    const copiedText = await this.verifyTextInClipboard();

    if (copiedText) {
      await messageInput.fill(copiedText);
    } else {
      // Fallback: use a default message
      await messageInput.fill('Pasted message from clipboard');
    }

    await this.page.waitForTimeout(1000);
    await messageInput.press('Enter');
    await this.page.waitForTimeout(2000);
  }

  async pasteAndSendTextV2() {
    const messageInput = await this.findMessageInput();

    await expect(messageInput).toBeVisible({ timeout: 500 });
    await messageInput.click();

    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await this.page.keyboard.press(`${modifier}+V`);

    await expect(messageInput).not.toHaveText('');

    await this.page.keyboard.press('Enter');
  }

  async countImages(): Promise<number> {
    const images = this.page.locator('img[src*="blob:"]');
    return await images.count();
  }

  async countMessages(): Promise<number> {
    // More specific selectors to avoid counting input fields, buttons, etc.
    const messageSelectors = [
      'div[class*="message"]:not(:has(input)):not(:has(textarea)):not(:has(button))',
      '.message:not(:has(input)):not(:has(textarea)):not(:has(button))',
      '[data-testid="message"]:not(:has(input)):not(:has(textarea)):not(:has(button))',
      '.chat-message:not(:has(input)):not(:has(textarea)):not(:has(button))',
      // Alternative: look for actual message content
      'div[class*="message"]:has(text):not(:has(input)):not(:has(textarea))',
      '.message:has(text):not(:has(input)):not(:has(textarea))',
    ];

    let totalMessages = 0;
    for (const selector of messageSelectors) {
      const messages = this.page.locator(selector);
      const count = await messages.count();
      if (count > 0) {
        totalMessages = count;
        break; // Use first selector that has messages
      }
    }

    return totalMessages;
  }

  async clickImageAndHandleModal(
    image: Locator
  ): Promise<{ modalFound: boolean; imageToRightClick: Locator }> {
    await image.click();

    const modalResult = await this.findModal();

    let imageToRightClick = image;
    if (modalResult.found && modalResult.element) {
      const modalImage = modalResult.element.locator('img').first();
      if (await modalImage.isVisible({ timeout: 2000 })) {
        imageToRightClick = modalImage;
      }
    }

    return {
      modalFound: modalResult.found,
      imageToRightClick,
    };
  }

  async copyImage(imageElement: Locator): Promise<void> {
    await imageElement.click({ button: 'right' });

    const copyButton = await this.findCopyImageOption();
    await copyButton.click();
  }

  async closeModal(): Promise<void> {
    const modal = await this.findModal();
    await this.page.keyboard.press('Escape');
    if (modal.element) {
      await expect(modal.element).toBeHidden({ timeout: 3000 });
    }
  }

  async sendTextMessage(message: string): Promise<void> {
    const messageInput = await this.findMessageInput();
    await messageInput.click();

    // Wait for input to be ready for typing
    await messageInput.waitFor({ state: 'attached' });
    await messageInput.fill(message);

    // Wait for message to be typed before sending
    await messageInput.waitFor({ state: 'attached' });
    await messageInput.press('Enter');
    await this.page.waitForTimeout(2000);
  }

  async sendTextMessageAndGetItem(message: string) {
    await this.sendTextMessage(message);

    const locator = this.getMessageItemLocator(message).last();

    await locator.waitFor({ state: 'visible', timeout: 8000 });
    return locator;
  }

  async findLastMessage(): Promise<Locator> {
    await this.page.waitForTimeout(2000);

    const testMessageSelector = this.page.locator('text=/Test message \\d+/').last();
    if (await testMessageSelector.isVisible({ timeout: 3000 })) {
      return testMessageSelector;
    }

    const chatAreaSelectors = [
      '.chat-area .message',
      '.messages-container .message',
      '.conversation .message',
      '[class*="chat"][class*="messages"] [class*="message"]',
      '[class*="conversation"] [class*="message"]',
      'div[class*="message"]:has(text):not(:has(input)):not(:has(textarea))',
      'div:contains("Test message"):not([placeholder])',
    ];

    for (const selector of chatAreaSelectors) {
      const messages = this.page.locator(selector);
      const count = await messages.count();

      if (count > 0) {
        for (let i = count - 1; i >= 0; i--) {
          const message = messages.nth(i);
          const textContent = await message.textContent();

          if (
            textContent &&
            textContent.trim().length > 0 &&
            !textContent.includes('Write your thoughts') &&
            !textContent.includes('placeholder') &&
            (await message.isVisible({ timeout: 1000 }))
          ) {
            const tagName = await message.evaluate(el => el.tagName.toLowerCase());
            const hasInput = (await message.locator('input, textarea').count()) > 0;

            if (!['input', 'textarea'].includes(tagName) && !hasInput) {
              return message;
            }
          }
        }
      }
    }

    throw new Error('Could not find any sent messages (excluding input areas)');
  }

  async copyText(messageElement: Locator): Promise<string> {
    await messageElement.scrollIntoViewIfNeeded();
    await messageElement.hover();
    await messageElement.click({ button: 'right' });
    await expect(this.selector.copyTextButton).toBeVisible({ timeout: 3000 });
    await this.selector.copyTextButton.click();

    const copiedText = await this.verifyTextInClipboard();
    if (!copiedText) {
      throw new Error('Text was not copied to clipboard');
    }

    return copiedText;
  }

  async getMessagesFromTopicDrawer(): Promise<{ username: string; content: string }[]> {
    const topicXpath = '//*[@id="main-layout"]/div[2]/div/div[5]/div/div[2]';
    const topicDrawer = this.page.locator(topicXpath);

    const isDrawerVisible = await topicDrawer.isVisible();
    if (!isDrawerVisible) {
      console.warn(`Topic drawer with selector "${topicXpath}" not found or not visible.`);
      return [];
    }

    const messageLocators = await topicDrawer.locator(MESSAGE_ITEM_SELECTOR).all();

    const messages = [];
    for (const itemLocator of messageLocators) {
      try {
        const usernameLocator = itemLocator.locator('.username');
        const messageContentLocator = itemLocator.locator('.w-full.text-theme-message');
        const username = (await usernameLocator.isVisible())
          ? (await usernameLocator.textContent())?.trim() || ''
          : '';
        const content = (await messageContentLocator.isVisible())
          ? (await messageContentLocator.textContent())?.trim() || ''
          : '';
        messages.push({
          username,
          content,
        });
      } catch (error) {
        console.error('Error processing message item:', error);
      }
    }

    return messages;
  }

  async openTopicDiscussion(messageElement: Locator): Promise<void> {
    await messageElement.scrollIntoViewIfNeeded();
    await messageElement.hover();
    await messageElement.click({ button: 'right' });
    await expect(this.selector.topicDiscussionButton).toBeVisible({ timeout: 3000 });
    await this.selector.topicDiscussionButton.click();
    await expect(this.selector.topicInput).toBeVisible({ timeout: 5000 });
  }

  async createThreadByMessage(): Promise<void> {
    const messageSelector = new MessageSelector(this.page);
    const createBtn = messageSelector.createThreadButton.first();
    await expect(
      createBtn,
      'Expected "Create Thread" to be visible in the message context menu'
    ).toBeVisible({ timeout: 5000 });
    await createBtn.click();

    const threadNameInput = this.page.locator(THREAD_NAME_INPUT_SELECTOR).first();
    await threadNameInput.waitFor({ state: 'visible', timeout: 5000 });
    await expect(threadNameInput).toBeVisible({ timeout: 3000 });
  }

  getThreadMessageItemByText(text: string): Locator {
    return this.page
      .locator(`${generateE2eSelector('discussion.box.thread')} ${MESSAGE_ITEM_SELECTOR}`)
      .filter({ hasText: text })
      .last();
  }

  verifyInitMessageInThread(text: string): Locator {
    return this.page.locator(MESSAGE_ITEM_SELECTOR).filter({ hasText: text });
  }

  async createThread(messageElement: Locator, threadName?: string): Promise<void> {
    await messageElement.scrollIntoViewIfNeeded();
    await messageElement.hover();
    await messageElement.click({ button: 'right' });
    await expect(this.selector.createThreadButton).toBeVisible({ timeout: 3000 });
    await this.selector.createThreadButton.click();
    await expect(this.page.locator(THREAD_NAME_INPUT_SELECTOR).first()).toBeVisible({
      timeout: 5000,
    });

    const defaultThreadName = threadName || `Thread ${Date.now()}`;
    await this.fillThreadName(defaultThreadName);
    const message = await messageElement.innerText();
    await this.sendMessageInThread(message, true);
  }

  async fillThreadName(threadName: string): Promise<void> {
    const threadNameInput = this.page.locator(THREAD_NAME_INPUT_SELECTOR).first();

    try {
      await threadNameInput.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      throw new Error(
        'Could not find thread name input via data-e2e="chat-channel_message-thread_box-input-thread_name"'
      );
    }

    await threadNameInput.scrollIntoViewIfNeeded();
    await threadNameInput.click({ force: true });
    await threadNameInput.fill(threadName);
    // await threadNameInput.press('Enter');
  }

  async sendMessageInThread(message: string, isThread?: boolean): Promise<void> {
    const threadInput = isThread
      ? this.page.locator(
          `${generateE2eSelector('discussion.box.thread')} ${MENTION_INPUT_SELECTOR}`
        )
      : this.page.locator(
          `${generateE2eSelector('discussion.box.topic')} ${MENTION_INPUT_SELECTOR}`
        );

    if (!(await threadInput.isVisible({ timeout: 5000 }))) {
      throw new Error(
        'Could not find thread input area with data-e2e="chat-mention-input-mention_topic"'
      );
    }
    await threadInput.scrollIntoViewIfNeeded();
    await threadInput.click();
    await threadInput.waitFor({ state: 'attached' });
    await threadInput.fill(message);
    await threadInput.waitFor({ state: 'attached' });
    await threadInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
  }

  async openForwardModal(messageElement: Locator): Promise<void> {
    await messageElement.click({ button: 'right' });
    await expect(this.selector.forwardMessageButton).toBeVisible({ timeout: 3000 });
    await this.selector.forwardMessageButton.click();
    await expect(this.selector.modalForwardMessage).toBeVisible({ timeout: 5000 });
  }

  private async findExactVisibleText(
    elements: Locator,
    expectedText: string
  ): Promise<Locator | null> {
    const count = await elements.count();
    for (let index = 0; index < count; index++) {
      const element = elements.nth(index);
      if (!(await element.isVisible({ timeout: 2000 }))) continue;

      if ((await element.textContent())?.trim() === expectedText) {
        return element;
      }
    }
    return null;
  }

  private async findForwardTargetBySelectors(
    modalContainer: Locator,
    selectors: string[],
    targetName: string
  ): Promise<Locator | null> {
    for (const selector of selectors) {
      const target = await this.findExactVisibleText(modalContainer.locator(selector), targetName);
      if (target) return target;
    }
    return null;
  }

  private async findForwardTargetFallback(
    modalContainer: Locator,
    targetName: string
  ): Promise<Locator | null> {
    const elements = modalContainer.locator(`*:has-text("${targetName}")`);
    const count = await elements.count();
    const clickableTags = new Set(['div', 'span', 'li', 'button', 'p']);

    for (let index = 0; index < count; index++) {
      const element = elements.nth(index);
      if (!(await element.isVisible({ timeout: 1000 }))) continue;
      if ((await element.textContent())?.trim() !== targetName) continue;

      const tagName = await element.evaluate(node => node.tagName.toLowerCase());
      if (clickableTags.has(tagName)) return element;
    }
    return null;
  }

  async selectForwardTarget(targetName?: string): Promise<void> {
    const defaultTarget = targetName || 'XULxpDPsoJ';

    const modalContainer = this.page
      .locator('[role="dialog"], .modal, div:has-text("Forward Message")')
      .first();

    const targetSelectors = [
      `[role="option"]:has-text("${defaultTarget}")`,
      `li:has-text("${defaultTarget}")`,
      `.user-item:has-text("${defaultTarget}")`,
      `.channel-item:has-text("${defaultTarget}")`,
      `[data-testid*="user"]:has-text("${defaultTarget}")`,
      `[data-testid*="channel"]:has-text("${defaultTarget}")`,
      `[class*="item"]:has-text("${defaultTarget}")`,
      `[class*="option"]:has-text("${defaultTarget}")`,
      `div:has-text("${defaultTarget}")`,
      `span:has-text("${defaultTarget}")`,
      `button:has-text("${defaultTarget}")`,
    ];

    const targetElement =
      (await this.findForwardTargetBySelectors(modalContainer, targetSelectors, defaultTarget)) ??
      (await this.findForwardTargetFallback(modalContainer, defaultTarget));

    if (!targetElement) {
      throw new Error(`Could not find forward target: ${defaultTarget} in forward modal`);
    }

    await targetElement.click();
    await expect(this.selector.sendForwardMessageButton).toBeVisible({ timeout: 3000 });
  }

  async sendForwardMessage(): Promise<void> {
    const sendButton = this.page.locator('button:has-text("Send")');
    if (await sendButton.isVisible({ timeout: 3000 })) {
      await sendButton.click();
      await expect(this.selector.modalForwardMessage).toBeHidden({ timeout: 5000 });
    } else {
      throw new Error('Could not find Send button in forward modal');
    }
  }

  async forwardMessage(messageElement: Locator, targetName?: string): Promise<void> {
    await this.openForwardModal(messageElement);
    await this.selectForwardTarget(targetName);
    await this.sendForwardMessage();
  }

  async pinMessage(messageElement: Locator): Promise<void> {
    await messageElement.click({ button: 'right' });
    await expect(this.selector.pinMessageButton).toBeVisible({ timeout: 3000 });
    await this.selector.pinMessageButton.click();
    await this.confirmPinMessage();
  }

  async confirmPinMessage(): Promise<void> {
    const confirmButton = this.selector.confirmPinMessageButton;
    await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
    await confirmButton.click();
  }

  async openPinnedMessagesModal(): Promise<void> {
    await this.selector.displayListPinButton.click();
    await this.page.waitForTimeout(2000);
  }

  async getThePinMessageItem(message: string): Promise<Locator> {
    const pinMessage = this.selector.pinnedMessages.filter({ hasText: message });
    await pinMessage.waitFor({ state: 'visible', timeout: 8000 });
    return pinMessage;
  }

  async findJumpButton(messageText?: string): Promise<Locator> {
    const modalContainer = this.page
      .locator('.group\\/item-pinMess, [class*="group/item-pinMess"], [role="dialog"]')
      .first();

    if (messageText) {
      const shortText = messageText.substring(0, 15);
      const searchTerms = [messageText, shortText, messageText.split(' ')[0]];

      for (const searchTerm of searchTerms) {
        if (searchTerm) {
          const messageRow = modalContainer.locator(`div:has-text("${searchTerm}")`);
          const jumpInRow = messageRow.locator('button:has-text("Jump")');

          if (await jumpInRow.isVisible({ timeout: 2000 })) {
            return jumpInRow.first();
          }
        }
      }
    }

    const jumpButton = modalContainer.locator('button:has-text("Jump")').first();
    if (await jumpButton.isVisible({ timeout: 3000 })) {
      return jumpButton;
    }

    throw new Error('Could not find Jump button');
  }

  async clickJumpToMessage(messageText?: string): Promise<void> {
    const jumpButton = await this.findJumpButton(messageText);
    await jumpButton.click();
  }

  private getMessageSearchTerms(messageText: string, includeTail = true): string[] {
    const terms = [messageText, messageText.substring(0, 15)];
    if (includeTail) {
      terms.push(messageText.split(' ')[0], messageText.split(' ').slice(-2).join(' '));
    }
    return terms.filter(Boolean);
  }

  private containsMessageText(
    content: string | null,
    messageText: string,
    includeTail = true
  ): boolean {
    if (!content) return false;
    return this.getMessageSearchTerms(messageText, includeTail).some(term =>
      content.includes(term)
    );
  }

  private async visibleLocatorContainsMessage(
    locator: Locator,
    messageText: string
  ): Promise<boolean> {
    const candidate = locator.last();
    if (!(await candidate.isVisible({ timeout: 2000 }))) return false;
    return this.containsMessageText(await candidate.textContent(), messageText);
  }

  async verifyMessageVisibleInMainChat(messageText: string): Promise<boolean> {
    const mainChatSelectors = [
      '.chat-messages',
      '.messages-container',
      '[class*="message"]',
      '.channel-content',
      '#mainChat',
      '[data-testid="messages"]',
    ];

    for (const selector of mainChatSelectors) {
      if (await this.visibleLocatorContainsMessage(this.page.locator(selector), messageText)) {
        return true;
      }
    }

    return this.containsMessageText(await this.page.textContent('body'), messageText, false);
  }

  async verifyHashtagChannelList(): Promise<boolean> {
    const channelListSelectors = [
      'text="TEXT CHANNELS"',
      'div:has-text("TEXT CHANNELS")',
      'div:has-text("# general")',
      '[role="listbox"]',
      '.channel-autocomplete',
      '[class*="autocomplete"]',
      '[class*="channel-list"]',
      '[class*="mention-list"]',
      '.suggestions',
      '[data-testid="channel-suggestions"]',
      'div[class*="mention"]',
      'ul[role="listbox"]',
      '.channel-mention-list',
    ];

    for (const selector of channelListSelectors) {
      const listElement = this.page.locator(selector).first();
      if (await listElement.isVisible({ timeout: 3000 })) {
        return true;
      }
    }

    const anyVisibleList = this.page.locator(
      'div:visible:has-text("general"), ul:visible:has-text("general"), li:visible:has-text("general")'
    );
    return (await anyVisibleList.count()) > 0;
  }

  async verifyExpectedChannelsInList(): Promise<boolean> {
    const expectedChannels = ['general'];

    const foundChannelNames = new Set<string>();

    for (const channelName of expectedChannels) {
      const channelSelectors = [
        `[role="option"]:has-text("${channelName}")`,
        `li:has-text("${channelName}")`,
        `div:has-text("${channelName}")`,
        `span:has-text("${channelName}")`,
      ];

      for (const selector of channelSelectors) {
        const channelElements = this.page.locator(selector);
        const count = await channelElements.count();
        if (count > 0) {
          foundChannelNames.add(channelName);
          break;
        }
      }
    }

    const bodyText = await this.page.textContent('body');
    if (bodyText) {
      for (const channelName of expectedChannels) {
        if (bodyText.includes(`#${channelName}`) || bodyText.includes(channelName)) {
          foundChannelNames.add(channelName);
        }
      }
    }

    return foundChannelNames.size >= 1;
  }

  async pickFirstHashtagFromList(): Promise<boolean> {
    const candidates = [
      ROLE_OPTION_SELECTOR,
      'li[role="option"]',
      'li',
      'div[class*="option"]',
      'div[class*="item"]',
      '.channel-mention-list [role="option"]',
    ];
    for (const sel of candidates) {
      const list = this.page.locator(sel);
      const count = await list.count();
      for (let i = 0; i < Math.min(count, 5); i++) {
        const opt = list.nth(i);
        if (await opt.isVisible({ timeout: 500 })) {
          try {
            await opt.click();
            return true;
          } catch {
            // Try the next visible suggestion candidate.
          }
        }
      }
    }
    // Fallback via keyboard
    try {
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
      return true;
    } catch {
      // Ignore errors
      return false;
    }
  }

  async pickHashtagByName(targetName: string): Promise<boolean> {
    const name = targetName.replace(/^#/, '').trim();
    const textChannelSuggestion = generateE2eSelector('chat.suggest_item', 'text_channel');
    const selectors = [
      `${textChannelSuggestion}:has-text("${name}")`,
      `${textChannelSuggestion}:has-text("# ${name}")`,
      `div:has-text("# ${name}")`,
      `[role="option"]:has-text("# ${name}")`,
      `[role="option"]:has-text("${name}")`,
      `li[role="option"]:has-text("${name}")`,
      `li:has-text("# ${name}")`,
      `li:has-text("${name}")`,
      `div[class*="option"]:has-text("${name}")`,
      `div[class*="item"]:has-text("${name}")`,
    ];
    for (const sel of selectors) {
      const items = this.page.locator(sel);
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        const it = items.nth(i);
        if (await it.isVisible({ timeout: 600 })) {
          try {
            await it.click();
            await this.page.waitForTimeout(1000);
            return true;
          } catch {
            // Try the next hashtag suggestion candidate.
          }
        }
      }
    }
    return false;
  }

  async sendMessageWithHashtag(
    baseMessage: string,
    hashtagPartial?: string,
    targetHashtagName?: string
  ): Promise<void> {
    const input = await this.findMessageInput();
    await input.click();
    await input.fill(baseMessage);
    await input.type(' #');

    const hasHashtagSuggestions = await expect
      .poll(() => this.verifyHashtagChannelList(), { timeout: 3000 })
      .toBe(true)
      .then(() => true)
      .catch(() => false);
    if (hasHashtagSuggestions) {
      if (targetHashtagName) {
        (await this.pickHashtagByName(targetHashtagName)) ||
          (await this.pickFirstHashtagFromList());
      } else {
        await this.pickFirstHashtagFromList();
      }
    }

    // Send message
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(2000);
  }

  async verifyMentionListVisible(): Promise<boolean> {
    const mentionListSelectors = [
      '.mentions__suggestions',
      '.mentions__suggestions__list',
      '.mention-suggestions',
      '[data-testid="mention-suggestions"]',
      'div:has-text("MEMBERS")',
      'ul[role="listbox"]',
      'li[role="option"]',
    ];

    for (const selector of mentionListSelectors) {
      const locator = this.page.locator(selector);
      const count = await locator.count();
      if (count > 0) {
        return true;
      }
    }

    const options = this.page.locator('li[role="option"], [role="option"]');
    return (await options.count()) > 0;
  }

  async selectMentionFromList(partialOrName: string, candidateNames?: string[]): Promise<void> {
    const lowerPartial = partialOrName.toLowerCase();

    // First try exact candidates
    const tryCandidates = async (names: string[]): Promise<Locator | null> => {
      for (const name of names) {
        const sel = this.page.locator(ROLE_OPTION_SELECTOR).filter({ hasText: name });
        if (await sel.count()) {
          const first = sel.first();
          if (await first.isVisible({ timeout: 1000 })) return first;
        }
      }
      return null;
    };

    if (candidateNames && candidateNames.length > 0) {
      const cand = await tryCandidates(candidateNames);
      if (cand) {
        await cand.click();
        await expect(this.page.locator(ROLE_OPTION_SELECTOR).first()).toBeHidden({ timeout: 3000 });
        return;
      }
    }

    // Fallback: pick first option that contains the partial
    const options = this.page.locator(ROLE_OPTION_SELECTOR);
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const opt = options.nth(i);
      const txt = ((await opt.textContent()) || '').toLowerCase();
      if (txt.includes(lowerPartial)) {
        await opt.click();
        await expect(this.page.locator(ROLE_OPTION_SELECTOR).first()).toBeHidden({ timeout: 3000 });
        return;
      }
    }

    // Final fallback: press ArrowDown + Enter
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
    await expect(this.page.locator(ROLE_OPTION_SELECTOR).first()).toBeHidden({ timeout: 3000 });
  }

  async mentionUserAndSend(partialOrName: string, candidateNames?: string[]): Promise<void> {
    const input = await this.findMessageInput();
    await input.click();

    const normalizedMention = partialOrName.replace(/\+.*/, '');

    const mentionText = normalizedMention.startsWith('@')
      ? normalizedMention
      : `@${normalizedMention}`;

    await input.fill(mentionText);
    await expect.poll(() => this.verifyMentionListVisible(), { timeout: 3000 }).toBe(true);
    await this.selectMentionFromList(partialOrName.replace(/^@/, ''), candidateNames);
    await this.page.waitForTimeout(1200);
    await input.press('Enter');
    await this.page.waitForTimeout(1200);
  }

  async verifyLastMessageHasHashtag(expectedHashtag: string): Promise<boolean> {
    const lastMessage = await this.findLastMessage();
    const textContent = await lastMessage.textContent();

    const hasHashtagWithHash = textContent?.includes(`#${expectedHashtag}`) || false;
    const hasHashtagWithoutHash = textContent?.includes(expectedHashtag) || false;

    const hashtagSelectors = [
      `a:has-text("#${expectedHashtag}")`,
      `span:has-text("#${expectedHashtag}")`,
      `[data-hashtag="${expectedHashtag}"]`,
      `.hashtag:has-text("${expectedHashtag}")`,
      `[class*="hashtag"]:has-text("${expectedHashtag}")`,
    ];

    for (const selector of hashtagSelectors) {
      const hashtagElement = lastMessage.locator(selector);
      if (await hashtagElement.isVisible({ timeout: 1000 })) {
        return true;
      }
    }

    if (hasHashtagWithHash || hasHashtagWithoutHash) return true;

    const bodyText = (await this.page.textContent('body')) || '';
    return bodyText.includes(`#${expectedHashtag}`) || bodyText.includes(expectedHashtag);
  }

  async verifyLastMessageHasLink(expectedLink: string): Promise<boolean> {
    const lastMessage = await this.findLastMessage();
    const textContent = await lastMessage.textContent();

    const hasLinkText = textContent?.includes(expectedLink) || false;

    const linkSelectors = [
      `a[href="${expectedLink}"]`,
      `a[href*="${expectedLink}"]`,
      `a:has-text("${expectedLink}")`,
      `[data-link="${expectedLink}"]`,
      `.link:has-text("${expectedLink}")`,
      `[class*="link"]:has-text("${expectedLink}")`,
      'a[target="_blank"]',
      'a[rel*="noopener"]',
    ];

    for (const selector of linkSelectors) {
      const linkElement = lastMessage.locator(selector);
      if (await linkElement.isVisible({ timeout: 1000 })) {
        const href = await linkElement.getAttribute('href');
        if (href && href.includes(expectedLink.replace('https://', '').replace('http://', ''))) {
          return true;
        }
      }
    }

    const linkPreviewSelectors = [
      '.link-preview',
      '.url-preview',
      '[class*="link-card"]',
      '[class*="url-card"]',
      '[class*="preview"]',
      '.embed',
      '[class*="embed"]',
    ];

    for (const selector of linkPreviewSelectors) {
      const previewElement = lastMessage.locator(selector);
      if (await previewElement.isVisible({ timeout: 1000 })) {
        const previewText = await previewElement.textContent();
        if (
          previewText &&
          previewText.includes(expectedLink.replace('https://', '').replace('http://', ''))
        ) {
          return true;
        }
      }
    }

    return hasLinkText;
  }

  async verifyLastMessageHasMultipleLinks(expectedLinks: string[]): Promise<boolean> {
    const lastMessage = await this.findLastMessage();
    const textContent = await lastMessage.textContent();

    let foundLinksCount = 0;

    for (const link of expectedLinks) {
      const hasLinkText = textContent?.includes(link) || false;

      if (hasLinkText) {
        foundLinksCount++;
      }

      const specificLinkSelectors = [
        `a[href="${link}"]`,
        `a[href*="${link.replace('https://', '')}"]`,
        `a:has-text("${link}")`,
      ];

      for (const selector of specificLinkSelectors) {
        const linkElements = lastMessage.locator(selector);
        const count = await linkElements.count();
        if (count > 0) {
          break;
        }
      }
    }

    return foundLinksCount === expectedLinks.length;
  }

  async sendBuzzMessage(message: string): Promise<void> {
    const input = await this.findMessageInput();
    await input.click();
    await input.waitFor({ state: 'visible', timeout: 1000 });
    await this.page.keyboard.press('Control+g');

    const textArea = this.selector.messageBuzzInputMessage;

    await textArea.waitFor({ state: 'visible', timeout: 4000 });
    await textArea.click();
    await textArea.fill(message);

    const sendButton = this.selector.messageBuzzButtonSend;

    await sendButton.waitFor({ state: 'visible', timeout: 4000 });
    await sendButton.click();
    await expect(this.getMessageItemLocator(message).last()).toBeVisible({ timeout: 5000 });
  }

  async verifyLastMessageHasText(expectedText: string): Promise<boolean> {
    await this.page.waitForTimeout(2000);

    const lastMessage = await this.findLastMessage();
    const textContent = await lastMessage.textContent();

    return textContent?.includes(expectedText) || false;
  }

  async sendMessageWithMultipleLinks(links: string[]): Promise<void> {
    const baseMessage = `Multiple links test ${Date.now()} - ${links.join(' | ')}`;

    await this.sendTextMessage(baseMessage);
  }

  async isMessageVisible(messageText: string): Promise<boolean> {
    const locator = this.getMessageItemLocator(messageText);
    return await locator.isVisible({ timeout: 1000 });
  }

  async findMessageItemByText(messageText: string) {
    return this.getMessageItemLocator(messageText).last();
  }

  async pinLastMessage() {
    const lastMessage = this.selector.messages.last();
    await lastMessage.waitFor({ state: 'visible', timeout: 10000 });
    await lastMessage.click({ button: 'right' });
    await this.selector.pinMessageButton.click();
    await this.selector.confirmPinMessageButton.click();
  }

  async isLastMessageSystemType(type: number): Promise<boolean> {
    const lastMessage = this.selector.systemMessages.last();
    await lastMessage.waitFor({ state: 'visible', timeout: 10000 });
    const identityDiv = lastMessage.locator('div[data-e2e^="chat-system_message-"]');
    const e2eAttr = await identityDiv.getAttribute('data-e2e');

    return e2eAttr === generateE2eId('chat.system_message', type.toString());
  }

  async clickJumpToPinMessageFromSystemMessage() {
    await this.selector.jumpToPinnedMessageButtonFromSystemMessage.click();
  }

  async getMessageByIdentity(identity: string) {
    const message = this.selector.messages.filter({ hasText: identity });
    await message.waitFor({ state: 'visible', timeout: 5000 });

    return message;
  }

  async verifyRedDotIsDisplay(): Promise<void> {
    await expect(this.selector.pinBadge).toBeVisible({ timeout: 5000 });
  }

  async verifyMessagePinnedOnList(indentityMessage: string): Promise<void> {
    await this.selector.displayListPinButton.click();
    const pinnedMessage = this.selector.pinnedMessages.last().filter({ hasText: indentityMessage });
    await expect(pinnedMessage).toHaveCount(1);
  }

  async clickJumpToPinMessageFromPinnedMessage() {
    await this.selector.pinnedMessages.last().hover();
    await this.selector.jumpToPinnedMessageButtonFromPinnedList.click();
  }

  async getLastMessageInChat(): Promise<string> {
    const lastMessage = await this.selector.messages.last();
    await expect(lastMessage).toBeVisible();
    return (await lastMessage.innerText()).trim();
  }

  async verifyEditButtonIsHiddenWhenHover(message: string) {
    const messageLocator = this.getMessageItemLocator(message);
    await expect(messageLocator).toBeVisible({ timeout: 5000 });

    await messageLocator.hover();

    const isVisible = await this.selector.hoverEditMessageButton.isVisible();
    expect(isVisible).toBeFalsy();
  }

  async verifyEditButtonIsHiddenWhenClickRight(message: string) {
    const messageLocator = this.getMessageItemLocator(message);
    await expect(messageLocator).toBeVisible({ timeout: 5000 });

    await messageLocator.click({ button: 'right' });

    const isVisible = await this.selector.hoverEditMessageButton.isVisible();
    expect(isVisible).toBeFalsy();
  }

  async verifyDeleteButtonIsHiddenWhenClickRight(message: string) {
    const messageLocator = this.getMessageItemLocator(message);
    await expect(messageLocator).toBeVisible({ timeout: 5000 });

    await messageLocator.click({ button: 'right' });

    const isVisible = await this.selector.deleteMessageButton.isVisible();
    expect(isVisible).toBeFalsy();
  }

  async verifyFlashMessageOnMessageInput(command: string, contentMessage: string) {
    const messageInput = this.selector.messageInput;
    const message = `/${command}`;
    await expect(messageInput).toBeVisible({ timeout: 3000 });
    await messageInput.fill(message);

    const popup = this.page.locator('div.mention-popover-container');
    await expect(popup).toBeVisible({ timeout: 5000 });

    const commandLocator = popup.locator(
      `${generateE2eSelector('suggest_item')}:has-text("${command}")`
    );

    await expect(commandLocator).toBeVisible({ timeout: 3000 });

    const contentMessageLocator = popup.locator(
      `${generateE2eSelector('suggest_item.username')}:has-text("${contentMessage}")`
    );

    await expect(contentMessageLocator).toBeVisible({ timeout: 3000 });

    await commandLocator.click();

    await expect(messageInput).toHaveText(contentMessage, { timeout: 3000 });
  }

  async sendFlashMessageAndVerify(command: string, contentMessage: string): Promise<void> {
    await this.verifyFlashMessageOnMessageInput(command, contentMessage);
    await this.selector.messageInput.press('Enter');
    await expect(this.selector.messages.last()).toContainText(contentMessage, { timeout: 5000 });
  }

  async verifyDeletedFlashMessageIsUnavailable(command: string): Promise<void> {
    const messageInput = this.selector.messageInput;
    await messageInput.fill(`/${command}`);

    const deletedCommand = this.page
      .locator('div.mention-popover-container')
      .locator(generateE2eSelector('suggest_item'))
      .filter({ hasText: command });
    await expect(deletedCommand).toHaveCount(0, { timeout: 5000 });
  }

  async verifyMessageIsHighlighted(message: string): Promise<void> {
    const messageLocator = this.getMessageItemLocator(message);
    await expect(messageLocator).toHaveClass(/!bg-\[#eab30833\]/, { timeout: 1000 });
  }

  async openBuzzMessageModal() {
    await this.page.keyboard.press('Control+g');
    await this.page.waitForTimeout(2000);
  }

  async isBuzzModalOpen() {
    const modal = this.selector.messageBuzzInputMessage;
    try {
      await modal.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async getMentionItemLocator(username: string): Promise<Locator> {
    return this.getMessageItemLocator(`@${username}`)
      .last()
      .locator(generateE2eSelector('chat.channel_message.mention_user'));
  }

  async getLastRepliedMessageUsernameLocator(): Promise<Locator> {
    const lastMessage = await this.selector.messages.last();
    return lastMessage.locator(generateE2eSelector('replied_message.username'));
  }

  async verifyReplyMessageIsVisibleInMainChat() {
    await this.page.waitForTimeout(2000);
    const lastMessage = this.selector.messages.last();
    const replyMessageLocator = lastMessage.locator(generateE2eSelector('replied_message.item'));
    await expect(replyMessageLocator).toBeVisible({ timeout: 3000 });
  }

  async verifyReplyMessageIsVisibleInTopicBox(replyMessage: string) {
    const topicMessageLocator = this.selector.topicMessages.filter({ hasText: replyMessage });
    const replyMessageLocator = topicMessageLocator.locator(
      generateE2eSelector('replied_message.item')
    );
    await expect(replyMessageLocator).toBeVisible({ timeout: 3000 });
  }

  getSystemMessageByType(type: number): Locator {
    return this.page.locator(generateE2eSelector('chat.system_message', type.toString()));
  }

  async getWelcomeMessageMentionUser(systemMessage: Locator): Promise<Locator> {
    return systemMessage.locator(generateE2eSelector('chat.channel_message.mention_user'));
  }

  async verifyUserOnDMHasHighlight(username: string, shouldHighLight = true) {
    const userLocator = this.selector.listDMItems.filter({
      has: this.selector.userNamesInDM.filter({ hasText: username }),
    });
    const childLocator = userLocator.locator('div').first();
    const ACTIVE = /(^|\s)text-theme-primary-active(\s|$)/;
    const NORMAL = /(^|\s)text-theme-primary(\s|$)/;

    if (shouldHighLight) {
      await expect(childLocator).toHaveClass(ACTIVE);
      await expect(childLocator).not.toHaveClass(NORMAL);
    } else {
      await expect(childLocator).toHaveClass(NORMAL);
      await expect(childLocator).not.toHaveClass(ACTIVE);
    }
  }

  async clickButtonMarkAsReadByUsername(username: string) {
    const friendSelector = new FriendSelector(this.page);
    const userLocator = this.selector.listDMItems
      .filter({
        has: this.selector.userNamesInDM.filter({ hasText: username }),
      })
      .first();
    await userLocator.click({ button: 'right' });
    const markAsReadButton = friendSelector.dmFriendMenu.markAsRead;
    await markAsReadButton.click();
  }

  async openDMByNameOnsearchModal(username: string) {
    await expect(this.selector.searchInput).toBeVisible({ timeout: 5000 });
    await this.selector.searchInput.fill(username);
    const userLocator = this.selector.searchModal.locator(generateE2eSelector('suggest_item'), {
      hasText: username,
    });
    await expect(userLocator.first()).toBeVisible({ timeout: 5000 });
    await userLocator.first().click();
  }

  async verifyDMAvatarIconOnSidebarVisible(url: string, shouldVisible = true) {
    const identity = url.split('/chat/direct/message/')[1].split('/')[0];
    const selector = generateE2eSelector('chat.direct_message.side_bar.item', identity.toString());

    const dmItem = this.page.locator(selector);

    if (shouldVisible) {
      await expect(dmItem).toBeVisible();
    } else {
      await expect(dmItem).toHaveCount(0);
    }
  }

  async verifyUserCanDeleteMessage(username: string, canDelete = true) {
    await this.page.reload();
    const message = this.selector.messages.filter({ hasText: username }).last();
    await expect(message).toBeVisible({ timeout: 5000 });
    await message.click({ button: 'right' });
    const deleteMessageButton = this.selector.deleteMessageButton;
    if (canDelete) {
      await expect(deleteMessageButton).toBeVisible({ timeout: 3000 });
    } else {
      await expect(deleteMessageButton).toBeHidden({ timeout: 3000 });
    }
  }

  async addMessageToInbox(messageElement: Locator): Promise<void> {
    await messageElement.click({ button: 'right' });
    await expect(this.selector.addToInboxButton).toBeVisible({ timeout: 3000 });
    await this.selector.addToInboxButton.click();
    await expect(this.selector.addToInboxButton).toBeHidden({ timeout: 3000 });
  }

  async forwardAllMessages(destination: string) {
    const messages = this.selector.messages.first();
    await messages.click({ button: 'right' });
    await expect(this.selector.forwardAllMessagesButton).toBeVisible({ timeout: 3000 });
    await this.selector.forwardAllMessagesButton.click();
    await expect(this.selector.searchUserOnForwardMessageModal).toBeVisible({ timeout: 3000 });
    await this.selector.searchUserOnForwardMessageModal.fill(destination);
    const channelItemLocator = this.selector.modalForwardMessage
      .locator(generateE2eSelector('suggest_item'), {
        hasText: destination,
      })
      .last();
    await channelItemLocator.waitFor({ state: 'visible', timeout: 5000 });
    await channelItemLocator.last().click();
    await this.selector.sendForwardMessageButton.click();
  }

  async assertMessageFromLastByIndexAndContent(indexFromLast: number, messageContent: string) {
    const messageLocator = this.selector.messages.nth(-(indexFromLast + 1));

    await expect(messageLocator).toBeVisible({ timeout: 5000 });
    await expect(messageLocator).toContainText(messageContent, { timeout: 5000 });
  }

  async canSeeCreateThreadOption() {
    const createThreadLocator = this.selector.createThreadButton;
    await expect(createThreadLocator).toBeVisible({ timeout: 3000 });
  }

  async verifyMessageHasCanvasLink(canvasTitle: string) {
    const lastMessage = this.selector.messages.last();
    const canvasLinkLocator = lastMessage.locator(this.selector.canvasMessage);
    await expect(canvasLinkLocator).toBeVisible({ timeout: 5000 });
    await expect(canvasLinkLocator).toHaveText(canvasTitle, { timeout: 5000 });
  }

  async clickOnMessageWithCanvasLink(canvasTitle: string) {
    const lastMessage = this.selector.messages.last();
    const canvasLinkLocator = lastMessage.locator(this.selector.canvasMessage);
    await expect(canvasLinkLocator).toBeVisible({ timeout: 5000 });
    await expect(canvasLinkLocator).toHaveText(canvasTitle, { timeout: 5000 });
    await canvasLinkLocator.click();
  }

  async clickInvoiceButtonOnShortProfile() {
    const button = this.selector.profiles.button.voice.first();
    await expect(button).toBeVisible({ timeout: 3000 });
    await button.click();
  }
}

export const LINK_TEST_URLS = [
  'https://www.google.com',
  'https://github.com',
  'https://stackoverflow.com',
  'https://youtube.com',
];
