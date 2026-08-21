import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Locator, Page } from '@playwright/test';

const CREATE_CHANNEL_TYPE_SELECTOR = generateE2eSelector('clan_page.modal.create_channel.type');

export default class ClanChannelSelector {
  constructor(private readonly page: Page) {}

  readonly createModal = {
    type: {
      text: this.page.locator(CREATE_CHANNEL_TYPE_SELECTOR, {
        hasText: 'Text',
      }),
      voice: this.page.locator(CREATE_CHANNEL_TYPE_SELECTOR, {
        hasText: 'Voice',
      }),
      stream: this.page.locator(CREATE_CHANNEL_TYPE_SELECTOR, {
        hasText: 'Stream',
      }),
    },
    input: {
      channelName: this.page.locator(
        generateE2eSelector('clan_page.modal.create_channel.input.channel_name')
      ),
    },
    toggle: {
      isPrivate: this.page.locator(
        generateE2eSelector('clan_page.modal.create_channel.toggle.is_private')
      ),
    },
    button: {
      confirm: this.page.locator(
        generateE2eSelector('clan_page.modal.create_channel.button.confirm')
      ),
      cancel: this.page.locator(
        generateE2eSelector('clan_page.modal.create_channel.button.cancel')
      ),
    },
  };

  readonly sidebar = {
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
      badge: this.page.locator(generateE2eSelector('clan_page.channel_list.item.badge')),
    },
    threadItem: {
      name: this.page.locator(generateE2eSelector('clan_page.channel_list.thread_item.name')),
    },
    panelItem: {
      item: this.page.locator(generateE2eSelector('clan_page.channel_list.panel.item')),
      subText: this.page.locator(generateE2eSelector('clan_page.channel_list.panel.item.sub_text')),
    },
    button: {
      dragChannel: this.page.locator(
        generateE2eSelector('clan_page.channel_list.button.drag_channel')
      ),
    },
    channelsList: this.page.locator(generateE2eSelector('clan_page.channel_list.item')),
    category: this.page.locator(generateE2eSelector('clan_page.side_bar.channel_list.category')),
    categoryName: this.page.locator(
      generateE2eSelector('clan_page.side_bar.channel_list.category.name')
    ),
  };

  readonly management = {
    totalChannels: this.page.locator(
      generateE2eSelector('clan_page.channel_management.total_channels')
    ),
    channelItem: this.page.locator(
      generateE2eSelector('clan_page.channel_management.channel_item')
    ),
    messagesCount: this.page.locator(
      generateE2eSelector('clan_page.channel_management.channel_item.messages_count')
    ),
    channelName: this.page.locator(
      generateE2eSelector('clan_page.channel_management.channel_item.channel_name')
    ),
  };

  getSidebarItem(channelName: string): Locator {
    return this.sidebar.channelItem.item.filter({
      has: this.sidebar.channelItem.name.filter({ hasText: channelName }),
    });
  }

  getManagementItem(channelName: string): Locator {
    return this.management.channelItem.filter({
      has: this.management.channelName.filter({ hasText: channelName }),
    });
  }

  getManagementMessageCount(channelItem: Locator): Locator {
    return channelItem.locator(this.management.messagesCount);
  }
}
