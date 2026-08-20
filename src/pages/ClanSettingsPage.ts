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

  async nameAndSaveEmoji(emojiName: string): Promise<void> {
    await expect(this.selector.emoji.upload.input.name).toBeVisible({ timeout: 5000 });
    await this.selector.emoji.upload.input.name.fill(emojiName);
    await expect(this.selector.emoji.upload.button.save).toBeVisible({ timeout: 5000 });
    await this.selector.emoji.upload.button.save.click();
    await expect(this.selector.emoji.upload.button.save).toBeHidden({ timeout: 5000 });
  }

  async clickUploadImageSticker(): Promise<void> {
    await this.selector.buttons.uploadImageSticker.click();
    await this.page.waitForTimeout(1000);
  }

  async nameAndSaveImageSticker(stickerName: string): Promise<void> {
    await expect(this.selector.imageSticker.upload.input.name).toBeVisible({ timeout: 5000 });
    await this.selector.imageSticker.upload.input.name.fill(stickerName);
    await expect(this.selector.imageSticker.upload.button.save).toBeVisible({ timeout: 5000 });
    await this.selector.imageSticker.upload.button.save.click();
    await expect(this.selector.imageSticker.upload.button.save).toBeHidden({ timeout: 5000 });
  }

  async editEmojiName(oldName: string, newName: string): Promise<void> {
    const oldNormalizedName = oldName.replace(/\s+/g, '');
    const newNormalizedName = newName.replace(/\s+/g, '');
    const nameInput = this.selector.emoji.item.nameInput
      .and(this.page.locator(`[value="${oldNormalizedName}"]`))
      .or(this.page.locator(`input:not([placeholder])[value="${oldNormalizedName}"]`))
      .first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(newNormalizedName);
    await this.page.keyboard.press('Enter');
    const editedNameInput = this.page
      .locator(`input:not([placeholder])[value="${newNormalizedName}"]`)
      .first();
    await expect(editedNameInput).toBeVisible({ timeout: 5000 });
    await this.page.waitForTimeout(1000);
  }

  async deleteEmoji(emojiName: string): Promise<void> {
    const normalizedName = emojiName.replace(/\s+/g, '');
    const nameInput = this.selector.emoji.item.nameInput
      .and(this.page.locator(`[value="${normalizedName}"]`))
      .or(this.page.locator(`input:not([placeholder])[value="${normalizedName}"]`))
      .first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    const emojiItem = nameInput.locator('xpath=ancestor::div[contains(@class, "border-b")][1]');
    await emojiItem.hover();
    await emojiItem
      .locator(this.selector.emoji.item.delete)
      .or(emojiItem.getByRole('button', { name: 'X', exact: true }))
      .first()
      .click();
    await expect(nameInput).toBeHidden({ timeout: 5000 });
  }

  async editImageStickerName(oldName: string, newName: string): Promise<void> {
    const oldNormalizedName = oldName.replace(/\s+/g, '');
    const newNormalizedName = newName.replace(/\s+/g, '');
    const stickerName = this.selector.imageSticker.item.name
      .filter({ hasText: oldNormalizedName })
      .or(this.page.getByText(oldNormalizedName, { exact: true }))
      .first();
    await expect(stickerName).toBeVisible({ timeout: 5000 });
    const stickerItem = stickerName.locator('xpath=ancestor::div[.//img][1]');
    await stickerItem.hover();
    await stickerItem
      .locator(this.selector.imageSticker.item.edit)
      .or(stickerItem.locator('button').first())
      .first()
      .click();

    const nameInput = this.page.locator(`input[value="${oldNormalizedName}"]`).last();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(newNormalizedName);
    await this.selector.imageSticker.upload.button.save.click();
    await expect(this.selector.imageSticker.upload.button.save).toBeHidden({ timeout: 5000 });

    const editedStickerName = this.page.getByText(newNormalizedName, { exact: true });
    await expect(editedStickerName).toBeVisible({ timeout: 5000 });
  }

  async deleteImageSticker(stickerName: string): Promise<void> {
    const normalizedName = stickerName.replace(/\s+/g, '');
    const name = this.selector.imageSticker.item.name
      .filter({ hasText: normalizedName })
      .or(this.page.getByText(normalizedName, { exact: true }))
      .first();
    await expect(name).toBeVisible({ timeout: 5000 });
    const stickerItem = name.locator('xpath=ancestor::div[.//img][1]');
    await stickerItem.hover();
    await stickerItem
      .locator(this.selector.imageSticker.item.delete)
      .or(stickerItem.getByRole('button', { name: 'x', exact: true }))
      .first()
      .click();
    await expect(name).toBeHidden({ timeout: 5000 });
  }

  async clickUploadVoiceStickers(): Promise<void> {
    await this.selector.buttons.uploadVoiceSticker.click();
    await this.page.waitForTimeout(1000);
  }

  async nameAndSaveVoiceSticker(voiceStickerName: string): Promise<void> {
    await expect(this.selector.voiceSticker.upload.input.name).toBeVisible({ timeout: 5000 });
    await this.selector.voiceSticker.upload.input.name.fill(voiceStickerName);
    await expect(this.selector.voiceSticker.upload.button.save).toBeVisible({ timeout: 5000 });
    await this.selector.voiceSticker.upload.button.save.click();
    await expect(this.selector.voiceSticker.upload.button.save).toBeHidden({ timeout: 5000 });
    await expect(this.getVoiceStickerName(voiceStickerName)).toBeVisible({ timeout: 5000 });
  }

  async editVoiceStickerName(oldName: string, newName: string): Promise<void> {
    const oldStickerName = this.getVoiceStickerName(oldName);
    await expect(oldStickerName).toBeVisible({ timeout: 5000 });
    const stickerItem = oldStickerName.locator('xpath=ancestor::div[.//button][1]');
    await stickerItem.hover();
    await stickerItem
      .locator(this.selector.voiceSticker.item.edit)
      .or(stickerItem.locator('button').first())
      .first()
      .click();

    const nameInput = this.page.locator(`input[value="${oldName}"]`).last();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(newName);
    await this.selector.voiceSticker.upload.button.update.click();
    await expect(this.getVoiceStickerName(newName)).toBeVisible({ timeout: 5000 });
  }

  async deleteVoiceSticker(voiceStickerName: string): Promise<void> {
    const stickerName = this.getVoiceStickerName(voiceStickerName);
    await expect(stickerName).toBeVisible({ timeout: 5000 });
    const stickerItem = stickerName.locator('xpath=ancestor::div[.//button][1]');
    await stickerItem.hover();
    await stickerItem
      .locator(this.selector.voiceSticker.item.delete)
      .or(stickerItem.getByRole('button', { name: /x/i }))
      .last()
      .click();
    await expect(stickerName).toBeHidden({ timeout: 5000 });
  }

  private getVoiceStickerName(voiceStickerName: string) {
    return this.selector.voiceSticker.item.name
      .filter({ hasText: voiceStickerName })
      .or(this.page.getByText(voiceStickerName, { exact: true }))
      .first();
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
