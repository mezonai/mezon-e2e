import { expect, Locator, Page } from '@playwright/test';
import { MessageTopicHelpers } from './MessageTopicHelpers';

export abstract class MessageEmojiHelpers extends MessageTopicHelpers {
  constructor(page: Page) {
    super(page);
  }

  abstract findMessageInput(): Promise<Locator>;
  abstract countMessages(): Promise<number>;
  abstract findLastMessage(): Promise<Locator>;

  async findEmojiSearchInput(): Promise<Locator> {
    const selectors = [
      'input[type="text"][placeholder*=":" i]',
      'input[placeholder*=":" i]',
      'input[placeholder=":lion_face:"]',
      '.emoji-picker input[type="text"]',
      '[role="dialog"] input[type="text"]',
      'input.bg-theme-input',
      'input.outline-none.bg-theme-input',
      'div:has-text("Emojis") >> input[type="text"]',
    ];

    const containers = this.page.locator('.emoji-picker, [role="dialog"]');
    const containerCount = await containers.count();
    for (let index = 0; index < Math.max(1, containerCount); index++) {
      const scope = containerCount > 0 ? containers.nth(index) : this.page.locator('body');
      for (const selector of selectors) {
        const input = scope.locator(selector).first();
        if (await input.isVisible({ timeout: 1000 })) return input;
      }
    }

    const frames = this.page.locator('iframe');
    for (let index = 0; index < (await frames.count()); index++) {
      const input = this.page
        .frameLocator('iframe')
        .nth(index)
        .locator('input[type="text"], input.bg-theme-input, input[placeholder]')
        .first();
      try {
        if (await input.isVisible({ timeout: 1000 })) return input;
      } catch {
        // Continue searching inputs in the remaining frames.
      }
    }
    throw new Error('Could not find emoji search input');
  }

  async searchEmoji(term: string): Promise<void> {
    const input = await this.findEmojiSearchInput();
    await input.click();
    await input.fill(term);
    await expect(input).toHaveValue(term);
  }

  async sendMessageWithEmojiPicker(baseMessage: string, emojiQuery: string): Promise<void> {
    const input = await this.findMessageInput();
    await input.click();
    await input.fill(`${baseMessage} ${emojiQuery}`);

    const suggestionSelectors = [
      '.emoji-suggestions',
      '.emoji-picker',
      '[role="listbox"]',
      '.mentions__suggestions',
      'div:has-text("😀")',
      'div:has-text("😊")',
      'div:has-text("🙂")',
      '[class*="emoji"]',
      'button:has(img[alt*="smile"])',
      'div[class*="suggestion"]:has(img)',
      '.suggestion-item:has(img)',
    ];

    let selectedSuggestion = false;
    for (const selector of suggestionSelectors) {
      const firstSuggestion = this.page.locator(selector).first();
      if (!(await firstSuggestion.isVisible({ timeout: 2000 }))) continue;
      await firstSuggestion.click();
      selectedSuggestion = true;
      break;
    }

    if (!selectedSuggestion) {
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
    }

    await input.press('Enter');
    if (await this.didMessageBecomeVisible(baseMessage)) return;

    await input.click();
    await input.press('Enter');
    await expect(this.selector.messages.filter({ hasText: baseMessage }).last()).toBeVisible({
      timeout: 5000,
    });
  }

  private async didMessageBecomeVisible(messageText: string): Promise<boolean> {
    try {
      await expect(this.selector.messages.filter({ hasText: messageText }).last()).toBeVisible({
        timeout: 3000,
      });
      return true;
    } catch {
      return false;
    }
  }

  async verifyLastMessageHasEmoji(expected?: string): Promise<boolean> {
    const lastMessage = await this.findLastMessage();
    const text = (await lastMessage.textContent()) || '';
    if (expected && text.includes(expected)) return true;
    if (await lastMessage.locator('img[alt*=":" i], img[alt*="emoji" i]').count()) return true;
    return /[\p{Emoji}\uFE0F]/u.test(text);
  }
}
