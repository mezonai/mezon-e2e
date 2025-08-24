import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

interface SelectorResult {
  found: boolean;
  element?: Locator;
}

export class ClanPage extends BasePage {
  private readonly createClanButtonSelectors = [
    'div[onclick*="openCreateClanModal"]',
    'div.flex.items-center.justify-between.text-theme-primary.group[onclick*="openCreateClanModal"]',
    'div.group:has(p.text-2xl.font-semibold:has-text("+"))',
    'div:has(p:has-text("+"))',
    'p.text-2xl.font-semibold:has-text("+"):up(div)',
    '[onclick*="openCreateClanModal"]',
    '[data-testid="create-clan"]',
    'button:has-text("+")',
    '.create-clan-btn',
    '.add-clan-btn',
    '[aria-label*="create clan" i]',
    '[aria-label*="add clan" i]',
  ];

  private readonly clanNameSelectors = [
    '[data-testid="clan-name"]',
    '.clan-name',
    '.clan-header h1',
    '.clan-title',
    'h1:has-text("CLAN")',
    '[aria-label*="clan name" i]',
  ];

  private readonly invitePeopleSelectors = [
    '[data-testid="invite-people"]',
    'button:has-text("Invite People")',
    'a:has-text("Invite People")',
    '[aria-label*="invite people" i]',
    '.invite-button',
    '.invite-people-btn',
  ];

  private readonly createChannelSelectors = [
    '[data-testid="create-channel"]',
    'button:has-text("+")',
    '.create-channel-btn',
    '.add-channel',
    '[aria-label*="create channel" i]',
    '[aria-label*="add channel" i]',
  ];

  private readonly channelListSelectors = [
    '[data-testid="channel-list"]',
    '.channel-list',
    '.channels-container',
    '.sidebar-channels',
    'nav[aria-label*="channel" i]',
  ];

  private readonly messageInputSelectors = [
    'textarea#editorReactMentionChannel',
    'textarea[placeholder="Write your thoughts here..."]',
    'textarea.mentions__input',
    '[data-testid="message-input"]',
    'textarea[placeholder*="thoughts" i]',
    'textarea[placeholder*="message" i]',
    'input[placeholder*="message" i]',
    '.message-input',
    '.chat-input',
    '[aria-label*="message" i]',
  ];

  constructor(page: Page, baseURL?: string) {
    super(page, baseURL);
  }

  private async findElementBySelectors(
    selectors: string[],
    timeout: number = 3000
  ): Promise<SelectorResult> {
    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout })) {
          return { found: true, element };
        }
      } catch {
        // Ignore errors
        continue;
      }
    }
    return { found: false };
  }

  private async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  async clickCreateClanButton(): Promise<boolean> {
    const result = await this.findElementBySelectors(this.createClanButtonSelectors, 10000);

    if (result.found && result.element) {
      await result.element.click();
      await this.wait(2000);
      return true;
    }

    return false;
  }

  async createNewClan(clanName: string): Promise<boolean> {
    const clanNameInputSelectors = [
      '[data-testid="clan-name-input"]',
      'input[placeholder*="clan name" i]',
      'input[placeholder*="name" i]',
      '.clan-name-input',
      'input[type="text"]',
    ];

    const nameInputResult = await this.findElementBySelectors(clanNameInputSelectors);
    if (!nameInputResult.found || !nameInputResult.element) {
      return false;
    }

    await nameInputResult.element.fill(clanName);
    await this.wait(500);

    const createButtonSelectors = [
      '[data-testid="create-clan-btn"]',
      'button:has-text("Create")',
      'button:has-text("Create Clan")',
      '.create-btn',
      '.create-clan-btn',
    ];

    const createButtonResult = await this.findElementBySelectors(createButtonSelectors, 2000);
    if (createButtonResult.found && createButtonResult.element) {
      await createButtonResult.element.click();
      await this.wait(3000);
      return true;
    }

    return false;
  }

  async clickOnClanName(): Promise<boolean> {
    const result = await this.findElementBySelectors(this.clanNameSelectors);

    if (result.found && result.element) {
      await result.element.click();
      await this.wait(1000);
      return true;
    }

    return false;
  }

  async openInvitePeopleModal(): Promise<boolean> {
    const result = await this.findElementBySelectors(this.invitePeopleSelectors);

    if (result.found && result.element) {
      await result.element.click();
      await this.wait(1000);
      return true;
    }

    return false;
  }

  async searchAndInviteUser(username: string): Promise<boolean> {
    const searchSelectors = [
      '[data-testid="user-search"]',
      'input[placeholder*="search" i]',
      'input[placeholder*="user" i]',
      '.user-search',
      '.search-input',
    ];

    const searchResult = await this.findElementBySelectors(searchSelectors, 2000);
    if (!searchResult.found || !searchResult.element) {
      return false;
    }

    await searchResult.element.fill(username);
    await this.wait(1000);

    const inviteButtonSelectors = [
      `button:has-text("Invite"):near(:text("${username}"))`,
      '[data-testid="invite-user-btn"]',
      '.invite-btn',
      'button:has-text("Invite")',
    ];

    const inviteResult = await this.findElementBySelectors(inviteButtonSelectors, 2000);
    if (inviteResult.found && inviteResult.element) {
      await inviteResult.element.click();
      await this.wait(1000);
      return true;
    }

    return false;
  }

  async openCreateChannelModal(): Promise<boolean> {
    const channelListFound = await this.findChannelList();
    if (!channelListFound) {
      return false;
    }

    const result = await this.findElementBySelectors(this.createChannelSelectors);
    if (result.found && result.element) {
      await result.element.click();
      await this.wait(1000);
      return true;
    }

    return false;
  }

  async findChannelList(): Promise<boolean> {
    const result = await this.findElementBySelectors(this.channelListSelectors, 2000);
    return result.found;
  }

  async createChannel(
    channelName: string,
    channelType: 'text' | 'voice' = 'text'
  ): Promise<boolean> {
    const channelTypeSelectors = [
      `[data-testid="channel-type-${channelType}"]`,
      `button:has-text("${channelType}")`,
    ];

    const typeResult = await this.findElementBySelectors(channelTypeSelectors, 2000);
    if (typeResult.found && typeResult.element) {
      await typeResult.element.click();
    }

    const nameInputSelectors = [
      '[data-testid="channel-name-input"]',
      'input[placeholder*="channel name" i]',
      'input[placeholder*="name" i]',
      '.channel-name-input',
    ];

    const nameInputResult = await this.findElementBySelectors(nameInputSelectors, 2000);
    if (!nameInputResult.found || !nameInputResult.element) {
      return false;
    }

    await nameInputResult.element.fill(channelName);
    await this.wait(500);

    const createButtonSelectors = [
      '[data-testid="create-channel-btn"]',
      'button:has-text("Create")',
      'button:has-text("Create Channel")',
      '.create-btn',
      '.create-channel-btn',
    ];

    const createResult = await this.findElementBySelectors(createButtonSelectors, 2000);
    if (createResult.found && createResult.element) {
      await createResult.element.click();
      await this.wait(2000);
      return true;
    }

    return false;
  }

  async sendFirstMessage(message: string): Promise<boolean> {
    const result = await this.findElementBySelectors(this.messageInputSelectors);
    if (!result.found || !result.element) {
      return false;
    }

    await result.element.fill(message);
    await this.wait(500);
    await result.element.press('Enter');
    await this.wait(2000);

    return true;
  }

  async verifyMessageSent(message: string): Promise<boolean> {
    const messageSelectors = [
      `div:has-text("${message}")`,
      `[data-testid="message"]:has-text("${message}")`,
      `.message:has-text("${message}")`,
      `.chat-message:has-text("${message}")`,
    ];

    const result = await this.findElementBySelectors(messageSelectors);
    return result.found;
  }

  async sendImage(imagePath: string): Promise<boolean> {
    const fileInputSelectors = ['input[type="file"][accept*="image/*"]', 'input[type="file"]'];

    // Try to find direct file input first
    let fileInputResult = await this.findElementBySelectors(fileInputSelectors);

    if (!fileInputResult.found) {
      // If no direct file input, try to find attach button
      const attachButtonSelectors = [
        'button[aria-label*="attach"]',
        'button[aria-label*="upload"]',
        '.attach-button',
        '[data-icon="paperclip"]',
        '[title*="upload"]',
        'button:has([data-icon="paperclip"])',
        '.message-input ~ button',
      ];

      const attachResult = await this.findElementBySelectors(attachButtonSelectors);
      if (attachResult.found && attachResult.element) {
        await attachResult.element.click();
        await this.wait(1000);

        // Try to find file input after clicking attach
        fileInputResult = await this.findElementBySelectors(fileInputSelectors);
      }
    }

    if (!fileInputResult.found || !fileInputResult.element) {
      return false;
    }

    await fileInputResult.element.setInputFiles(imagePath);
    await this.wait(3000);

    const messageInputResult = await this.findElementBySelectors(this.messageInputSelectors);
    if (messageInputResult.found && messageInputResult.element) {
      await messageInputResult.element.press('Enter');
    }

    await this.wait(5000);
    return true;
  }

  async verifyImageMessage(): Promise<boolean> {
    const imageMessageSelectors = [
      'div.message img[src]',
      '.chat-message img',
      '[data-testid="message-content"] img',
      'img[alt*="image"]',
    ];

    // Check if any image is visible (use last() to get most recent)
    for (const selector of imageMessageSelectors) {
      try {
        const element = this.page.locator(selector).last();
        if (await element.isVisible({ timeout: 3000 })) {
          return true;
        }
      } catch {
        // Ignore errors
        continue;
      }
    }

    return false;
  }

  async getAllClanNames(): Promise<string[]> {
    const clanElements = this.page.locator('.clan');
    const count = await clanElements.count();
    const names = [];
    for (let i = 0; i < count; i++) {
      const name = (await clanElements.nth(i).textContent())?.trim();
      if (name) names.push(name);
    }
    return names;
  }

  async clickClanByName(targetName: string) {
    const clanElements = this.page.locator('.clan');
    const count = await clanElements.count();
    for (let i = 0; i < count; i++) {
      const el = clanElements.nth(i);
      const name = (await el.textContent())?.trim();
      if (name === targetName) {
        await el.click();
        return true;
      }
    }
    throw new Error(`Clan "${targetName}" not found`);
  }

  async isClanSelected(name: string) {
    const selectedName = await this.page.textContent(
      'p.text-theme-primary-active.text-base.font-semibold.select-none.one-line'
    );

    const firstChar = selectedName?.trim().charAt(0);
    console.log('First char:', firstChar);

    return firstChar === name;
  }
}
