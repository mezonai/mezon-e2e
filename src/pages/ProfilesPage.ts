import { expect, type Locator, type Page } from '@playwright/test';

export class ProfilesPage {
  readonly page: Page;
  readonly settingsButton: Locator;
  readonly profileTab: Locator;
  readonly clanProfilesTab: Locator;
  readonly nicknameInput: Locator;
  readonly changeAvatarBtn: Locator;
  readonly removeAvatarBtn: Locator;
  readonly saveChangesBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.settingsButton = page.locator('[data-e2e="user_setting-profile-button_setting"]').first();
    this.profileTab = page.locator('[data-e2e="user_setting-profile-tab_profile"]').first();
    this.clanProfilesTab = page
      .locator('[data-e2e="user_setting-profile-clan_profile-button"]')
      .first();
    this.nicknameInput = page
      .locator('[data-e2e="user_setting-profile-clan_profile-input_nickname"]')
      .first();
    this.changeAvatarBtn = page
      .locator('[data-e2e="user_setting-profile-clan_profile-button_change_avatar"]')
      .first();
    this.removeAvatarBtn = page
      .locator('[data-e2e="user_setting-profile-clan_profile-button_remove_avatar"]')
      .first();
    this.saveChangesBtn = page
      .locator('[data-e2e="user_setting-profile-clan_profile-button_save_changes"]')
      .first();
  }

  async openSettingsFlow(): Promise<void> {
    await this.settingsButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.settingsButton.scrollIntoViewIfNeeded();
    await this.settingsButton.click();
    await this.profileTab.waitFor({ state: 'visible', timeout: 15000 });
    await this.profileTab.click();
    await this.clanProfilesTab.waitFor({ state: 'visible', timeout: 15000 });
    await this.clanProfilesTab.click();
  }

  async ensureSaveVisible(): Promise<void> {
    await this.saveChangesBtn.scrollIntoViewIfNeeded();
    await expect(this.saveChangesBtn).toBeVisible({ timeout: 10000 });
    await expect(this.saveChangesBtn).toBeEnabled({ timeout: 10000 });
  }

  async changeNickname(target: string): Promise<void> {
    await expect(this.nicknameInput).toBeVisible({ timeout: 10000 });
    await this.nicknameInput.click();
    await this.nicknameInput.fill('');
    await this.nicknameInput.type(target, { delay: 50 });
    try {
      await expect
        .poll(async () => await this.nicknameInput.inputValue(), { timeout: 4000 })
        .toBe(target);
    } catch {
      await this.nicknameInput.evaluate((el: HTMLInputElement, value: string) => {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, target);
      await expect(this.nicknameInput).toHaveValue(target, { timeout: 3000 });
    }
  }

  async clickChangeAvatar(): Promise<void> {
    await expect(this.changeAvatarBtn).toBeVisible({ timeout: 10000 });
  }

  async removeAvatarAndSave(): Promise<void> {
    await this.removeAvatarBtn.click();
    await this.ensureSaveVisible();
    await this.saveChangesBtn.click();
  }

  async saveChanges(): Promise<void> {
    await this.ensureSaveVisible();
    await this.saveChangesBtn.click();
  }
}
