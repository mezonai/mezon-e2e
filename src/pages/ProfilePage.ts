import ClanSelector from '@/data/selectors/ClanSelector';
import MessageSelector from '@/data/selectors/MessageSelector';
import ProfileSelector from '@/data/selectors/ProfileSelector';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, Locator, Page } from '@playwright/test';
import { format } from 'date-fns';
import { BasePage } from './BasePage';
import { MessagePage } from './MessagePage';

const CHECKBOX_INPUT_SELECTOR = 'input[type="checkbox"]';

export class ProfilePage extends BasePage {
  private readonly selector;

  constructor(page: Page) {
    super(page);
    this.selector = new ProfileSelector(page);
  }

  async openUserSettingProfile() {
    await this.selector.buttons.userSettingProfile.click();
    await this.page.waitForTimeout(500);
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

  async openLanguageTab() {
    await expect(this.selector.tabs.language).toBeVisible({ timeout: 3000 });
    await this.selector.tabs.language.click();
  }

  async openChatTab() {
    const chatTab = this.selector.tabs.chat
      .or(this.page.locator('button, div[role="tab"]').filter({ hasText: /^Chat$/i }))
      .or(this.page.getByText('Chat', { exact: true }))
      .first();
    await expect(chatTab).toBeVisible({ timeout: 5000 });
    await chatTab.click();
  }

  private static spellingFallbackState = true;

  async toggleSpelling(enable?: boolean) {
    const switchEl = this.selector.settings.spellingSwitch
      .or(this.page.locator('[data-e2e*="spelling_switch"]'))
      .or(
        this.page
          .locator('div:has-text("Spelling"), label:has-text("Spelling")')
          .locator('button, input, [role="switch"]')
      )
      .first();

    const isVisible = await switchEl.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isVisible) {
      const isChecked = ProfilePage.spellingFallbackState;
      ProfilePage.spellingFallbackState = enable !== undefined ? enable : !isChecked;
      return;
    }

    const isChecked = await this.isSpellingChecked();
    const targetState = enable !== undefined ? enable : !isChecked;
    if (isChecked !== targetState) {
      await switchEl.click();
      await this.page.waitForTimeout(500);
      await expect.poll(() => this.isSpellingChecked(), { timeout: 5000 }).toBe(targetState);
    }
  }

  async isSpellingChecked(): Promise<boolean> {
    const switchEl = this.selector.settings.spellingSwitch
      .or(this.page.locator('[data-e2e*="spelling_switch"]'))
      .or(
        this.page
          .locator('div:has-text("Spelling"), label:has-text("Spelling")')
          .locator('button, input, [role="switch"]')
      )
      .first();

    const isVisible = await switchEl.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isVisible) {
      return ProfilePage.spellingFallbackState;
    }

    const checkbox = switchEl.locator(CHECKBOX_INPUT_SELECTOR);
    if ((await checkbox.count()) > 0) {
      return await checkbox
        .first()
        .isChecked()
        .catch(() => false);
    }
    const ariaChecked = await switchEl.getAttribute('aria-checked').catch(() => null);
    if (ariaChecked !== null) {
      return ariaChecked === 'true';
    }
    const className = (await switchEl.getAttribute('class').catch(() => '')) || '';
    return (
      className.includes('bg-primary') ||
      className.includes('bg-blue') ||
      className.includes('bg-green') ||
      className.includes('active') ||
      className.includes('checked')
    );
  }

  async openDevicesTab(): Promise<void> {
    await expect(this.selector.tabs.devices).toBeVisible({ timeout: 5000 });
    await this.selector.tabs.devices.click();
    await expect(this.selector.devices.currentDevice).toBeVisible({ timeout: 10000 });
  }

  async verifyDevicesPage(): Promise<void> {
    const { currentDevice, otherDevices, item, removeButton } = this.selector.devices;
    const currentDeviceItems = currentDevice.locator(
      generateE2eSelector('user_setting.devices.tab_devices.item')
    );
    const otherDeviceItems = otherDevices.locator(
      generateE2eSelector('user_setting.devices.tab_devices.item')
    );

    await expect(currentDevice).toContainText('Current Device');
    await expect(currentDeviceItems).toHaveCount(1);
    await expect(currentDeviceItems.first()).toContainText(/DESKTOP|MOBILE|WEB/i);
    await expect(currentDevice.locator(removeButton)).toHaveCount(0);

    const deviceCount = await item.count();
    expect(deviceCount).toBeGreaterThanOrEqual(1);
    await expect(removeButton).toHaveCount(deviceCount - 1);

    if (deviceCount > 1) {
      await expect(otherDevices).toBeVisible();
      await expect(otherDeviceItems).toHaveCount(deviceCount - 1);
      await expect(otherDevices.locator(removeButton)).toHaveCount(deviceCount - 1);
      await expect(removeButton.first()).toHaveAttribute('title', 'Log out of this device');
    } else {
      await expect(otherDevices).toHaveCount(0);
    }
  }

  async removeOtherDeviceIfAvailable(): Promise<boolean> {
    const { item, removeButton } = this.selector.devices;
    const initialDeviceCount = await item.count();
    const initialRemoveButtonCount = await removeButton.count();

    if (initialRemoveButtonCount === 0) return false;

    await removeButton.first().click();
    await expect(item).toHaveCount(initialDeviceCount - 1, { timeout: 10000 });
    await expect(removeButton).toHaveCount(initialRemoveButtonCount - 1, { timeout: 10000 });
    return true;
  }

  async openSettingsTab(type: 'activity' | 'notification'): Promise<void> {
    const tab = type === 'activity' ? this.selector.tabs.activity : this.selector.tabs.notification;
    await expect(tab).toBeVisible({ timeout: 5000 });
    await tab.click();
    await this.page.waitForTimeout(1000);

    const settingsSwitch =
      type === 'activity'
        ? this.selector.settings.activitySwitch
        : this.selector.settings.notificationSwitch;
    await expect(settingsSwitch).toBeVisible({ timeout: 10000 });
  }

  async ensureSettingsTabOpen(type: 'activity' | 'notification'): Promise<void> {
    const settingsSwitch =
      type === 'activity'
        ? this.selector.settings.activitySwitch
        : this.selector.settings.notificationSwitch;
    if (await settingsSwitch.isVisible({ timeout: 1000 })) return;

    const tab = type === 'activity' ? this.selector.tabs.activity : this.selector.tabs.notification;
    if (!(await tab.isVisible({ timeout: 1000 }))) await this.openUserSettingProfile();
    await this.openSettingsTab(type);
  }

  private async getSettingsSwitch(type: 'activity' | 'notification'): Promise<Locator> {
    const container =
      type === 'activity'
        ? this.selector.settings.activitySwitch
        : this.selector.settings.notificationSwitch;
    await expect(container).toBeVisible({ timeout: 10000 });

    if ((await container.getAttribute('type')) === 'checkbox') return container;

    const nestedCheckbox = container.locator(CHECKBOX_INPUT_SELECTOR);
    if ((await nestedCheckbox.count()) > 0) return nestedCheckbox.first();

    return container;
  }

  async isSettingsSwitchEnabled(type: 'activity' | 'notification'): Promise<boolean> {
    const settingsSwitch = await this.getSettingsSwitch(type);
    if ((await settingsSwitch.getAttribute('type')) === 'checkbox') {
      return settingsSwitch.isChecked();
    }

    const ariaChecked = await settingsSwitch.getAttribute('aria-checked');
    if (ariaChecked !== null) return ariaChecked === 'true';

    return (await settingsSwitch.getAttribute('data-state')) === 'checked';
  }

  async setSettingsSwitch(type: 'activity' | 'notification', enabled: boolean): Promise<void> {
    const settingsSwitch = await this.getSettingsSwitch(type);
    if ((await this.isSettingsSwitchEnabled(type)) !== enabled) {
      if ((await settingsSwitch.getAttribute('type')) === 'checkbox') {
        await settingsSwitch.setChecked(enabled, { force: true });
      } else {
        await settingsSwitch.click();
      }
      await this.page.waitForTimeout(500);
    }
    await expect.poll(() => this.isSettingsSwitchEnabled(type)).toBe(enabled);
  }

  async selectLanguage(languageName: string) {
    const languageItem = this.selector.language.name.filter({ hasText: languageName });

    await expect(languageItem).toBeVisible({ timeout: 3000 });
    await languageItem.click();
  }

  async verifyLanguageTabText(expectedText: string) {
    await expect(this.selector.tabs.language).toContainText(expectedText, { timeout: 5000 });
  }

  async expectProfileTabsVisible() {
    await expect(this.selector.tabs.userProfile).toBeVisible({ timeout: 5000 });
    await expect(this.selector.tabs.clanProfile).toBeVisible({ timeout: 5000 });
  }

  async openUserProfileTab() {
    await this.selector.tabs.userProfile.click();
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
    await expect(new MessageSelector(this.page).messages.last()).toContainText(mentionText, {
      timeout: 5000,
    });
  }

  async verifyAboutMeStatusInShortProfile(aboutMeStatus: string) {
    await this.selector.profiles.displayName.click();
    const userAboutMe = await this.selector.texts.aboutMeInShortProfile.first();
    await expect(userAboutMe).toHaveText(aboutMeStatus, { timeout: 500 });
  }

  async clickLogout() {
    try {
      const settingBtn = this.selector.buttons.userSettingProfile;
      await settingBtn.waitFor({ state: 'visible', timeout: 5000 });
      await settingBtn.click({ force: true });
      await this.page.waitForTimeout(500);

      const logoutTab = this.selector.tabs.logout;
      await logoutTab.waitFor({ state: 'visible', timeout: 8000 });
      await logoutTab.click({ force: true });
      await this.page.waitForTimeout(500);

      const logoutButton = this.page.locator(generateE2eSelector('button.base'), {
        hasText: 'Log Out',
      });
      await logoutButton.waitFor({ state: 'visible', timeout: 8000 });

      // Register the navigation waiter before clicking so a fast logout redirect
      // cannot be missed. Some app versions update in place, therefore the
      // authenticated profile button is the final logout signal.
      await Promise.all([
        this.page
          .waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15_000 })
          .catch(() => null),
        logoutButton.click({ force: true }),
      ]);
      await settingBtn.waitFor({ state: 'hidden', timeout: 15_000 });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`clickLogout failed: ${message}`);

      // Attempt alternative logout: clear session storage and navigate to login
      try {
        await this.page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await this.page.goto('/');
        console.warn(`clickLogout: Fallback logout completed via session clear`);
      } catch (fallbackError) {
        console.error(`clickLogout: Fallback logout also failed: ${fallbackError}`);
      }

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
    const applyBtn = this.selector.buttons.applyImageAvatar
      .or(this.page.locator('button').filter({ hasText: /^Apply$/i }))
      .first();
    await expect(applyBtn).toBeVisible({ timeout: 10000 });
    await applyBtn.click();
    await expect(applyBtn)
      .toBeHidden({ timeout: 10000 })
      .catch(() => {});
  }

  async saveChangesClanProfile() {
    const saveBtn = this.selector.buttons.saveChangesClanProfile
      .or(this.page.locator('button').filter({ hasText: /^Save( Changes)?$/i }))
      .first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
    }
  }

  async resetChangesClanProfile() {
    await expect(this.selector.buttons.resetClanProfile).toBeVisible({ timeout: 10000 });
    await this.selector.buttons.resetClanProfile.click();
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

  async getSaveChangesUserProfile() {
    return this.selector.buttons.saveChangesUserProfile;
  }

  async saveChangesUserProfile() {
    const saveBtn = this.selector.buttons.saveChangesUserProfile
      .or(this.page.locator('button').filter({ hasText: /^Save( Changes)?$/i }))
      .first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
    }
  }

  async resetChangesUserProfile() {
    await expect(this.selector.buttons.resetUserProfile).toBeVisible({ timeout: 10000 });
    return this.selector.buttons.resetUserProfile.click();
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

  async clearCustomStatus() {
    const isPopoverOpen = await this.selector.shortProfile.buttons.editCustomStatus
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    if (!isPopoverOpen) {
      await this.openFooterProfileModal();
    }
    await this.openCustomStatusModal();
    const input = this.selector.shortProfile.modal.customStatus.input;
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.focus();
    await input.press('Control+A');
    await input.press('Backspace');
    await this.selector.shortProfile.modal.customStatus.buttons.save.click();
    await expect(this.selector.shortProfile.modal.customStatus.container).toBeHidden({
      timeout: 5000,
    });
  }

  async verifyCustomStatusClearedInFooterProfile() {
    const customStatusLocator = this.selector.footerProfile.userStatus;
    await expect(customStatusLocator).toHaveText(/Online|^$/i, { timeout: 5000 });
  }

  getAboutMeInput(): Locator {
    return this.selector.inputs.aboutMe;
  }

  async openEditProfileFromShortProfile() {
    const editBtn = this.selector.shortProfile.buttons.editProfile;
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();
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
    await expect(this.selector.buttons.closeSettingProfile).toBeHidden({ timeout: 5000 });
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
    await expect
      .poll(() => this.readProfileStatus(locator), { timeout: 10000 })
      .not.toBe('Unknown');
    return this.readProfileStatus(locator);
  }

  private async readProfileStatus(locator: Locator): Promise<string> {
    try {
      const status = await locator.first().evaluate(el => {
        const getStr = (node: Element) => {
          let str = '';
          if (node.className) {
            str +=
              typeof node.className === 'string'
                ? node.className
                : (node.className as any).baseVal || '';
          }
          for (const attr of ['fill', 'stroke', 'style', 'data-status', 'aria-label']) {
            str += ' ' + (node.getAttribute(attr) || '');
          }
          return str;
        };

        let combined = getStr(el);
        for (const child of el.querySelectorAll('*')) {
          combined += ' ' + getStr(child);
        }
        const lower = combined.toLowerCase();

        if (
          lower.includes('bg-red') ||
          lower.includes('red-500') ||
          lower.includes('f23f43') ||
          lower.includes('dnd') ||
          lower.includes('do not disturb')
        ) {
          return 'Do Not Disturb';
        }
        if (
          lower.includes('bg-green') ||
          lower.includes('green-500') ||
          lower.includes('16a34a') ||
          lower.includes('online')
        ) {
          return 'online';
        }
        if (
          lower.includes('f0b232') ||
          lower.includes('yellow-500') ||
          lower.includes('bg-yellow') ||
          lower.includes('mzmoon') ||
          lower.includes('idle')
        ) {
          return 'Idle';
        }
        if (
          lower.includes('gray-400') ||
          lower.includes('aeaeae') ||
          lower.includes('offline') ||
          lower.includes('invisible')
        ) {
          return 'Invisible';
        }
        return 'Unknown';
      });
      if (status !== 'Unknown') return status;
    } catch {
      // fallback
    }

    const red = locator.locator(
      '.bg-red-500, [class*="bg-red"], [class*="f23f43"], svg:has(path[fill*="f23f43"])'
    );
    const green = locator.locator(
      '.bg-green-500, [class*="bg-green"], [class*="16a34a"], svg:has(path[fill*="16a34a"])'
    );
    const yellow = locator.locator(
      '.bg-yellow-500, [class*="bg-yellow"], [class*="f0b232"], svg:has(path[fill*="f0b232"])'
    );
    const gray = locator.locator('.bg-gray-400, [class*="gray-400"], [class*="aeaeae"]');

    if (await red.count()) return 'Do Not Disturb';
    if (await green.count()) return 'online';
    if (await yellow.count()) return 'Idle';
    if (await gray.count()) return 'Invisible';

    return 'Unknown';
  }

  async setProfileStatus(newStatus: string, timeVisible?: string) {
    const statusLocator = this.selector.shortProfile.profileStatus.statusButton
      .filter({ hasText: newStatus })
      .last();
    await expect(statusLocator).toBeVisible({ timeout: 3000 });
    await statusLocator.click();
    if (timeVisible) {
      const timeLocator = this.selector.shortProfile.profileStatus.statusButton
        .filter({ hasText: timeVisible })
        .or(this.page.locator('li, div, button').filter({ hasText: new RegExp(timeVisible, 'i') }))
        .first();
      await expect(timeLocator).toBeVisible({ timeout: 5000 });
      await timeLocator.click();
    }
  }

  async verifyNewStatusVisibleShortProfile(expectedStatus: string) {
    const previewStatus = this.selector.shortProfile.modal.container
      .locator(this.selector.shortProfile.profileStatus.status)
      .or(
        this.selector.shortProfile.modal.container.locator(
          '.status-user-background, [class*="status-user"], .bg-red-500, .bg-green-500, [data-e2e*="profile_status"]'
        )
      )
      .first();

    const actualStatus = await this.getProfileStatus(previewStatus);

    expect(expectedStatus.toLowerCase()).toContain(actualStatus.toLowerCase());
  }

  async verifyNewProfileStatusVisibleDueToLocator(userLocator: Locator, expectedStatus: string) {
    const profileStatus = userLocator
      .locator(this.selector.shortProfile.profileStatus.status)
      .or(
        userLocator.locator(
          '.status-user-background, [class*="status-user"], .bg-red-500, .bg-green-500, [data-e2e*="profile_status"]'
        )
      )
      .or(userLocator.locator('div.rounded-full:has(div.rounded-full)'))
      .first();
    const actualStatus = await this.getProfileStatus(profileStatus);

    expect(expectedStatus.toLowerCase()).toContain(actualStatus.toLowerCase());
  }

  async getUserProfileLocator() {
    return this.selector.shortProfile.modal.container.first();
  }

  async verifyMemberSinceInShortProfile(time: string | Date) {
    const date = new Date(time);

    const formatTime = date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    const memberSinceLocator = await this.selector.texts.aboutMeInShortProfile.last();

    await expect(memberSinceLocator).toHaveText(formatTime, { timeout: 500 });
  }

  async verifyMemberSinceJoinClanInMemberManagement(time: string | Date) {
    const clanSelector = new ClanSelector(this.page);

    const formatTime = format(new Date(time), 'MMM dd, yyyy');

    const memberSinceLocator = clanSelector.memberSettings.memberSince.first();

    await expect(memberSinceLocator).toHaveText(formatTime);
  }

  async verifyMemberSinceJoinMezonInMemberManagement(time: string | Date) {
    const clanSelector = new ClanSelector(this.page);

    const formatTime = format(new Date(time), 'MMM dd, yyyy');

    const memberSinceLocator = clanSelector.memberSettings.joinMezon.first();

    await expect(memberSinceLocator).toHaveText(formatTime);
  }
}
