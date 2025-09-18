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
    profile: this.page.locator(
      generateE2eSelector('user_setting.profile.tab_profile')
    ),
    userProfile: this.page.locator(
      generateE2eSelector('user_setting.profile.user_profile.button')
    ),
    clanProfile: this.page.locator(
      generateE2eSelector('user_setting.profile.clan_profile.button')
    ),
    account: this.page.locator(
      generateE2eSelector('user_setting.account.tab_account')
    ),
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
    mention: this.page.locator(
      `${generateE2eSelector('mention.input')}`
    ),
  };

  readonly texts = {
    aboutMeLength: this.page.locator(
      generateE2eSelector('user_setting.profile.user_profile.text.about_me_length')
    ),
    aboutMeInShortProfile : this.page.locator(
      generateE2eSelector('mention.text.about_me')
    )
  };

  readonly profiles = {
    displayName: this.page.locator(
      generateE2eSelector('base_profile.display_name')
    )
  }

  async openUserSettingProfile() {
    await this.buttons.userSettingProfile.click();
  }

  async openProfileTab() {
    await this.tabs.profile.click();
  }

  async openClanProfileTab() {
    await this.tabs.clanProfile.click();
  }

  async openAccountTab() {
    await this.tabs.account.click();
  }

  async expectProfileTabsVisible() {
    await expect(this.tabs.userProfile).toBeVisible({ timeout: 5000 });
    await expect(this.tabs.clanProfile).toBeVisible({ timeout: 5000 });
  }

  async openUserProfileTab() {
    await this.tabs.userProfile.click();
  }

  async verifyDisplayNameUpdated(displayName: string) {
    await expect(this.inputs.displayName).toHaveValue(displayName, { timeout: 2000 });
  }

  async verifyAboutMeStatusUpdated(aboutMeStatus: string) {
    await expect(this.inputs.aboutMe).toHaveValue(aboutMeStatus, { timeout: 2000 });
  }

  async getAboutMeLength(): Promise<number> {
    const text = await this.texts.aboutMeLength.innerText();
    return parseInt(text.split('/')[0], 10);
  }

  async enterAboutMeStatus(aboutMeStatus: string) {
    if (aboutMeStatus?.length > 0 && aboutMeStatus.length < 128) {
      await this.inputs.aboutMe.fill(aboutMeStatus);
    }
  }

  async validateLength(aboutMeStatus: string): Promise<boolean> {
    const currentLength = await this.getAboutMeLength();
    return aboutMeStatus.length === currentLength;
  }

  async sendMessage(mentionText: string) {
    await this.inputs.mention.fill(mentionText);
    await this.inputs.mention.press('Enter');
  }

  async verifyAboutMeStatusInShortProfile(aboutMeStatus: string) {
    await this.profiles.displayName.click();
    await expect(this.texts.aboutMeInShortProfile).toHaveText(aboutMeStatus, { timeout: 500 });
  }
}
