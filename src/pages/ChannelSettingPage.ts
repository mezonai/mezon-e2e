import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ChannelSettingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  readonly side_bar_buttons = {
    integrations: this.page.locator(generateE2eSelector('channel_setting_page.side_bar.item'), {
      hasText: 'Integrations',
    }),
    channel_label: this.page.locator(
      generateE2eSelector('channel_setting_page.side_bar.channel_label')
    ),
  };

  readonly webhook = {
    create_webhook_button: this.page.locator(
      generateE2eSelector('channel_setting_page.webhook.button.create_webhook')
    ),
    new_webhook_button: this.page.locator(
      generateE2eSelector('channel_setting_page.webhook.button.new_webhook')
    ),
    view_webhook_button: this.page.locator(
      generateE2eSelector('channel_setting_page.webhook.button.view_webhook')
    ),
  };

  async createChannelWebhook(): Promise<void> {
    await this.side_bar_buttons.integrations.click();
    await this.webhook.create_webhook_button.click();
    await this.webhook.new_webhook_button.click();
    await this.page.waitForTimeout(500);
    await this.webhook.view_webhook_button.click();
    await this.page.waitForTimeout(500);
  }
}
