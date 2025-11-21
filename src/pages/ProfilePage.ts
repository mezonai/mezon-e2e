import ProfileSelector from '@/data/selectors/ProfileSelector';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  private readonly selector;

  constructor(page: Page) {
    super(page);
    this.selector = new ProfileSelector(page);
  }

  async openUserSettingProfile() {
    await this.selector.buttons.userSettingProfile.click();
  }

  async openProfileTab() {
    await this.selector.tabs.profile.click();
  }

  async openClanProfileTab() {
    await this.selector.tabs.clanProfile.click();
  }

  async openAccountTab() {
    await this.selector.tabs.account.click();
  }

  async expectProfileTabsVisible() {
    await expect(this.selector.tabs.userProfile).toBeVisible({ timeout: 5000 });
    await expect(this.selector.tabs.clanProfile).toBeVisible({ timeout: 5000 });
  }

  async openUserProfileTab() {
    await this.selector.tabs.userProfile.click();
  }

  async verifyDisplayNameUpdated(displayName: string) {
    await expect(this.selector.inputs.displayName).toHaveValue(displayName, { timeout: 2000 });
  }

  async verifyAboutMeStatusUpdated(aboutMeStatus: string) {
    await expect(this.selector.inputs.aboutMe).toHaveValue(aboutMeStatus, { timeout: 2000 });
  }

  async getAboutMeLength(): Promise<number> {
    const text = await this.selector.texts.aboutMeLength.innerText();
    return parseInt(text.split('/')[0], 10);
  }

  async enterAboutMeStatus(aboutMeStatus: string) {
    if (aboutMeStatus?.length > 0 && aboutMeStatus.length < 128) {
      await this.selector.inputs.aboutMe.fill(aboutMeStatus);
    }
  }

  async validateLength(aboutMeStatus: string): Promise<boolean> {
    const currentLength = await this.getAboutMeLength();
    return aboutMeStatus.length === currentLength;
  }

  async getProfileName(): Promise<string> {
    return await this.selector.userProfile.displayName.innerText();
  }

  async sendMessage(mentionText: string) {
    await this.selector.inputs.mention.fill(mentionText);
    await this.selector.inputs.mention.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async verifyAboutMeStatusInShortProfile(aboutMeStatus: string) {
    await this.selector.profiles.displayName.click();
    const userAboutMe = await this.selector.texts.aboutMeInShortProfile.first();
    await expect(userAboutMe).toHaveText(aboutMeStatus, { timeout: 500 });
  }

  async clickLogout() {
    await this.selector.buttons.userSettingProfile.click();
    await this.selector.tabs.logout.click();
    const logoutButton = this.page.locator(generateE2eSelector('button.base'), {
      hasText: 'Log Out',
    });
    try {
      await logoutButton.waitFor({ state: 'visible', timeout: 5000 });
      await logoutButton.click();
      return true;
    } catch {
      return false;
    }
  }

  async updateClanNickname(name: string) {
    await this.openUserSettingProfile();
    await this.openProfileTab();
    await this.openClanProfileTab();
    const nicknameInput = this.selector.inputs.nickname;
    await expect(nicknameInput).toBeVisible({ timeout: 2000 });
    await nicknameInput.waitFor({ state: 'attached' });

    await nicknameInput.focus();
    await this.page.waitForTimeout(1000);

    await nicknameInput.press('Control+A');
    await nicknameInput.press('Backspace');
    await this.page.keyboard.type(name, { delay: 120 });

    const saveChangesBtn = this.selector.buttons.saveChangesClanProfile;
    await saveChangesBtn.click();
    await this.selector.buttons.closeSettingProfile.click();
  }

  async applyImageAvatar() {
    await this.selector.buttons.applyImageAvatar.click();
  }

  async saveChangesClanProfile() {
    await this.selector.buttons.saveChangesClanProfile.click();
  }

  async getClanProfileAvatar() {
    return this.selector.clanProfile.avatar;
  }

  async getChangeAvatarButton() {
    return this.selector.buttons.changeAvatar;
  }

  async getInputNickname() {
    return this.selector.inputs.nickname;
  }

  async getEditUserProfileButton() {
    return this.selector.buttons.editUserprofile;
  }

  async getEditDisplayNameButton() {
    return this.selector.buttons.editDisplayName;
  }

  async getEditUserNameButton() {
    return this.selector.buttons.editUserName;
  }

  async getSaveChangesUserProfile() {
    return this.selector.buttons.saveChangesUserProfile;
  }

  async saveChangesUserProfile() {
    return this.selector.buttons.saveChangesUserProfile.click();
  }

  async getUserProfileAvatar() {
    return this.selector.userProfile.avatar;
  }
}
