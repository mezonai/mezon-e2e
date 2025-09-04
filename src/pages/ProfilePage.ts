import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';
export class ProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  readonly buttons = {
    editUserprofileButton: this.page.locator(generateE2eSelector('user_setting.account.edit_profile')),
    editDisplayNameButton: this.page.locator(generateE2eSelector('user_setting.account.edit_display_name')),
    editUserNameButton: this.page.locator(generateE2eSelector('user_setting.account.edit_username')),
    saveChangesButton: this.page.locator(generateE2eSelector('user_setting.profile.clan_profile.button_save_changes')),
    changeAvatarButton: this.page.locator(generateE2eSelector('user_setting.profile.clan_profile.button_change_avatar')),  
    userSettingProfileButton: this.page.locator(generateE2eSelector('user_setting.profile.button_setting')),
  };

  readonly tabs = {
    profileTab: this.page.locator(generateE2eSelector('user_setting.profile.tab_profile')), 
    userProfileTab: this.page.locator(generateE2eSelector('user_setting.profile.user_profile.button')),
    clanProfileTab: this.page.locator(generateE2eSelector('user_setting.profile.clan_profile.button')),
    accountTab: this.page.locator(generateE2eSelector('user_setting.account.tab_account')),
  };

  readonly inputs = {
    nicknameInput: this.page.locator(generateE2eSelector('user_setting.profile.clan_profile.input_nickname')),
  };

  async openProfileTab() {
    await this.tabs.profileTab.waitFor({ state: 'visible', timeout: 1000 });
    await this.tabs.profileTab.click();
  }

  async openClanProfileTab() {
    await this.tabs.clanProfileTab.waitFor({ state: 'visible', timeout: 1000 });
    await this.tabs.clanProfileTab.click();
  }

  async openAccountTab() {
    await this.tabs.accountTab.waitFor({ state: 'visible', timeout: 1000 });
    await this.tabs.accountTab.click();
  }

  async expectProfileTabsVisible() {
    await expect(this.tabs.userProfileTab).toBeVisible({ timeout: 1000 });
    await expect(this.tabs.clanProfileTab).toBeVisible({ timeout: 1000 });
  }
}
