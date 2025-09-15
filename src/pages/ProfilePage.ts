import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';
export class ProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  readonly buttons = {
    editUserprofile: this.page.locator(
      generateE2eSelector('user_setting.account.edit_profile')
    ),
    editDisplayName: this.page.locator(
      generateE2eSelector('user_setting.account.edit_display_name')
    ),
    editUserName: this.page.locator(
      generateE2eSelector('user_setting.account.edit_username')
    ),
    saveChangesClanProfile: this.page.locator(
      `${generateE2eSelector('user_setting.profile.clan_profile')} ${generateE2eSelector('button.base')}`,
      { hasText: 'Save Changes' }
    ),
    saveChangesUserProfile: this.page.locator(
      generateE2eSelector('user_setting.profile.user_profile.button.save_changes')
    ),
    changeAvatar: this.page.locator(
      generateE2eSelector('user_setting.profile.clan_profile.button_change_avatar')
    ),
    userSettingProfile: this.page.locator(
      generateE2eSelector('user_setting.profile.button_setting')
    ),
  };

  readonly tabs = {
    profile: this.page.locator(generateE2eSelector('user_setting.profile.tab_profile')),
    userProfile: this.page.locator(
      generateE2eSelector('user_setting.profile.user_profile.button')
    ),
    clanProfile: this.page.locator(
      generateE2eSelector('user_setting.profile.clan_profile.button')
    ),
    account: this.page.locator(generateE2eSelector('user_setting.account.tab_account')),
  };

  readonly inputs = {
    nickname: this.page.locator(
      generateE2eSelector('user_setting.profile.clan_profile.input_nickname')
    ),
    displayName: this.page.locator(
      `${generateE2eSelector('user_setting.profile.user_profile.input.display_name')}`
    ),
    aboutMe: this.page.locator(
      `${generateE2eSelector('user_setting.profile.user_profile.input.about_me')}`
    ),
  };

  async openProfileTab() {
    await this.tabs.profile.waitFor({ state: 'visible', timeout: 1000 });
    await this.tabs.profile.click();
  }

  async openClanProfileTab() {
    await this.tabs.clanProfile.waitFor({ state: 'visible', timeout: 1000 });
    await this.tabs.clanProfile.click();
  }

  async openAccountTab() {
    await this.tabs.account.waitFor({ state: 'visible', timeout: 1000 });
    await this.tabs.account.click();
  }

  async expectProfileTabsVisible() {
    await expect(this.tabs.userProfile).toBeVisible({ timeout: 1000 });
    await expect(this.tabs.clanProfile).toBeVisible({ timeout: 1000 });
  }

  async openUserProfileTab() {
    await this.tabs.userProfile.waitFor({ state: 'visible', timeout: 1000 });
    await this.tabs.userProfile.click();
  }

  async verifyDisplayNameUpdated(displayName: string) {
    await expect(this.inputs.displayName).toHaveValue(displayName, { timeout: 2000 });
  }

  async verifyDisplayNameCleared() {
    await expect(this.inputs.aboutMe).toHaveValue('', { timeout: 2000 });
  }
}
