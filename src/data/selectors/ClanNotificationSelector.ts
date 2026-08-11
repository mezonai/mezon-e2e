import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Locator, Page } from '@playwright/test';

export type ClanNotificationOption = 'All' | 'Only @mention' | 'Nothing';
export type ClanOverrideOption = 'ALL' | 'MENTIONS' | 'NOTHING' | 'MUTE';

export default class ClanNotificationSelector {
  constructor(private readonly page: Page) {}

  readonly menu = {
    clanName: this.page.locator(`${generateE2eSelector('clan_page.header.title.clan_name')} p`),
    notificationSettings: this.page.locator(
      generateE2eSelector('clan_page.header.modal_panel.item'),
      { hasText: 'Notification Settings' }
    ),
  };

  readonly modal = {
    selectItem: this.page
      .locator(generateE2eSelector('modal.notification_setting.select.item'))
      .or(this.page.getByRole('radio')),
    exitButton: this.page
      .locator(generateE2eSelector('modal.notification_setting.override.button.exit'))
      .or(
        this.page.getByText('Notification Setting', { exact: true }).locator('..').locator('svg')
      ),
    override: {
      selectItem: this.page.locator(
        generateE2eSelector('modal.notification_setting.override.select_trigger.item')
      ),
      channelTitle: this.page.locator(
        generateE2eSelector('modal.notification_setting.override.channel_item.title')
      ),
      settingControl: this.page.locator(
        generateE2eSelector('modal.notification_setting.override.channel_item.checkbox')
      ),
      removeButton: this.page.locator(
        generateE2eSelector('modal.notification_setting.override.button.remove')
      ),
    },
  };

  getSettingOption(option: ClanNotificationOption): Locator {
    return this.modal.selectItem.filter({ hasText: new RegExp(`^${option}$`) });
  }

  getSettingRadio(option: ClanNotificationOption): Locator {
    return this.page.getByRole('radio', { name: option, exact: true });
  }

  getOverrideSelectTrigger(): Locator {
    return this.modal.override.selectItem
      .filter({ hasText: 'Select a channel or category...' })
      .or(this.page.getByRole('combobox'));
  }

  getOverrideChannelOption(channelName: string): Locator {
    return this.modal.override.selectItem
      .filter({ hasText: new RegExp(`^${channelName}$`, 'i') })
      .or(this.page.getByText(channelName, { exact: true }))
      .last();
  }

  getOverrideChannelTitle(channelName: string): Locator {
    return this.modal.override.channelTitle.filter({
      hasText: new RegExp(`^${channelName}$`, 'i'),
    });
  }

  getOverrideControl(option: ClanOverrideOption): Locator {
    const indexes = { ALL: 0, MENTIONS: 1, NOTHING: 2, MUTE: 3 } as const;
    return this.modal.override.settingControl.nth(indexes[option]);
  }
}
