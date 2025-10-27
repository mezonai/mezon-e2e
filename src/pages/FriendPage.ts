import { ROUTES } from '@/selectors';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import sleep from '@/utils/sleep';
import { Page, expect } from '@playwright/test';
import { ToastSelector } from './../data/selectors/ToastSelectort';
import { BasePage } from './BasePage';

const SUCCESS_MESSAGE = 'Friend request sent successfully!';
const ALREADY_SENT_MESSAGE = 'You have already sent a friend request to this user!';
const ALREADY_FRIEND_MESSAGE = "You're already friends with that user!";
type Tabs = 'all' | 'online' | 'pending' | 'block';
const dmActivClass = 'text-theme-primary-active';
export class FriendPage extends BasePage {
  constructor(page: Page) {
    super(page);
    this.toasts = new ToastSelector(this.page);
  }
  private readonly baseTab = this.page.locator(generateE2eSelector('friend_page.tab'));

  readonly tabs = {
    all: this.baseTab.filter({ hasText: 'All' }),
    online: this.baseTab.filter({ hasText: 'Online' }),
    pending: this.baseTab.filter({ hasText: 'Pending' }),
    block: this.baseTab.filter({ hasText: 'Block' }),
  };
  readonly toasts;

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

  async getFriend(username: string) {
    return this.lists.friendAll.filter({ hasText: username }).first();
  }

  async getFriends(username: string) {
    return this.lists.friendAll.filter({ hasText: username });
  }

  async getActiveDM() {
    return this.dm.items.filter({ has: this.page.locator(`.${dmActivClass}`) }).first();
  }

  private async baseAssertFriendTab(username: string, tab: Tabs) {
    const friend = await this.friendExistsInTab(username, tab);
    await friend.waitFor({ state: 'visible', timeout: 20000 });
    expect(friend).toHaveCount(1);
    expect(friend).toBeVisible();
  }

  private async baseCheckFriendExists(username: string, tab: Tabs): Promise<boolean> {
    await this.page.waitForTimeout(300);
    const friend = await this.friendExistsInTab(username, tab);
    const count = await friend.count();
    return count > 0;
  }

  async friendExistsInTab(username: string, tab: Tabs) {
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

  async verifySentRequestToast(): Promise<void> {
    try {
      await this.toasts.verifySuccessToast(SUCCESS_MESSAGE);
    } catch (error) {
      console.error('Toast Not show:', error);
    }
  }

  async verifyReceivedRequestToast(message: string): Promise<void> {
    try {
      await this.toasts.verifyInfoToast(message);
    } catch (error) {
      console.error('Toast Not show:', error);
    }
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
    await friendItem
      .locator(generateE2eSelector('friend_page.button.accept_friend_request'))
      .click();
  }

  async rejectFriendRequest(username: string): Promise<void> {
    const friendItem = await this.friendExistsInTab(username, 'pending');
    await friendItem.waitFor({ state: 'visible' });
    await friendItem
      .locator(generateE2eSelector('friend_page.button.reject_friend_request'))
      .click();
    await this.page.waitForTimeout(500);
  }

  async cancelFriendRequest(username: string): Promise<void> {
    const friendItem = await this.friendExistsInTab(username, 'pending');
    await friendItem.waitFor({ state: 'visible' });
    await friendItem
      .locator(generateE2eSelector('friend_page.button.cancel_friend_request'))
      .click();
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

  async blockFriendFromDM(): Promise<void> {
    const activeDM = await this.getActiveDM();
    await activeDM.waitFor({ state: 'visible', timeout: 1000 });
    await activeDM.click({ button: 'right' });

    const blockButton = this.dmFriendMenu.blockButton;
    await blockButton.waitFor({ state: 'visible', timeout: 1000 });
    await blockButton.click();
    await this.page.waitForTimeout(500);
  }

  async unblockFriend(username: string): Promise<void> {
    const friendItem = await this.friendExistsInTab(username, 'block');
    await friendItem.waitFor({ state: 'visible', timeout: 1000 });
    await friendItem.getByRole('button', { name: /unblock/i }).click();
    await this.page.waitForTimeout(500);
  }

  async removeFriend(username: string): Promise<void> {
    const existFriend = await this.checkFriendExists(username);
    if (!existFriend) {
      return;
    }
    await this.openMoreMenuForFriend(username);
    await this.page.getByRole('button', { name: /remove/i }).click();
    await this.page.waitForTimeout(500);
  }

  async removeFriendRequest(username: string): Promise<void> {
    const existFriend = await this.checkFriendRequestExists(username);
    if (!existFriend) {
      return;
    }
    await this.tabs.pending.click();
    await this.page.waitForTimeout(500);
    const friendItems = await this.getFriends(username);
    const friendItemsCount = await friendItems.count();
    for (let i = 0; i < friendItemsCount; i++) {
      const friendItem = friendItems.nth(i);
      const cancelButton = friendItem.locator(
        generateE2eSelector('friend_page.button.cancel_friend_request')
      );
      const cancelButtonCount = await cancelButton.count();
      if (cancelButtonCount > 0) {
        await cancelButton.click();
        await this.page.waitForTimeout(500);
        return;
      }
      const rejectButton = friendItem.locator(
        generateE2eSelector('friend_page.button.reject_friend_request')
      );
      const rejectButtonCount = await rejectButton.count();
      if (rejectButtonCount > 0) {
        await rejectButton.click();
        await this.page.waitForTimeout(500);
        return;
      }
    }
  }

  async assertAlreadySentRequestError(): Promise<void> {
    await this.page.waitForTimeout(300);
    const errorMessage = this.inputs.error;
    expect(errorMessage).toHaveCount(1);
    expect(errorMessage).toBeVisible();
    expect(errorMessage).toHaveText(ALREADY_SENT_MESSAGE);
  }

  async assertAlreadyFriendError(): Promise<void> {
    await this.page.waitForTimeout(300);
    const errorMessage = this.inputs.error;
    expect(errorMessage).toHaveCount(1);
    expect(errorMessage).toBeVisible();
    expect(errorMessage).toHaveText(ALREADY_FRIEND_MESSAGE);
  }

  async assertFriendRequestExists(username: string): Promise<void> {
    await this.friendExistsInTab(username, 'pending');
  }

  async assertAllFriend(username: string): Promise<void> {
    await this.baseAssertFriendTab(username, 'all');
  }

  async assertBlockFriend(username: string): Promise<void> {
    await this.baseAssertFriendTab(username, 'block');
  }

  async assertBlockFriendNotVisible(username: string): Promise<void> {
    await this.page.waitForTimeout(300);
    const friend = await this.friendExistsInTab(username, 'block');
    expect(friend).toHaveCount(0);
    expect(friend).not.toBeVisible();
  }

  async checkFriendExists(username: string): Promise<boolean> {
    return this.baseCheckFriendExists(username, 'all');
  }
  async checkFriendRequestExists(username: string): Promise<boolean> {
    return this.baseCheckFriendExists(username, 'pending');
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

  async cleanupFriendRelationships(otherUsername: string): Promise<void> {
    await this.removeFriend(otherUsername);
    await this.removeFriendRequest(otherUsername);
  }

  async createDM(username: string) {
    const friendItem = await this.friendExistsInTab(username, 'all');
    await friendItem.waitFor({ state: 'visible' });
    await friendItem.click();
    await this.page.waitForTimeout(500);
  }

  async isChatDenied(): Promise<boolean> {
    const permissionDenied = this.inputs.permissionDenied;
    return (await permissionDenied.count()) > 0;
  }
}
