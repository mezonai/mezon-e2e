import { Page } from '@playwright/test';
import { MessageTestHelpers } from './messageHelpers';

export class DualUserTestHelpers {
  constructor(private page: Page) {}

  async openLandingAndClickLogin() {
    await this.page.goto('https://dev-mezon.nccsoft.vn/');
    await this.page.waitForLoadState('domcontentloaded');

    const selectors = [
      'button:has-text("Login")',
      'a:has-text("Login")',
      'header >> text=Login',
      'nav >> text=Login',
    ];

    for (let i = 0; i < 3; i += 1) {
      if (this.page.url().includes('account.mezon.ai')) break;
      for (const s of selectors) {
        const btn = this.page.locator(s).first();
        try {
          if (await btn.isVisible({ timeout: 2000 })) {
            await Promise.all([this.page.waitForLoadState('networkidle'), btn.click()]);
            await this.page.waitForTimeout(500);
            break;
          }
        } catch {
          // Element might not exist or be clickable, continue
        }
      }
    }
  }

  async loginWithEmail(email: string, otp?: string, isAutoOtp = false) {
    await this.openLandingAndClickLogin();

    const emailInput = this.page
      .locator('input[type="email"], input[placeholder*="email" i], input[name*="email" i]')
      .first();
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill(email);

    const sendOtp = this.page
      .locator('button:has-text("Send OTP"), button:has-text("Continue"), button[type="submit"]')
      .first();
    if (await sendOtp.isVisible({ timeout: 5000 })) {
      await sendOtp.click();
    }

    if (isAutoOtp && otp) {
      const otpInput = this.page
        .locator('input[placeholder*="otp" i], input[placeholder*="code" i], input[maxlength="6"]')
        .first();
      await otpInput.waitFor({ state: 'visible', timeout: 15000 });
      await otpInput.fill(otp);
    }

    // Wait for redirect
    const start = Date.now();
    const timeout = isAutoOtp ? 15000 : 90000;
    while (Date.now() - start < timeout) {
      if (this.page.url().includes('dev-mezon.nccsoft.vn')) break;
      await this.page.waitForTimeout(isAutoOtp ? 500 : 1000);
    }
  }

  async ensureInClan(clanChannelUrl: string) {
    if (!this.page.url().startsWith(clanChannelUrl)) {
      await this.page.goto(clanChannelUrl);
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  async sendMessageWithMention(uniqueMessage: string, mentionUser: string = 'kien.trinh') {
    const input = this.page
      .locator(
        'textarea#editorReactMentionChannel.mentions_input, textarea.mentions_input, div[contenteditable="true"]'
      )
      .first();
    if (!(await input.isVisible({ timeout: 5000 }))) {
      throw new Error('Input field not found');
    }

    await input.click();
    await this.page.waitForTimeout(1000);

    // Type @ to trigger mention
    await input.type('@');
    await this.page.waitForTimeout(1500);

    // Type username
    await input.type(mentionUser);
    await this.page.waitForTimeout(1500);

    await this.page.waitForTimeout(1000);

    // Find and select user from mention dropdown
    const mentionDropdown = await this.findMentionDropdown();
    if (mentionDropdown) {
      await this.selectUserFromMentionDropdown(mentionDropdown, mentionUser);
    } else {
      await input.type(' ');
    }

    // Press Enter to confirm mention
    await input.press('Enter');
    await this.page.waitForTimeout(1000);

    // Type message
    await input.type(` ${uniqueMessage}`);
    await this.page.waitForTimeout(1000);

    // Send message
    await input.press('Enter');
    await this.page.waitForTimeout(3000);
  }

  private async findMentionDropdown() {
    const mentionSelectors = [
      '[role="listbox"]',
      '[role="menu"]',
      '.mentions__suggestions',
      '[class*="mention"]',
      '[class*="dropdown"]',
      '[class*="suggestions"]',
      '[class*="list"]',
    ];

    for (const selector of mentionSelectors) {
      const dropdown = this.page.locator(selector).first();
      if (await dropdown.isVisible({ timeout: 2000 })) {
        return dropdown;
      }
    }
    return null;
  }

  private async selectUserFromMentionDropdown(dropdown: any, username: string) {
    const mentionOptions = dropdown.locator(
      '[role="option"], [role="menuitem"], li, div, [class*="item"], [class*="option"]'
    );
    const mentionCount = await mentionOptions.count();

    for (let i = 0; i < mentionCount; i++) {
      const option = mentionOptions.nth(i);
      const optionText = (await option.textContent()) || '';

      if (
        optionText.toLowerCase().includes(username.toLowerCase()) ||
        optionText.toLowerCase().includes(username.split('.')[0])
      ) {
        await option.click();
        await this.page.waitForTimeout(1000);
        return true;
      }
    }
    return false;
  }

  async findAndReplyToMessage(uniqueMessage: string, replyText: string = 'okie tao đã rep') {
    const messages = this.page.locator(
      '[data-testid="message"], .message, .chat-message, div[class*="message"]'
    );
    const messageCount = await messages.count();

    for (let i = messageCount - 1; i >= 0; i--) {
      const msg = messages.nth(i);
      const msgText = (await msg.textContent()) || '';

      if (msgText.includes(uniqueMessage)) {
        try {
          const messageHelpers = new MessageTestHelpers(this.page);
          await messageHelpers.replyToMessage(msg, replyText);
          return true;
        } catch (error) {
          continue;
        }
      }
    }
    return false;
  }

  async openInboxMentions() {
    const inboxButton = this.page
      .locator('button[title="Inbox"], button[aria-label*="Inbox" i], [data-testid="inbox-button"]')
      .first();

    if (await inboxButton.isVisible({ timeout: 5000 })) {
      await inboxButton.click();
      await this.page.waitForTimeout(2000);
    } else {
      return false;
    }

    const mentionsTab = this.page
      .locator('button:has-text("Mentions"), [role="tab"]:has-text("Mentions"), .mentions-tab')
      .first();

    if (await mentionsTab.isVisible({ timeout: 5000 })) {
      await mentionsTab.click();
      await this.page.waitForTimeout(2000);
      return true;
    } else {
      const fallbackMentions = this.page
        .locator(
          'button:has-text("Mentions"), a:has-text("Mentions"), [data-testid="mentions-tab"]'
        )
        .first();
      if (await fallbackMentions.isVisible({ timeout: 3000 })) {
        await fallbackMentions.click();
        await this.page.waitForTimeout(2000);
        return true;
      }
    }
    return false;
  }

  async findInboxMessages(uniqueMessage: string) {
    const inboxSelectors = [
      'div.w-full.text-theme-message:first-of-type',
      'div.w-full.text-theme-message:first-child',
      'div.w-full.text-theme-message:nth-child(1)',
      'div.w-full.text-theme-message',
      '[class*="w-full"][class*="text-theme-message"]',
    ];

    for (const selector of inboxSelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();

      if (count > 0) {
        return elements;
      }
    }

    // Fallback
    return this.page.locator('div').filter({ hasText: uniqueMessage });
  }

  async checkFirstInboxMessageContains(expectedText: string) {
    const inboxMessages = await this.findInboxMessages(expectedText);
    const firstMessage = inboxMessages.first();

    if (await firstMessage.isVisible({ timeout: 5000 })) {
      const firstMessageText = (await firstMessage.textContent()) || '';
      return firstMessageText.includes(expectedText);
    }
    return false;
  }
}
