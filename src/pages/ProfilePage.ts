import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  readonly buttons = {
    editUserprofileButton: this.page.locator(
      generateE2eSelector('user_setting.account.edit_profile')
    ),
    editDisplayNameButton: this.page.locator(
      generateE2eSelector('user_setting.account.edit_display_name')
    ),
    editUserNameButton: this.page.locator(
      generateE2eSelector('user_setting.account.edit_username')
    ),
    saveChangesClanProfileButton: this.page.locator(
      `${generateE2eSelector('user_setting.profile.clan_profile')} ${generateE2eSelector('button.base')}`,
      { hasText: 'Save Changes' }
    ),
    saveChangesUserProfileButton: this.page.locator(
      generateE2eSelector('user_setting.profile.user_profile.button.save_changes')
    ),
    changeAvatarButton: this.page.locator(
      generateE2eSelector('user_setting.profile.clan_profile.button_change_avatar')
    ),
    userSettingProfileButton: this.page.locator(
      generateE2eSelector('user_setting.profile.button_setting')
    ),
  };

  readonly tabs = {
    profileTab: this.page.locator(generateE2eSelector('user_setting.profile.tab_profile')),
    userProfileTab: this.page.locator(
      generateE2eSelector('user_setting.profile.user_profile.button')
    ),
    clanProfileTab: this.page.locator(
      generateE2eSelector('user_setting.profile.clan_profile.button')
    ),
    accountTab: this.page.locator(generateE2eSelector('user_setting.account.tab_account')),
  };

  readonly inputs = {
    nicknameInput: this.page.locator(
      generateE2eSelector('user_setting.profile.clan_profile.input_nickname')
    ),
    displayNameInput: this.page.locator(
      `${generateE2eSelector('user_setting.profile.user_profile.input.display_name')}`
    ),
    aboutMeInput: this.page.locator(
      `${generateE2eSelector('user_setting.profile.user_profile.input.about_me')}`
    ),
  };

  readonly texts = {
    aboutMeLength: this.page.locator(
      generateE2eSelector('user_setting.profile.user_profile.text.about_me_length')
    ),
  };

  async openUserSettingProfile() {
    await this.buttons.userSettingProfileButton.click();
  }

  async openProfileTab() {
    await this.tabs.profileTab.click();
  }

  async openClanProfileTab() {
    await this.tabs.clanProfileTab.click();
  }

  async openAccountTab() {
    await this.tabs.accountTab.click();
  }

  async expectProfileTabsVisible() {
    await expect(this.tabs.userProfileTab).toBeVisible({ timeout: 5000 });
    await expect(this.tabs.clanProfileTab).toBeVisible({ timeout: 5000 });
  }

  async openUserProfileTab() {
    await this.tabs.userProfileTab.click();
  }

  async verifyDisplayNameUpdated(displayName: string) {
    await expect(this.inputs.displayNameInput).toHaveValue(displayName, { timeout: 2000 });
  }

  async verifyAboutMeStatusUpdated(aboutMeStatus: string) {
    await expect(this.inputs.aboutMeInput).toHaveValue(aboutMeStatus, { timeout: 2000 });
  }

  async getAboutMeLength(): Promise<number> {
    const text = await this.texts.aboutMeLength.innerText();
    return parseInt(text.split('/')[0], 10);
  }

  async enterAboutMeStatus(aboutMeStatus: string) {
    if (aboutMeStatus?.length > 0 && aboutMeStatus.length < 128) {
      await this.inputs.aboutMeInput.fill(aboutMeStatus);
    }
  }

  async validateLength(aboutMeStatus: string): Promise<boolean> {
    const currentLength = await this.getAboutMeLength();
    return aboutMeStatus.length === currentLength;
  }
}
