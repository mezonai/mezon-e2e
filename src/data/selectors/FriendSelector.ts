import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class FriendSelector {
  constructor(private readonly page: Page) {
    this.page = page;
  }

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
  };

  readonly dmFriendMenu = {
    item: this.page.locator(generateE2eSelector('chat.channel_message.member_list.item.actions')),
    blockButton: this.page
      .locator(generateE2eSelector('chat.channel_message.member_list.item.actions'))
      .filter({ hasText: 'Block' }),
  };

  readonly badge = {
    friendPending: this.page.locator(generateE2eSelector('badge.friend_pending')),
  };
}
