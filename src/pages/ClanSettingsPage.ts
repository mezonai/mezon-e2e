import ClanSettingSelector from '@/data/selectors/ClanSettingSelector';
import { isWebhookJustCreated } from '@/utils/clanSettingsHelper';
import { type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ClanMenuPanel } from './Clan/ClanMenuPanel';

export class ClanSettingsPage extends BasePage {
  private readonly selector: ClanSettingSelector;

  constructor(page: Page, baseURL?: string) {
    super(page, baseURL);
    this.selector = new ClanSettingSelector(page);
  }

  async clickSettingClanSection(section: string): Promise<void> {
    const sidebarItem = this.selector.buttons.sidebarItem.filter({ hasText: section });
    await sidebarItem.click();
    await expect(sidebarItem).toBeVisible();
  }

  async createClanWebhookButton(): Promise<void> {
    await this.selector.integrations.createWebhook.click();
    await expect(this.selector.integrations.newWebhook).toBeVisible({ timeout: 5000 });
    await this.selector.integrations.newWebhook.click();
    await expect(this.selector.integrations.navigateWebhook).toBeVisible({ timeout: 5000 });
    await this.selector.integrations.navigateWebhook.click();
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

  async openAuditLogTab(): Promise<void> {
    await this.selector.general.buttons.auditLog.click();
    await expect(this.selector.auditLog.content.first()).toBeVisible({ timeout: 10000 });
  }

  async verifyUpdateRoleAuditLog(roleName: string, username: string): Promise<void> {
    const entry = this.selector.auditLog.content
      .filter({ hasText: username })
      .filter({ hasText: /Update Role/i })
      .filter({ hasText: roleName })
      .first();

    await expect(entry).toBeVisible({ timeout: 10000 });
    await expect(entry).toContainText(username);
    await expect(entry).toContainText(/Update Role/i);
    await expect(entry.locator('strong')).toContainText(
      new RegExp(`${roleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(\\d+\\)`)
    );

    const auditItem = entry.locator('xpath=../..');
    const time = auditItem.locator(this.selector.auditLog.time);
    await expect(time).toBeVisible();
    await expect(time).toContainText(/^(Today at \d{1,2}:\d{2}|Yesterday at \d{1,2}:\d{2})$/);
  }
}
