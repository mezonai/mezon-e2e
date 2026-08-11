import { expect, Locator, Page } from '@playwright/test';
import { MessageReactionHelpers } from './MessageReactionHelpers';

export abstract class MessageContentHelpers extends MessageReactionHelpers {
  constructor(page: Page) {
    super(page);
  }

  abstract findMessageInput(): Promise<Locator>;
  abstract countMessages(): Promise<number>;

  async clickMemberInList(memberName: string): Promise<void> {
    const selectors = [
      `div[class*="cursor-pointer"][class*="flex"][class*="items-center"]:has-text("${memberName}")`,
      `div[class*="cursor-pointer"]:has-text("${memberName}")`,
      `div:has-text("${memberName}")`,
      `*:has-text("${memberName}"):visible`,
    ];

    for (const selector of selectors) {
      const member = this.page.locator(selector).first();
      if (await member.isVisible({ timeout: 2000 })) {
        await member.click();
        return;
      }
    }
    throw new Error(`Member ${memberName} not found`);
  }

  async sendMessageFromShortProfile(message: string): Promise<void> {
    const selectors = [
      'input[placeholder*="Message @"]',
      'input[class*="w-full"][class*="border-theme-primary"][class*="text-theme-primary"]',
      'input[class*="bg-theme-contextify"]',
      'input.w-full.border-theme-primary',
      'input[type="text"][class*="border-theme-primary"]',
    ];

    for (const selector of selectors) {
      const input = this.page.locator(selector).first();
      if (await input.isVisible({ timeout: 3000 })) {
        const messageCountBeforeSend = await this.countMessages();
        await input.click();
        await input.fill(message);
        await input.press('Enter');
        await expect.poll(() => this.countMessages()).toBeGreaterThan(messageCountBeforeSend);
        return;
      }
    }
    throw new Error('Short profile message input not found');
  }

  async verifyMarkdownMessage(originalMessage: string): Promise<boolean> {
    const codeContent = originalMessage.replace(/```/g, '').trim();
    const codeBlocks = this.page.locator(
      'pre, code, .code-block, [class*="code"], .markdown-code, .hljs'
    );

    for (let index = 0; index < (await codeBlocks.count()); index++) {
      const text = await codeBlocks.nth(index).textContent();
      if (text?.includes(codeContent)) return true;
    }

    return (await this.page.textContent('body'))?.includes(codeContent) ?? false;
  }

  generateLongMessage(wordCount: number): string {
    const baseText = 'This is a very long message to test file conversion functionality. ';
    return `Long message test ${Date.now()} - ${baseText.repeat(wordCount)}`;
  }

  async sendLongMessageAndCheckFileConversion(longMessage: string): Promise<boolean> {
    const input = await this.findMessageInput();
    await input.click();
    await input.fill(longMessage);

    const conversionDetected = await this.isAnyVisible(
      [
        'text="Convert to file"',
        'text="Send as file"',
        'text="Too long"',
        'text="txt"',
        'text=".txt"',
        'button:has-text("Send as file")',
        'div:has-text("Convert to file")',
        'div:has-text("Send as txt")',
        '[class*="file-conversion"]',
        '.file-indicator',
        'span:has-text("txt")',
        'div:has-text("File will be sent")',
      ],
      3000
    );

    await input.click();
    await input.press('Enter');

    const sendClicked = await this.clickFirstVisible([
      'button[aria-label*="send" i]',
      'button[title*="send" i]',
      'button:has-text("Send")',
      'button:has(svg[data-icon*="paper" i])',
      'button:has(svg[aria-label*="send" i])',
      'button:has(svg):near(:text("txt"))',
    ]);
    if (!sendClicked) await input.press('Enter');

    const attachmentVisible = await this.isAnyVisible(
      [
        '.file-attachment',
        '[class*="attachment"]',
        'div:has-text(".txt")',
        'a[href*=".txt"]',
        'span:has-text("txt")',
        '.message-file',
        '[class*="file-message"]',
        'div:has-text("Download")',
        'a[download]',
        '[class*="file-item"]',
      ],
      3000
    );
    if (attachmentVisible) return true;

    const pageContent = await this.page.textContent('body');
    return Boolean(
      pageContent?.includes('.txt') ||
        pageContent?.includes('Download') ||
        pageContent?.includes('attachment') ||
        conversionDetected
    );
  }

  private async isAnyVisible(selectors: string[], timeout: number): Promise<boolean> {
    for (const selector of selectors) {
      if (await this.page.locator(selector).first().isVisible({ timeout })) return true;
    }
    return false;
  }

  private async clickFirstVisible(selectors: string[]): Promise<boolean> {
    for (const selector of selectors) {
      const button = this.page.locator(selector).first();
      if (!(await button.isVisible({ timeout: 500 }))) continue;
      try {
        await button.click();
        return true;
      } catch {
        // Try the next candidate.
      }
    }
    return false;
  }
}
