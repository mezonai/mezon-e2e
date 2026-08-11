import ClanNotificationSelector, {
  ClanNotificationOption,
  ClanOverrideOption,
} from '@/data/selectors/ClanNotificationSelector';
import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class ClanNotificationPage extends BasePage {
  readonly selector: ClanNotificationSelector;

  constructor(page: Page) {
    super(page);
    this.selector = new ClanNotificationSelector(page);
  }

  async open(): Promise<void> {
    await this.selector.menu.clanName.click();
    await expect(this.selector.menu.notificationSettings).toBeVisible({ timeout: 3000 });
    await this.selector.menu.notificationSettings.click();
    await expect(this.selector.modal.selectItem.first()).toBeVisible({ timeout: 5000 });
  }

  async selectSetting(option: ClanNotificationOption): Promise<void> {
    const item = this.selector.getSettingOption(option);
    const radio = this.selector.getSettingRadio(option);
    await expect(item).toBeVisible({ timeout: 3000 });
    await radio.click();
    await expect(radio).toBeChecked();
  }

  async close(): Promise<void> {
    if (await this.selector.modal.exitButton.isVisible()) {
      await this.selector.modal.exitButton.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await expect(this.selector.modal.selectItem.first()).toBeHidden({ timeout: 3000 });
  }

  async verifySetting(option: ClanNotificationOption): Promise<void> {
    await expect(this.selector.getSettingOption(option)).toBeVisible({ timeout: 3000 });
    await expect(this.selector.getSettingRadio(option)).toBeChecked();
  }

  async addOverride(channelName: string): Promise<void> {
    await this.selector.getOverrideSelectTrigger().click();
    const channelOption = this.selector.getOverrideChannelOption(channelName);
    await expect(channelOption).toBeVisible({ timeout: 3000 });
    await channelOption.click();
    await expect(this.selector.getOverrideChannelTitle(channelName)).toBeVisible({ timeout: 3000 });
  }

  async verifyOverrideControls(): Promise<void> {
    await expect(this.selector.modal.override.settingControl).toHaveCount(4);
  }

  async selectOverrideOption(option: Exclude<ClanOverrideOption, 'MUTE'>): Promise<void> {
    const control = this.selector.getOverrideControl(option);
    await control.click();
    await expect(control).toBeChecked();
    for (const other of ['ALL', 'MENTIONS', 'NOTHING'] as const) {
      if (other !== option) await expect(this.selector.getOverrideControl(other)).not.toBeChecked();
    }
  }

  async setMute(checked: boolean): Promise<void> {
    const mute = this.selector.getOverrideControl('MUTE');
    if ((await mute.isChecked()) !== checked) await mute.click();
    await expect(mute).toBeChecked({ checked });
  }

  async verifyOverrideState(
    option: Exclude<ClanOverrideOption, 'MUTE'>,
    muted: boolean
  ): Promise<void> {
    await expect(this.selector.getOverrideControl(option)).toBeChecked();
    await expect(this.selector.getOverrideControl('MUTE')).toBeChecked({ checked: muted });
  }

  async removeOverride(channelName: string): Promise<void> {
    const channelTitle = this.selector.getOverrideChannelTitle(channelName);
    await channelTitle.hover();
    await expect(this.selector.modal.override.removeButton).toBeVisible({ timeout: 3000 });
    await this.selector.modal.override.removeButton.click();
    await expect(channelTitle).toBeHidden({ timeout: 3000 });
  }
}
