import { expect, Locator, Page } from '@playwright/test';
import { MessageEmojiHelpers } from './MessageEmojiHelpers';

const ARIA_LABEL_ATTRIBUTE = 'aria-label';

export abstract class MessageReactionHelpers extends MessageEmojiHelpers {
  constructor(page: Page) {
    super(page);
  }

  async findAddReactionButton(messageElement: Locator): Promise<Locator | null> {
    await messageElement.hover();
    const selectors = [
      'button[aria-label*="Add reaction" i]',
      'button[title*="Add reaction" i]',
      'button[aria-label*="React" i]',
      'button[title*="React" i]',
      'button:has([data-testid*="reaction"])',
      'button:has([class*="reaction"])',
      '.message-actions button[aria-label*="emoji" i]',
      '.hover-actions button[aria-label*="emoji" i]',
      'button:has(svg):has([aria-label*="emoji" i])',
      'button:has(span):has-text("😀")',
      'button:has(span):has-text("🙂")',
      'button:has(span):has-text("+")',
      '.message-hover-actions button',
      '.message-actions button',
    ];

    for (const selector of selectors) {
      const buttons = messageElement.locator(selector);
      for (let index = 0; index < (await buttons.count()); index++) {
        const button = buttons.nth(index);
        if (!(await button.isVisible({ timeout: 500 }))) continue;
        const ariaLabel = ((await button.getAttribute(ARIA_LABEL_ATTRIBUTE)) || '').toLowerCase();
        const title = ((await button.getAttribute('title')) || '').toLowerCase();
        const text = (await button.textContent()) || '';
        if (
          ariaLabel.includes('reaction') ||
          ariaLabel.includes('react') ||
          title.includes('reaction') ||
          title.includes('react') ||
          ariaLabel.includes('emoji') ||
          title.includes('emoji') ||
          text.includes('😀') ||
          text.includes('🙂') ||
          text.includes('+')
        ) {
          return button;
        }
      }
    }

    const globalSelectors = [
      'button[aria-label*="Add reaction" i]',
      'button[aria-label*="React" i]',
      'button:has([class*="reaction"])',
      'button:has([data-testid*="reaction"])',
    ];
    for (const selector of globalSelectors) {
      const button = this.page.locator(selector).first();
      if (await button.isVisible({ timeout: 500 })) return button;
    }
    return null;
  }

  async tryClickQuickReaction(messageElement: Locator, emojis: string[]): Promise<string | null> {
    await messageElement.hover();
    await this.page.waitForTimeout(400);

    for (const emoji of emojis) {
      const quick = messageElement.locator(`button:has-text("${emoji}")`).first();
      if (await quick.isVisible({ timeout: 300 })) {
        await quick.click();
        await this.page.waitForTimeout(600);
        return emoji;
      }
    }
    for (const emoji of emojis) {
      const quick = messageElement.locator(`button[aria-label*="${emoji}"]`).first();
      if (await quick.isVisible({ timeout: 300 })) {
        await quick.click();
        await this.page.waitForTimeout(600);
        return emoji;
      }
    }
    return null;
  }

  async openEmojiPicker(addButton: Locator): Promise<void> {
    await addButton.click();
    await this.findEmojiSearchInput();
  }

  private getEmojiCandidateSelectors(term: string): string[] {
    return [
      `button:has-text("${term}")`,
      `div:has-text("${term}")`,
      `span:has-text("${term}")`,
      `[aria-label*="${term}" i]`,
      `[title*="${term}" i]`,
      `img[alt*="${term}" i]`,
      `.emoji:has-text("${term}")`,
      `[data-emoji*="${term}" i]`,
    ];
  }

  protected async clickFirstVisibleCandidate(elements: Locator): Promise<boolean> {
    for (let index = 0; index < (await elements.count()); index++) {
      const element = elements.nth(index);
      if (!(await element.isVisible({ timeout: 500 }))) continue;
      try {
        await element.click();
        return true;
      } catch {
        // Try the next visible emoji candidate.
      }
    }
    return false;
  }

  async selectEmojiFromPicker(emojis: string[]): Promise<string | null> {
    const emojiMap: Record<string, string[]> = {
      '🙂': ['😊', '😀', '🙂', 'grinning', 'smiling', 'smile'],
      '😂': ['😂', '😆', 'joy', 'laugh', 'tears'],
      '👍': ['👍', 'thumbs', 'up', 'like'],
      '💯': ['💯', '100', 'hundred'],
      '😊': ['😊', '😀', '🙂', 'grinning', 'smiling'],
    };
    for (const targetEmoji of emojis) {
      for (const term of emojiMap[targetEmoji] || [targetEmoji]) {
        for (const selector of this.getEmojiCandidateSelectors(term)) {
          if (await this.clickFirstVisibleCandidate(this.page.locator(selector))) {
            return targetEmoji;
          }
        }
      }
    }

    const fallbackSelectors = [
      'button[class*="emoji"]',
      'div[class*="emoji"]',
      'span[class*="emoji"]',
      '[role="button"]:has(img)',
      'button:has(span):visible',
    ];
    for (const selector of fallbackSelectors) {
      if (await this.clickFirstVisibleCandidate(this.page.locator(selector))) return emojis[0];
    }
    return null;
  }

  async verifyReactionOnMessage(_messageElement: Locator, emojis: string[]): Promise<boolean> {
    if (emojis.length === 0) return false;
    const selectors = [
      'button[class*="reaction"]',
      'div[class*="reaction"]',
      'span[class*="reaction"]',
      'button:has-text("😂")',
      'button:has-text("👍")',
      'button:has-text("💯")',
      'button:has(img)',
      'button:has(span):has-text("1")',
      'button:has(span):has-text("2")',
      'button:has(span):has-text("3")',
      '[data-emoji]',
    ];
    for (const selector of selectors) {
      if ((await this.page.locator(selector).count()) > 0) return true;
    }
    return false;
  }

  async reactToMessage(
    messageElement: Locator,
    preferredEmojis: string[] = ['🙂', '💯', '👍', '😊', '😂']
  ): Promise<string | null> {
    await messageElement.hover();
    await this.page.waitForTimeout(1500);

    const quick = await this.tryClickQuickReaction(messageElement, preferredEmojis);
    if (quick) {
      return quick;
    }

    const addBtn = await this.findAddReactionButton(messageElement);
    if (addBtn) {
      await addBtn.click();
      await this.page.waitForTimeout(1500);

      const picked = await this.selectEmojiFromPicker(preferredEmojis);
      if (picked) {
        return picked;
      }
    }

    await messageElement.click({ button: 'right' });
    await this.page.waitForTimeout(1000);

    const contextReactionSelectors = [
      'text="Add Reaction"',
      'text="React"',
      '[role="menuitem"]:has-text("Reaction")',
      '[role="menuitem"]:has-text("React")',
      'button:has-text("Reaction")',
      'div:has-text("Add Reaction")',
    ];

    for (const selector of contextReactionSelectors) {
      const contextReaction = this.page.locator(selector).first();
      if (await contextReaction.isVisible({ timeout: 1000 })) {
        await contextReaction.click();
        await this.page.waitForTimeout(1500);

        const picked = await this.selectEmojiFromPicker(preferredEmojis);
        if (picked) {
          return picked;
        }
      }
    }

    return null;
  }

  private async searchAndClickSmileEmoji(searchTerm: string): Promise<string | null> {
    try {
      const searchInput = await this.findEmojiSearchInput();
      await searchInput.click();
      await searchInput.fill(searchTerm);
      await expect(searchInput).toHaveValue(searchTerm);
      const selectors = [
        'img[alt*="smile" i]',
        'img[alt*="grinning" i]',
        'button:has(img[alt*="smile" i])',
        'button:has(img[alt*="grinning" i])',
        '[aria-label*="smile" i]',
        '[aria-label*="grinning" i]',
        'button[aria-label*="smile" i]',
        '.emoji-picker img:visible',
      ];
      for (const selector of selectors) {
        if (await this.clickFirstVisibleCandidate(this.page.locator(selector))) return '😀';
      }
    } catch {
      // The caller will try the context-menu strategy.
    }
    return null;
  }

  private async searchAndPickFromContextMenu(
    messageElement: Locator,
    searchTerm: string
  ): Promise<string | null> {
    await messageElement.click({ button: 'right' });
    const addReactionItem = this.page
      .getByRole('menuitem', { name: /Add Reaction|React/i })
      .first();
    if (!(await addReactionItem.isVisible({ timeout: 2000 }))) return null;

    try {
      await addReactionItem.click();
      await this.findEmojiSearchInput();
      await this.searchEmoji(searchTerm);
      return this.selectEmojiFromPicker(['😀', '😊', '🙂']);
    } catch {
      return null;
    }
  }

  async searchAndPickEmojiFromPicker(
    messageElement: Locator,
    searchTerm: string
  ): Promise<string | null> {
    await messageElement.hover();
    const quickReaction = await this.tryClickQuickReaction(messageElement, ['😀', '😊', '🙂']);
    if (quickReaction) return quickReaction;

    const addButton = await this.findAddReactionButton(messageElement);
    if (addButton) {
      await this.openEmojiPicker(addButton);
      const pickerResult = await this.searchAndClickSmileEmoji(searchTerm);
      if (pickerResult) return pickerResult;
    }
    return this.searchAndPickFromContextMenu(messageElement, searchTerm);
  }

  private async dismissVisibleContextMenu(): Promise<void> {
    const visibleMenu = this.page.locator('[role="menu"]:visible').first();
    if (!(await visibleMenu.isVisible())) return;
    await this.page.keyboard.press('Escape');
    await expect(visibleMenu).toBeHidden({ timeout: 2000 });
  }
}
