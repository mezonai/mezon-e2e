import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ClanPage } from './Clan/ClanPage';

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
    channel_label: this.page.locator(
      generateE2eSelector('channel_setting_page.side_bar.channel_label')
    ),
    quick_menu: this.page.locator(generateE2eSelector('channel_setting_page.side_bar.item'), {
      hasText: 'Quick Menu',
    }),
    deleteChannel: this.page.locator(generateE2eSelector('button.base'), {
      hasText: 'Delete Channel',
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

  readonly quick_menu = {
    flashMessagesTab: this.page.locator(
      generateE2eSelector('channel_setting_page.quick_menu.tab'),
      { hasText: 'Flash Messages' }
    ),
    quickMenusTab: this.page.locator(generateE2eSelector('channel_setting_page.quick_menu.tab'), {
      hasText: 'Quick Menus',
    }),
    button: {
      addFlashMessage: this.page.locator(
        generateE2eSelector('channel_setting_page.quick_menu.button.add'),
        { hasText: 'Add Flash Message' }
      ),
      addQuickMenu: this.page.locator(
        generateE2eSelector('channel_setting_page.quick_menu.button.add'),
        { hasText: 'Add Quick Menu' }
      ),
    },
    modal: {
      container: this.page.locator(generateE2eSelector('channel_setting_page.quick_menu.modal')),
      input: {
        command: this.page.locator(
          generateE2eSelector('channel_setting_page.quick_menu.modal.input.command_name')
        ),
        messageContent: this.page.locator(
          generateE2eSelector('channel_setting_page.quick_menu.modal.input.message_content')
        ),
      },
      button: {
        submit: this.page.locator(
          generateE2eSelector('channel_setting_page.quick_menu.modal.button.submit')
        ),
        cancel: this.page.locator(
          generateE2eSelector('channel_setting_page.quick_menu.modal.button.cancel')
        ),
      },
    },
    item: {
      container: this.page.locator(generateE2eSelector('channel_setting_page.quick_menu.item')),
    },
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
    const clanPage = new ClanPage(this.page);
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

    const members = clanPage.secondarySideBar.member.item;
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
    const clanPage = new ClanPage(this.page);
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

  async openQuickMenuSettings(): Promise<void> {
    await expect(this.side_bar_buttons.quick_menu).toBeVisible({ timeout: 3000 });

    await this.side_bar_buttons.quick_menu.click();
    await this.page.waitForTimeout(500);
  }

  async openFlashMessageModal(): Promise<void> {
    await expect(this.quick_menu.flashMessagesTab).toBeVisible({ timeout: 3000 });

    await this.quick_menu.flashMessagesTab.click();
    await expect(this.quick_menu.button.addFlashMessage).toBeVisible({
      timeout: 3000,
    });

    await this.quick_menu.button.addFlashMessage.click();
    await expect(this.quick_menu.modal.container).toBeVisible({ timeout: 3000 });
  }

  async createFlashMessage(command: string, messageContent: string): Promise<void> {
    await this.quick_menu.modal.input.command.fill(command);
    await this.quick_menu.modal.input.messageContent.fill(messageContent);
    await this.quick_menu.modal.button.submit.click();
    expect(this.quick_menu.modal.container).toBeHidden({ timeout: 5000 });
  }

  async verifyFlashMessageInQuickMenuList(command: string, messageContent: string): Promise<void> {
    const itemLocator = this.page.locator(
      generateE2eSelector('channel_setting_page.quick_menu.item')
    );

    const commandLocator = this.page
      .locator(generateE2eSelector('channel_setting_page.quick_menu.item.command'))
      .filter({ hasText: command });

    const messageLocator = this.page
      .locator(generateE2eSelector('channel_setting_page.quick_menu.item.message_content'))
      .filter({ hasText: messageContent });

    const matchedItem = itemLocator.filter({ has: commandLocator }).filter({ has: messageLocator });

    await expect(matchedItem).toBeVisible();
  }

  async closeChannelSettings() {
    await this.button.close_settings.click();
    await expect(this.side_bar_buttons.quick_menu).toBeHidden({ timeout: 3000 });
  }

  async deleteChannel() {
    const deleteButton = this.side_bar_buttons.deleteChannel;
    await expect(deleteButton).toBeVisible({ timeout: 3000 });

    await deleteButton.click();
    const popup = this.page.locator('div.fixed.inset-0.flex.items-center.justify-center.z-50');
    await expect(popup).toBeVisible({ timeout: 5000 });

    const confirmButton = popup.locator(generateE2eSelector('modal.confirm_modal.button.confirm'));
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    await expect(popup).toBeHidden({ timeout: 5000 });
    await this.page.waitForTimeout(2000);
  }
}
