import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ClanPageV2 } from './ClanPageV2';

export class ChannelSettingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  readonly side_bar_buttons = {
    integrations: this.page.locator(generateE2eSelector('channel_setting_page.side_bar.item'), {
      hasText: 'Integrations',
    }),
    permissions: this.page.locator(generateE2eSelector('channel_setting_page.side_bar.item'), {
      hasText: 'Permissions',
    }),
  };

  readonly webhook = {
    create_webhook_button: this.page.locator(
      generateE2eSelector('channel_setting_page.webhook.button.create_webhook')
    ),
    new_webhook_button: this.page.locator(
      generateE2eSelector('channel_setting_page.webhook.button.new_webhook')
    ),
    view_webhook_button: this.page.locator(
      generateE2eSelector('channel_setting_page.webhook.button.view_webhook')
    ),
  };

  readonly permissions = {
    button: {
      change_status: this.page.locator(
        generateE2eSelector('channel_setting_page.permissions.button.change_status')
      ),
    },
    section: {
      member_role_section: this.page.locator(
        generateE2eSelector('channel_setting_page.permissions.section.member_role_management')
      ),
      member_role_management: {
        role_list: this.page.locator(
          generateE2eSelector(
            'channel_setting_page.permissions.section.member_role_management.role_list'
          )
        ),
        role_item: this.page.locator(
          generateE2eSelector(
            'channel_setting_page.permissions.section.member_role_management.role_list.role_item'
          )
        ),
        member_list: this.page.locator(
          generateE2eSelector(
            'channel_setting_page.permissions.section.member_role_management.member_list'
          )
        ),
        member_item: this.page.locator(
          generateE2eSelector(
            'channel_setting_page.permissions.section.member_role_management.member_list.member_item'
          )
        ),
      },

      advanced_permissions_section: this.page.locator(
        generateE2eSelector('channel_setting_page.permissions.section.advanced_permissions')
      ),
    },
    modal: {
      ask_change: {
        button: {
          reset: this.page.locator(
            generateE2eSelector('channel_setting_page.permissions.modal.ask_change.button.reset')
          ),
          save_changes: this.page.locator(
            generateE2eSelector(
              'channel_setting_page.permissions.modal.ask_change.button.save_changes'
            )
          ),
        },
      },
    },
  };

  readonly button = {
    close_settings: this.page.locator(generateE2eSelector('clan_page.settings.button.exit')),
  };

  async createChannelWebhook(): Promise<void> {
    await this.side_bar_buttons.integrations.click();
    await this.webhook.create_webhook_button.click();
    await this.webhook.new_webhook_button.click();
    await this.page.waitForTimeout(500);
    await this.webhook.view_webhook_button.click();
    await this.page.waitForTimeout(500);
  }

  async changeChannelStatus(): Promise<boolean> {
    await this.side_bar_buttons.permissions.click();
    await this.permissions.button.change_status.click();
    try {
      await this.permissions.modal.ask_change.button.save_changes.waitFor({ state: 'visible' });
      await this.permissions.modal.ask_change.button.save_changes.click();
      return true;
    } catch {
      return false;
    }
  }

  async verifyChannelStatusIsPrivate(channelName: string): Promise<boolean> {
    const clanPage = new ClanPageV2(this.page);
    await this.page.waitForLoadState('networkidle');
    try {
      await this.permissions.section.member_role_section.waitFor({ state: 'visible' });
      await this.permissions.section.advanced_permissions_section.waitFor({ state: 'visible' });
    } catch {
      return false;
    }

    await this.permissions.section.member_role_management.member_list.waitFor({ state: 'visible' });
    const memberItemCount =
      await this.permissions.section.member_role_management.member_list.count();
    if (memberItemCount !== 1) return false;

    await this.button.close_settings.click();

    const membersButton = clanPage.header.button.member.nth(0);
    await membersButton.waitFor({ state: 'visible' });
    await membersButton.click();

    const members = clanPage.secondarySideBar.member;
    await members.waitFor({ state: 'visible' });
    const memberCount = await members.count();
    if (memberCount !== 1) return false;

    const channelIconLock = clanPage.sidebar.channelItem.item.filter({
      has: clanPage.sidebar.channelItem.iconHashtagLock,
      hasText: channelName,
    });
    await channelIconLock.waitFor({ state: 'visible' });
    return channelIconLock.isVisible();
  }

  async verifyChannelStatusIsPublic(channelName: string): Promise<boolean> {
    const clanPage = new ClanPageV2(this.page);
    await this.page.waitForLoadState('networkidle');
    try {
      await this.permissions.section.member_role_section.waitFor({ state: 'hidden' });
      await this.permissions.section.advanced_permissions_section.waitFor({ state: 'hidden' });
    } catch {
      return false;
    }

    await this.button.close_settings.click();

    const channelIconLock = clanPage.sidebar.channelItem.item.filter({
      has: clanPage.sidebar.channelItem.iconHashtag,
      hasText: channelName,
    });
    await channelIconLock.waitFor({ state: 'visible' });
    return channelIconLock.isVisible();
  }
}
