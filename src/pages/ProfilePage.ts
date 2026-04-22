import ClanSelector from '@/data/selectors/ClanSelector';
import MessageSelector from '@/data/selectors/MessageSelector';
import ProfileSelector from '@/data/selectors/ProfileSelector';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, Locator, Page } from '@playwright/test';
import { differenceInDays, differenceInMonths, differenceInYears, formatDistance } from 'date-fns';
import { BasePage } from './BasePage';
import { MessagePage } from './MessagePage';

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
    await this.selector.inputs.mention.first().fill(mentionText);
    await this.selector.inputs.mention.first().press('Enter');
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

  async openFooterProfileModal() {
    await this.selector.footerProfile.container.click();
  }

  async openCustomStatusModal() {
    await this.selector.shortProfile.buttons.editCustomStatus.click();
  }

  async setCustomStatus(status: string) {
    await expect(this.selector.shortProfile.modal.customStatus.container).toBeVisible({
      timeout: 2000,
    });
    await this.selector.shortProfile.modal.customStatus.input.fill(status);
    await this.selector.shortProfile.modal.customStatus.buttons.save.click();
    await expect(this.selector.shortProfile.modal.customStatus.container).toBeHidden({
      timeout: 2000,
    });
  }
  async verifyCustomStatusSettedInShortProfile(status: string) {
    const customStatusLocator = this.selector.shortProfile.activityStatus.container;
    await expect(customStatusLocator).toHaveText(status, { timeout: 2000 });
  }

  async verifyCustomStatusSettedInFooterProfile(status: string) {
    const customStatusLocator = this.selector.footerProfile.userStatus;
    await expect(customStatusLocator).toHaveText(status, { timeout: 2000 });
  }

  async openShortProfileFromUsernameOnChat(username: string) {
    const messagePage = new MessagePage(this.page);
    const messageSelector = new MessageSelector(this.page);
    const messageLocator = await messagePage.getMessageWithProfileName(username);
    const displayNameLocator = messageLocator.locator(messageSelector.displayName);
    await displayNameLocator.click();
  }

  async closeSettingsProfile() {
    await this.selector.buttons.closeSettingProfile.click();
  }

  async getProfileStatusInFooterProfile() {
    const locator = this.selector.shortProfile.profileStatus.triggerButton;

    const statusText = await locator.locator('li').innerText();

    return statusText.trim();
  }

  async openSelectProfileStatusModal() {
    const buttonTrigger = this.selector.shortProfile.profileStatus.triggerButton;
    await expect(buttonTrigger).toBeVisible({ timeout: 3000 });
    await buttonTrigger.click();
  }

  async getProfileStatus(locator: Locator): Promise<string> {
    // console.log(await locator.getAttribute('class'));

    await this.page.waitForTimeout(2000);
    const red = locator.locator('.bg-red-500');
    const green = locator.locator('.bg-green-500');
    const gray = locator.locator('.bg-gray-400');

    if (await green.count()) return 'online';
    if (await red.count()) return 'Do Not Disturb';

    if (await locator.locator('svg.text-\\[\\#F0B232\\]').count()) return 'Idle';

    if ((await locator.locator('rect[stroke="#AEAEAE"]').count()) || (await gray.count()))
      return 'Invisible';

    return 'Unknown';
  }

  async setProfileStatus(newStatus: string, timeVisible?: string) {
    const statusLocator = this.selector.shortProfile.profileStatus.statusButton
      .filter({ hasText: newStatus })
      .last();
    await expect(statusLocator).toBeVisible({ timeout: 3000 });
    await statusLocator.click();
    const timeLocator = this.selector.shortProfile.profileStatus.statusButton
      .filter({ hasText: timeVisible })
      .first();
    if (timeVisible) {
      await timeLocator.click();
    }
  }

  async verifyNewStatusVisibleShortProfile(expectedStatus: string) {
    const previewStatus = this.selector.shortProfile.modal.container.locator(
      this.selector.shortProfile.profileStatus.status
    );

    console.log(previewStatus);

    const actualStatus = await this.getProfileStatus(previewStatus);

    expect(actualStatus).toBe(expectedStatus);
  }

  async verifyNewProfileStatusVisibleDueToLocator(userLocator: Locator, expectedStatus: string) {
    const profileStatus = userLocator.locator(this.selector.shortProfile.profileStatus.status);
    const actualStatus = await this.getProfileStatus(profileStatus);

    expect(actualStatus).toBe(expectedStatus);
  }

  async getUserProfileLocator() {
    return this.selector.shortProfile.modal.container.first();
  }

  async verifyMemberSinceInShortProfile(time: string | Date) {
    const date = new Date(time);

    const formatTime = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const memberSinceLocator = await this.selector.texts.aboutMeInShortProfile.last();

    await expect(memberSinceLocator).toHaveText(formatTime, { timeout: 500 });
  }

  async verifyMemberSinceJoinClanInMemberManagement(time: string | Date) {
    const clanSelector = new ClanSelector(this.page);

    const date = new Date(time);

    const formatTime = formatDistance(date, new Date(), {
      addSuffix: true,
    });

    const memberSinceLocator = clanSelector.memberSettings.memberSince.first();

    await expect(memberSinceLocator).toHaveText(formatTime, { timeout: 500 });
  }

  async verifyMemberSinceJoinMezonInMemberManagement(time: string | Date) {
    const clanSelector = new ClanSelector(this.page);

    const date = new Date(time);
    const now = new Date();

    const years = differenceInYears(now, date);
    const months = differenceInMonths(now, date);
    const days = differenceInDays(now, date);

    let formatTime = '';

    if (years > 0) {
      formatTime = `${years}y ago`;
    } else if (months > 0) {
      formatTime = `${months}mo ago`;
    } else {
      formatTime = `${days}d ago`;
    }

    const memberSinceLocator = clanSelector.memberSettings.joinMezon.first();

    await expect(memberSinceLocator).toHaveText(formatTime);
  }
}
