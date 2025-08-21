import { Page, Locator } from '@playwright/test';

export class VoiceChannelPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly channelNameInput: Locator;
  readonly voiceRadio: Locator;
  readonly privateToggle: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly channelsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.locator(
      '#channelList button.focus-visible\\:outline-none.text-theme-primary.text-theme-primary-hover'
    );
    this.channelNameInput = page.locator('input.Input.grow.shrink.basis-0');
    this.voiceRadio = page.locator('input[type="radio"][name="drone"][value="10"]');
    this.privateToggle = page.locator('input[type="checkbox"].peer');
    this.confirmButton = page.locator('button.btn-primary:has-text("Create Channel")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.channelsList = page.locator('div[role="button"].relative.group.z-10');
  }

  async createVoiceChannel(name: string, type: 'private' | 'public'): Promise<boolean> {
    await this.createButton.click();

    await this.channelNameInput.waitFor({ state: 'visible', timeout: 3000 });
    await this.channelNameInput.fill(name);

    if (type === 'private') {
      await this.privateToggle.click();
      await this.page.waitForTimeout(500);
    }

    await this.voiceRadio.click();
    await this.page.waitForTimeout(500);

    await this.confirmButton.click();

    try {
      await this.page.waitForSelector(
        `.voice-channel-list > div.channel-item[data-name="${name}"]`,
        { timeout: 5000 }
      );
      return true;
    } catch {
      // Ignore errors
      return false;
    }
  }

  async isVoiceChannelPresent(name: string): Promise<boolean> {
    const channel = this.page.locator(
      `.voice-channel-list > div.channel-item[data-name="${name}"]`
    );
    return (await channel.count()) > 0;
  }

  async cancelCreateVoiceChannel(name: string): Promise<boolean> {
    await this.createButton.click();

    await this.channelNameInput.waitFor({ state: 'visible', timeout: 3000 });
    await this.channelNameInput.fill(name);

    await this.voiceRadio.click();
    await this.cancelButton.click();
    await this.page.waitForTimeout(1000);

    return !(await this.isVoiceChannelPresent(name));
  }
}
