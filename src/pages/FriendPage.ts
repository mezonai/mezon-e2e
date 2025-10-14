import { Page, expect } from '@playwright/test';
import { ROUTES } from '@/selectors';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { BasePage } from './BasePage';
import sleep from '@/utils/sleep';

export class FriendPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  readonly tabs = {
    all: this.page.locator(generateE2eSelector('friend_page.tab')).filter({ hasText: 'All' }),

    online: this.page.locator(generateE2eSelector('friend_page.tab')).filter({ hasText: 'Online' }),

    pending: this.page
      .locator(generateE2eSelector('friend_page.tab'))
      .filter({ hasText: 'Pending' }),

    block: this.page.locator(generateE2eSelector('friend_page.tab')).filter({ hasText: 'Block' }),
  };

  readonly buttons = {
    addFriend: this.page
      .locator(generateE2eSelector('button.base'))
      .filter({ hasText: 'Add Friend' }),

    sendFriendRequest: this.page
      .locator(generateE2eSelector('button.base'))
      .filter({ hasText: 'Send Friend Request' }),

    acceptFriendRequest: this.page.locator('[data-e2e="accept-friend-request-button"]'),
    rejectFriendRequest: this.page.locator('[data-e2e="reject-friend-request-button"]'),
    cancelFriendRequest: this.page.locator('[data-e2e="cancel-friend-request-button"]'),
    requestFailedOkay: this.page.locator(
      generateE2eSelector('friend_page.request_failed_popup.button.okay')
    ),
  };

  readonly inputs = {
    search: this.page.locator(generateE2eSelector('friend_page.input.search')),
    addFriend: this.page.locator(generateE2eSelector('friend_page.input.add_friend')),
  };

  readonly lists = {
    friendAll: this.page.locator(generateE2eSelector('chat.direct_message.friend_list.all_friend')),
  };

  async getFriend(username: string) {
    return this.lists.friendAll.filter({ hasText: username }).first();
  }

  async friendExistsInTab(username: string, tab: 'all' | 'online' | 'pending' | 'block' = 'all') {
    await this.gotoFriendsPage();
    await this.page.waitForTimeout(500);
    await this.tabs[tab].click();
    return this.getFriend(username);
  }

  async gotoFriendsPage(): Promise<void> {
    await this.navigate(ROUTES.DIRECT_FRIENDS);
  }

  async clickAddFriendButton(): Promise<void> {
    await this.buttons.addFriend.click();
    await this.inputs.addFriend.waitFor({ state: 'visible', timeout: 5000 });
  }

  async enterUsername(username: string): Promise<void> {
    await this.inputs.addFriend.fill(username);
  }

  async clickSendFriendRequest(): Promise<void> {
    await this.buttons.sendFriendRequest.click();
  }

  async sendFriendRequestToUser(username: string): Promise<void> {
    await this.gotoFriendsPage();
    await this.clickAddFriendButton();
    await this.enterUsername(username);
    await this.clickSendFriendRequest();
  }

  async searchFriend(keyword: string): Promise<void> {
    await this.inputs.search.fill(keyword);
  }

  async clearSearch(): Promise<void> {
    await this.inputs.search.clear();
  }

  async clickPendingTab() {
    await this.tabs.pending.click();
  }

  async acceptFirstFriendRequest(): Promise<void> {
    await this.gotoFriendsPage();
    await this.clickPendingTab();
    await this.waitForFriendListVisible();
    await sleep(300);
    await this.buttons.acceptFriendRequest.first().click();
  }

  async acceptFriendRequestFromUser(username: string): Promise<void> {
    const friendItem = await this.friendExistsInTab(username, 'pending');
    await friendItem.waitFor({ state: 'visible' });
    await friendItem.locator('[data-e2e="accept-friend-request-button"]').click();
  }

  async rejectFriendRequest(username: string): Promise<void> {
    const friendItem = await this.friendExistsInTab(username, 'pending');
    await friendItem.waitFor({ state: 'visible' });
    await friendItem.locator('[data-e2e="reject-friend-request-button"]').click();
    await this.page.waitForTimeout(500);
  }

  async cancelFriendRequest(username: string): Promise<void> {
    const friendItem = await this.friendExistsInTab(username, 'pending');
    await friendItem.waitFor({ state: 'visible' });
    await friendItem.locator('[data-e2e="cancel-friend-request-button"]').click();
    await this.page.waitForTimeout(500);
  }

  async isSendRequestDisabled(): Promise<boolean> {
    return this.buttons.sendFriendRequest.isDisabled();
  }

  async waitForFriendListVisible(): Promise<void> {
    await this.lists.friendAll.first().waitFor({ state: 'visible', timeout: 20000 });
  }

  async openMoreMenuForFriend(username: string): Promise<void> {
    const friendItem = await this.friendExistsInTab(username, 'all');
    await friendItem.waitFor({ state: 'visible', timeout: 20000 });
    await friendItem.getByTitle('More').click();
    await this.page.waitForTimeout(300);
  }

  async blockFriend(username: string): Promise<void> {
    await this.openMoreMenuForFriend(username);
    await this.page.getByRole('button', { name: /block/i }).last().click();
    await this.page.waitForTimeout(500);
  }

  async unblockFriend(username: string): Promise<void> {
    const friendItem = await this.friendExistsInTab(username, 'block');
    await friendItem.waitFor({ state: 'visible', timeout: 20000 });
    await friendItem.getByRole('button', { name: /unblock/i }).click();
    await this.page.waitForTimeout(500);
  }

  async removeFriend(username: string): Promise<void> {
    await this.openMoreMenuForFriend(username);
    await this.page.getByRole('button', { name: /remove/i }).click();
    await this.page.waitForTimeout(500);
  }

  async assertAllFriend(username: string): Promise<void> {
    const friend = await this.friendExistsInTab(username, 'all');
    await friend.waitFor({ state: 'visible', timeout: 20000 });
    expect(friend).toHaveCount(1);
    expect(friend).toBeVisible();
  }

  async assertBlockFriend(username: string): Promise<void> {
    const friend = await this.friendExistsInTab(username, 'block');
    await friend.waitFor({ state: 'visible', timeout: 20000 });
    expect(friend).toHaveCount(1);
    expect(friend).toBeVisible();
  }

  async assertBlockFriendNotVisible(username: string): Promise<void> {
    await this.page.waitForTimeout(300);
    const friend = await this.friendExistsInTab(username, 'block');
    expect(friend).toHaveCount(0);
    expect(friend).not.toBeVisible();
  }

  async checkFriendExists(username: string): Promise<boolean> {
    await this.page.waitForTimeout(300);
    const friend = await this.friendExistsInTab(username, 'all');
    const count = await friend.count();
    return count > 0;
  }

  async assertFriendNotVisibleInCurrentTab(username: string): Promise<void> {
    await this.page.waitForTimeout(300);
    const friend = await this.friendExistsInTab(username, 'all');
    expect(friend).toHaveCount(0);
    expect(friend).not.toBeVisible();
  }

  async clearAddFriendInput(): Promise<void> {
    await this.inputs.addFriend.clear();
  }
}
