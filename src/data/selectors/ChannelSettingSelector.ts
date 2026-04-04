import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class ChannelSettingSelector {
  constructor(private readonly page: Page) {
    this.page = page;
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
      add_members_roles: this.page.locator(
        generateE2eSelector(
          'channel_setting_page.permissions.section.member_role_management.button.add'
        )
      ),
      submit: this.page.locator(generateE2eSelector('button.base'), { hasText: 'Done' }),
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
        modal_container: this.page.locator(
          generateE2eSelector(
            'channel_setting_page.permissions.section.member_role_management.modal'
          )
        ),
        modal: {
          roles_list: this.page.locator(
            generateE2eSelector(
              'channel_setting_page.permissions.section.member_role_management.modal.role_list'
            )
          ),
          role_item: this.page.locator(
            generateE2eSelector(
              'channel_setting_page.permissions.section.member_role_management.modal.role_list.role_item'
            )
          ),
          role_checkbox: this.page.locator(
            generateE2eSelector(
              'channel_setting_page.permissions.section.member_role_management.modal.role_list.role_item.input'
            )
          ),
          role_title: this.page.locator(
            generateE2eSelector(
              'channel_setting_page.permissions.section.member_role_management.modal.role_list.role_item.title'
            )
          ),
          members_list: this.page.locator(
            generateE2eSelector(
              'channel_setting_page.permissions.section.member_role_management.modal.member_list'
            )
          ),
          member_item: this.page.locator(
            generateE2eSelector(
              'channel_setting_page.permissions.section.member_role_management.modal.member_list.member_item'
            )
          ),
          member_checkbox: this.page.locator(
            generateE2eSelector(
              'channel_setting_page.permissions.section.member_role_management.modal.member_list.member_item.input'
            )
          ),
          member_name_prioritize: this.page.locator(
            generateE2eSelector(
              'channel_setting_page.permissions.section.member_role_management.modal.member_list.member_item.name_prioritize'
            )
          ),
          member_username: this.page.locator(
            generateE2eSelector(
              'channel_setting_page.permissions.section.member_role_management.modal.member_list.member_item.username'
            )
          ),
        },
      },
      list_roles_members: {
        container: this.page.locator(
          generateE2eSelector('channel_setting_page.permissions.section.list_roles_members')
        ),
        item: this.page.locator(
          generateE2eSelector(
            'channel_setting_page.permissions.section.list_roles_members.role_member_item'
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

  readonly header = {
    button: {
      thread: this.page.locator(generateE2eSelector('chat.channel_message.header.button.thread')),
      createThread: this.page.locator(
        generateE2eSelector(
          'chat.channel_message.header.button.thread.modal.thread_management.button.create_thread'
        )
      ),
      member: this.page.locator(generateE2eSelector('chat.channel_message.header.button.member')),
      pin: this.page.locator(generateE2eSelector('chat.channel_message.header.button.pin')),
    },
  };

  readonly secondarySideBar = {
    member: {
      item: this.page.locator(generateE2eSelector('clan_page.secondary_side_bar.member')),
      inVoice: this.page.locator(
        generateE2eSelector('clan_page.secondary_side_bar.member.in_voice')
      ),
    },
  };

  readonly sidebar = {
    clanItem: this.page.locator(generateE2eSelector('clan_page.side_bar.clan_item')),
    clanItems: {
      clanName: this.page.locator(generateE2eSelector('clan_page.side_bar.clan_item.name')),
    },
    channelItem: {
      item: this.page.locator(generateE2eSelector('clan_page.channel_list.item')),
      name: this.page.locator(generateE2eSelector('clan_page.channel_list.item.name')),
      icon: this.page.locator(generateE2eSelector('clan_page.channel_list.item.icon')),
      iconHashtagLock: this.page.locator(
        generateE2eSelector('clan_page.channel_list.item.icon.hashtag_lock')
      ),
      iconHashtag: this.page.locator(
        generateE2eSelector('clan_page.channel_list.item.icon.hashtag')
      ),
      userList: {
        item: this.page.locator(generateE2eSelector('clan_page.channel_list.item.user_list.item')),
      },
      userListCollapsed: {
        item: this.page.locator(
          generateE2eSelector('clan_page.channel_list.item.user_list_collapsed.item')
        ),
        itemCount: this.page.locator(
          generateE2eSelector('clan_page.channel_list.item.user_list_collapsed.item_count')
        ),
      },
    },
    threadItem: {
      name: this.page.locator(generateE2eSelector('clan_page.channel_list.thread_item.name')),
    },
    panelItem: {
      item: this.page.locator(generateE2eSelector('clan_page.channel_list.panel.item')),
    },
    channelsList: this.page.locator(generateE2eSelector('clan_page.channel_list.item')),
  };
}
