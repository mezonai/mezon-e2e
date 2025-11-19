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

  readonly settingsSelectors = [
    '[data-testid="clan-settings"]',
    'button:has-text("Settings")',
    'a:has-text("Settings")',
    '[aria-label*="settings" i]',
    '.settings-menu',
    'svg[data-icon="cog"]',
    'svg[data-icon="gear"]',
    '.fa-cog',
    '.fa-gear',
  ];

  readonly stickerSectionSelectors = [
    '[data-testid="image-stickers"]',
    'button:has-text("Image Stickers")',
    'a:has-text("Image Stickers")',
    'div:has-text("Image Stickers")',
    '[aria-label*="sticker" i]',
  ];

  readonly voiceStickerSectionSelectors = [
    '[data-testid="voice-stickers"]',
    'button:has-text("Voice Stickers")',
    'a:has-text("Voice Stickers")',
    'div:has-text("Voice Stickers")',
    '[aria-label*="voice" i]',
  ];

  readonly uploadButtonSelectors = [
    '[data-testid="upload-stickers"]',
    'button:has-text("Upload Stickers")',
    'button:has-text("Upload")',
    '[aria-label*="upload" i]',
    'input[type="file"]',
  ];

  readonly modalSelectors = [
    '.modal',
    '.dialog',
    '.popup',
    '[role="dialog"]',
    '[role="modal"]',
    '.overlay',
    '.modal-overlay',
    '.bg-modal-overlay',
    '[class*="modal-overlay"]',
    '[data-testid="modal"]',
    '[data-testid="upload-modal"]',
  ];
}
