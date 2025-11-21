import { type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { isWebhookJustCreated } from '@/utils/clanSettingsHelper';
import { ClanMenuPanel } from './Clan/ClanMenuPanel';
import ClanSettingSelector from '@/data/selectors/ClanSettingSelector';

export class ClanSettingsPage extends BasePage {
  private readonly selector: ClanSettingSelector;

  constructor(page: Page, baseURL?: string) {
    super(page, baseURL);
    this.selector = new ClanSettingSelector(page);
  }

  async clickSettingClanSection(section: string): Promise<void> {
    await this.selector.buttons.sidebarItem.filter({ hasText: section }).click();
    await this.page.waitForTimeout(1000);
  }

  async createClanWebhookButton(): Promise<void> {
    const button = this.page.locator(
      generateE2eSelector('clan_page.settings.integrations.create_clan_webhook_button')
    );
    await button.click();
    await this.page.waitForTimeout(500);
    const new_clan_webhook_button = this.page.locator(
      generateE2eSelector('clan_page.settings.integrations.new_clan_webhook_button')
    );
    await new_clan_webhook_button.click();
    await this.page.waitForTimeout(1000);
    const navigate_webhook_button = this.page.locator(
      generateE2eSelector('clan_page.settings.integrations.navigate_webhook_button')
    );
    await navigate_webhook_button.click();
  }

  async clickUploadEmoji(): Promise<void> {
    await this.selector.buttons.uploadEmoji.click();
    await this.page.waitForTimeout(1000);
  }

  async clickUploadVoiceStickers(): Promise<void> {
    await this.selector.buttons.uploadVoiceSticker.click();
    await this.page.waitForTimeout(1000);
  }

  async openEditOnboardingResource(): Promise<void> {
    await this.selector.buttons.enableOnboarding.click();
    await this.selector.buttons.editClanGuide.click();
    await this.selector.buttons.addResource.click();
  }

  async openCommunityModal(): Promise<void> {
    await this.selector.buttons.enableCommunity.click();
  }

  async openIntegrationsTab() {
    const clanMenuPanel = new ClanMenuPanel(this.page);
    await clanMenuPanel.text.clanName.click();
    await clanMenuPanel.buttons.clanSettings.click();
    await this.selector.buttons.sidebarItem.filter({ hasText: 'Integrations' }).click();
  }

  async createWebhook(): Promise<void> {
    await this.selector.integrations.createWebhook.click();
    await this.selector.integrations.newWebhook.click();
  }

  async verifyWebhookCreated(): Promise<boolean> {
    const webhookItem = await this.selector.integrations.webhookItem.item.first();
    const webhookItemTitle = await webhookItem.locator(
      this.selector.integrations.webhookItem.title
    );
    const webhookItemDescription = await webhookItem.locator(
      this.selector.integrations.webhookItem.description
    );
    try {
      await expect(webhookItem).toBeVisible();
      await expect(webhookItemTitle).toBeVisible();
      await expect(webhookItemDescription).toBeVisible();
      const webhookItemDescriptionText = await webhookItemDescription.innerText();
      await this.selector.buttons.closeSettingClan.click();
      return isWebhookJustCreated(webhookItemDescriptionText);
    } catch {
      return false;
    }
  }
}
