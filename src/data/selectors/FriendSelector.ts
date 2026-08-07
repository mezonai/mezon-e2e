import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

const MEMBER_ACTION_ITEM_SELECTOR = generateE2eSelector(
  'chat.channel_message.member_list.item.actions'
);

export default class FriendSelector {
  constructor(private readonly page: Page) {}

  private readonly baseTab = this.page.locator(generateE2eSelector('friend_page.tab'));

  readonly tabs = {
    all: this.baseTab.filter({ hasText: 'All' }),
    online: this.baseTab.filter({ hasText: 'Online' }),
    pending: this.baseTab.filter({ hasText: 'Pending' }),
    block: this.baseTab.filter({ hasText: 'Block' }),
  };

  readonly buttons = {
    addFriend: this.page
      .locator(generateE2eSelector('button.base'))
      .filter({ hasText: 'Add Friend' }),

    sendFriendRequest: this.page
      .locator(generateE2eSelector('button.base'))
      .filter({ hasText: 'Send Friend Request' }),

    acceptFriendRequest: this.page.locator(
      generateE2eSelector('friend_page.button.accept_friend_request')
    ),
    confirmRemoveFriend: this.page.locator(
      generateE2eSelector('friend_remove_modal.button.confirm')
    ),
    cancelRemoveFriend: this.page.locator(generateE2eSelector('friend_remove_modal.button.cancel')),
  };

  readonly inputs = {
    search: this.page.locator(generateE2eSelector('friend_page.input.search')),
    addFriend: this.page.locator(generateE2eSelector('friend_page.input.add_friend')),
    error: this.page.locator(generateE2eSelector('friend_page.input.error')),
    permissionDenied: this.page.locator(
      generateE2eSelector('chat.message_box.input.no_permission')
    ),
  };

  readonly lists = {
    friendAll: this.page.locator(generateE2eSelector('chat.direct_message.friend_list.all_friend')),
  };

  readonly dm = {
    items: this.page.locator(generateE2eSelector('chat.direct_message.chat_list')),
    pinList: this.page.locator(generateE2eSelector('chat.direct_message.pin_list_container')),
  };

  readonly dmFriendMenu = {
    item: this.page.locator(MEMBER_ACTION_ITEM_SELECTOR),
    blockButton: this.page.locator(MEMBER_ACTION_ITEM_SELECTOR).filter({ hasText: 'Block' }),
    markAsRead: this.page.locator(MEMBER_ACTION_ITEM_SELECTOR).filter({ hasText: 'Mark as Read' }),
    pinConversation: this.page
      .locator(MEMBER_ACTION_ITEM_SELECTOR)
      .filter({ hasText: 'Pin Conversation' }),
    unpinConversation: this.page
      .locator(MEMBER_ACTION_ITEM_SELECTOR)
      .filter({ hasText: 'Unpin Conversation' }),
  };

  readonly badge = {
    friendPending: this.page.locator(generateE2eSelector('badge.friend_pending')),
  };

  readonly permissionModal = {
    cancel: this.page.locator(generateE2eSelector('clan_page.settings.modal.permission.cancel')),
  };
}
