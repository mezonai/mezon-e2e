import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class ClanSettingSelector {
  constructor(private readonly page: Page) {}

  readonly buttons = {
    sidebarItem: this.page.locator(generateE2eSelector('clan_page.settings.sidebar.item')),
    uploadEmoji: this.page.locator(generateE2eSelector('clan_page.settings.emoji.upload')),
    uploadVoiceSticker: this.page.locator(
      generateE2eSelector('clan_page.settings.voice_sticker.button_upload')
    ),
    enableOnboarding: this.page.locator(
      generateE2eSelector('clan_page.settings.onboarding.button.enable_onboarding')
    ),
    editClanGuide: this.page.locator(
      generateE2eSelector('clan_page.settings.onboarding.button.clan_guide')
    ),
    addResource: this.page.locator(
      generateE2eSelector('clan_page.settings.onboarding.button.add_resources')
    ),
    enableCommunity: this.page.locator(
      generateE2eSelector('clan_page.settings.community.button.enable_community')
    ),
    closeSettingClan: this.page.locator(generateE2eSelector('user_setting.account.exit_setting')),
    clanName: this.page.locator(generateE2eSelector('clan_page.header.title.clan_name')),
  };

  readonly general = {
    clanName: this.page.locator(generateE2eSelector('clan_page.settings.overview.input.clan_name')),
    settings_page: this.page.locator(generateE2eSelector('clan_page.settings')),
    buttons: {
      sidebarItem: this.buttons.sidebarItem,
      roleSettings: this.buttons.sidebarItem.filter({ hasText: 'Roles' }),
      integrations: this.buttons.sidebarItem.filter({ hasText: 'Integrations' }),
      auditLog: this.buttons.sidebarItem.filter({ hasText: 'Audit Log' }),
      createRole: this.page.locator(generateE2eSelector('button.base'), {
        hasText: 'Create Role',
      }),
      displayRoleOption: this.page.locator(
        generateE2eSelector('clan_page.settings.role.container.role_option.display')
      ),
      permissionsRole: this.page.locator(
        generateE2eSelector('clan_page.settings.role.container.role_option.permissions')
      ),
      roleColor: this.page.locator(
        generateE2eSelector('clan_page.settings.role.container.role_color')
      ),
      deleteClan: this.page.locator(generateE2eSelector('clan_page.settings.sidebar.delete')),
    },
    input: {
      roleName: this.page.locator(
        `${generateE2eSelector('clan_page.settings.role.container.name_input')} input`
      ),
    },
    roleContainer: this.page.locator(generateE2eSelector('clan_page.settings.role.container')),
    rolePermissionsItem: this.page.locator(
      generateE2eSelector('clan_page.settings.role.container.role_option.permissions.item')
    ),
    rolePermissionsSwitch: this.page.locator(
      generateE2eSelector('clan_page.settings.role.container.role_option.permissions.item.switch')
    ),
    sidebarTitle: this.page.locator(generateE2eSelector('clan_page.settings.sidebar.title')),
    roleList: {
      item: this.page.locator(generateE2eSelector('clan_page.settings.role.item')),
      roleName: this.page.locator(generateE2eSelector('clan_page.settings.role.item.role_name')),
      memberCount: this.page.locator(
        generateE2eSelector('clan_page.settings.role.item.member_count')
      ),
      buttons: {
        edit: this.page.locator(generateE2eSelector('clan_page.settings.role.item.button.edit')),
        view: this.page.locator(generateE2eSelector('clan_page.settings.role.item.button.view')),
        delete: this.page.locator(
          generateE2eSelector('clan_page.settings.role.item.button.delete')
        ),
        confirm: this.page.locator(
          generateE2eSelector('clan_page.settings.role.item.button.confirm')
        ),
        cancel: this.page.locator(
          generateE2eSelector('clan_page.settings.role.item.button.cancel')
        ),
      },
      override: {
        item: this.page.locator(generateE2eSelector('clan_page.settings.role.override.item')),
        button: {
          remove: this.page.locator(
            generateE2eSelector('clan_page.settings.role.override.item.button.remove')
          ),
          tick: this.page.locator(
            generateE2eSelector('clan_page.settings.role.override.item.button.tick')
          ),
        },
      },
    },
    category: {
      input: {
        categoryName: this.page.locator(
          generateE2eSelector('clan_page.settings.category.input.category_name')
        ),
      },
    },
  };

  readonly permissionModal = {
    isVisible: async (timeout = 1000): Promise<boolean> => {
      const modal = this.page.locator(generateE2eSelector('clan_page.settings.modal.permission'));
      try {
        await modal.waitFor({ state: 'visible', timeout });
        return true;
      } catch {
        return false;
      }
    },
    cancel: this.page.locator(generateE2eSelector('clan_page.settings.modal.permission.cancel')),
  };

  readonly overview = {
    messageManagement: {
      actionLogs: this.page
        .locator(
          generateE2eSelector(
            'clan_page.settings.overview.system_messages_channel.message_management'
          ),
          { hasText: 'Send a log when an action is applied to the clan' }
        )
        .locator(generateE2eSelector('input.base')),
      helpfulTips: this.page
        .locator(
          generateE2eSelector(
            'clan_page.settings.overview.system_messages_channel.message_management'
          ),
          { hasText: 'Send helpful tips for clan setup.' }
        )
        .locator(generateE2eSelector('input.base')),
    },
    system_messages_channel: {
      selection: {
        container: this.page.locator(
          generateE2eSelector('clan_page.settings.overview.system_messages_channel')
        ),
        wrap_item: this.page.locator(
          generateE2eSelector('clan_page.settings.overview.system_messages_channel.selection.item')
        ),
        item: {
          channel_name: this.page.locator(
            generateE2eSelector(
              'clan_page.settings.overview.system_messages_channel.selection.item.channel_name'
            )
          ),
          category_name: this.page.locator(
            generateE2eSelector(
              'clan_page.settings.overview.system_messages_channel.selection.item.category_name'
            )
          ),
        },
        selected: {
          channel_name: this.page.locator(
            generateE2eSelector(
              'clan_page.settings.overview.system_messages_channel.selection.selected.channel_name'
            )
          ),
          category_name: this.page.locator(
            generateE2eSelector(
              'clan_page.settings.overview.system_messages_channel.selection.selected.category_name'
            )
          ),
        },
      },
    },
  };

  readonly integrations = {
    createWebhook: this.page.locator(
      generateE2eSelector('clan_page.settings.integrations.create_clan_webhook_button')
    ),
    newWebhook: this.page.locator(
      generateE2eSelector('clan_page.settings.integrations.new_clan_webhook_button')
    ),
    navigateWebhook: this.page.locator(
      generateE2eSelector('channel_setting_page.webhook.button.view_webhook')
    ),
    webhookItem: {
      item: this.page.locator(generateE2eSelector('clan_page.settings.integrations.webhook_item')),
      title: this.page.locator(
        generateE2eSelector('clan_page.settings.integrations.webhook_item.webhook_title')
      ),
      description: this.page.locator(
        generateE2eSelector('clan_page.settings.integrations.webhook_item.webhook_description')
      ),
    },
  };

  readonly auditLog = {
    content: this.page.locator(generateE2eSelector('clan_page.settings.audit_log.content')),
    time: this.page.locator(generateE2eSelector('clan_page.settings.audit_log.time')),
  };
}
