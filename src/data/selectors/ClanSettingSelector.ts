import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class ClanSettingSelector {
  constructor(private readonly page: Page) {
    this.page = page;
  }

  readonly buttons = {
    sidebarItem: this.page.locator(generateE2eSelector('clan_page.settings.sidebar.item')),
    uploadEmoji: this.page.locator(generateE2eSelector('clan_page.settings.emoji.upload')),
    uploadVoiceSticker: this.page.locator(
      generateE2eSelector('clan_page.settings.voice_sticker.button_upload')
    ),
    enableOnboarding: this.page.locator(
      generateE2eSelector('clan_page.settings.onboarding.button.enable_onboarding')
    ),
    editClanGuide: this.page.locator(
      generateE2eSelector('clan_page.settings.onboarding.button.clan_guide')
    ),
    addResource: this.page.locator(
      generateE2eSelector('clan_page.settings.onboarding.button.add_resources')
    ),
    enableCommunity: this.page.locator(
      generateE2eSelector('clan_page.settings.community.button.enable_community')
    ),
    closeSettingClan: this.page.locator(generateE2eSelector('user_setting.account.exit_setting')),
    clanName: this.page.locator(generateE2eSelector('clan_page.header.title.clan_name')),
  };

  readonly integrations = {
    createWebhook: this.page.locator(
      generateE2eSelector('clan_page.settings.integrations.create_clan_webhook_button')
    ),
    newWebhook: this.page.locator(
      generateE2eSelector('clan_page.settings.integrations.new_clan_webhook_button')
    ),
    webhookItem: {
      item: this.page.locator(generateE2eSelector('clan_page.settings.integrations.webhook_item')),
      title: this.page.locator(
        generateE2eSelector('clan_page.settings.integrations.webhook_item.webhook_title')
      ),
      description: this.page.locator(
        generateE2eSelector('clan_page.settings.integrations.webhook_item.webhook_description')
      ),
    },
  };
}
