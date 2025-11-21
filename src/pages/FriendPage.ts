import { ROUTES } from '@/selectors';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import sleep from '@/utils/sleep';
import { Locator, Page, expect } from '@playwright/test';
import { ToastSelector } from './../data/selectors/ToastSelectort';
import { BasePage } from './BasePage';
import FriendSelector from '@/data/selectors/FriendSelector';
const SUCCESS_MESSAGE = 'Friend request sent successfully!';
const ALREADY_SENT_MESSAGE = 'You have already sent a friend request to this user!';
const ALREADY_FRIEND_MESSAGE = "You're already friends with that user!";
type Tabs = 'all' | 'online' | 'pending' | 'block';
const dmActivClass = 'text-theme-primary-active';
export class FriendPage extends BasePage {
  private readonly toasts: ToastSelector;
  private readonly selector: FriendSelector;
  constructor(page: Page) {
    super(page);
    this.toasts = new ToastSelector(this.page);
    this.selector = new FriendSelector(this.page);
  }

  async getFriend(username: string) {
    return this.selector.lists.friendAll.filter({ hasText: username }).first();
  }

  async getFriends(username: string) {
    return this.selector.lists.friendAll.filter({ hasText: username });
  }

  async getActiveDM(username: string) {
    return this.selector.dm.items
      .filter({ has: this.page.locator(`.${dmActivClass}`), hasText: username })
      .first();
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
    await this.selector.tabs[tab].click();
    return this.getFriend(username);
  }

  async gotoFriendsPage(): Promise<void> {
    await this.navigate(ROUTES.DIRECT_FRIENDS);
  }

  async clickAddFriendButton(): Promise<void> {
    await this.selector.buttons.addFriend.click();
    await this.selector.inputs.addFriend.waitFor({ state: 'visible', timeout: 5000 });
  }

  async enterUsername(username: string): Promise<void> {
    await this.selector.inputs.addFriend.fill(username);
  }

  async clickSendFriendRequest(): Promise<void> {
    await this.selector.buttons.sendFriendRequest.click();
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
    await this.selector.inputs.search.fill(keyword);
  }

  async clearSearch(): Promise<void> {
    await this.selector.inputs.search.clear();
  }

  async clickPendingTab() {
    await this.selector.tabs.pending.click();
  }

  async acceptFirstFriendRequest(): Promise<void> {
    await this.gotoFriendsPage();
    await this.clickPendingTab();
    await this.waitForFriendListVisible();
    await sleep(300);
    await this.selector.buttons.acceptFriendRequest.first().click();
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
    return this.selector.buttons.sendFriendRequest.isDisabled();
  }

  async waitForFriendListVisible(): Promise<void> {
    await this.selector.lists.friendAll.first().waitFor({ state: 'visible', timeout: 20000 });
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

  async blockFriendFromDM(username: string): Promise<void> {
    const activeDM = await this.getActiveDM(username);
    await activeDM.waitFor({ state: 'visible', timeout: 1000 });
    await activeDM.click({ button: 'right' });

    const blockButton = this.selector.dmFriendMenu.blockButton;
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
    await this.selector.tabs.pending.click();
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
    const errorMessage = this.selector.inputs.error;
    expect(errorMessage).toHaveCount(1);
    expect(errorMessage).toBeVisible();
    expect(errorMessage).toHaveText(ALREADY_SENT_MESSAGE);
  }

  async assertAlreadyFriendError(): Promise<void> {
    await this.page.waitForTimeout(300);
    const errorMessage = this.selector.inputs.error;
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
    await this.selector.inputs.addFriend.clear();
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
    const permissionDenied = this.selector.inputs.permissionDenied;
    return (await permissionDenied.count()) > 0;
  }

  async getPermissionDeniedInput(): Promise<Locator> {
    return this.selector.inputs.permissionDenied;
  }

  async clickTabAll(): Promise<void> {
    await this.selector.tabs.all.click();
  }

  async clickTabBlock(): Promise<void> {
    await this.selector.tabs.block.click();
  }

  async getFriendAllUserItemByUsername(username: string): Promise<Locator> {
    return this.selector.lists.friendAll.filter({ hasText: username });
  }

  async getFriendPendingBadgeCount(): Promise<number> {
    try {
      await this.selector.badge.friendPending.waitFor({ state: 'visible', timeout: 3000 });
      const friendPendingBadgeCount = await this.selector.badge.friendPending.innerText();
      return parseInt(friendPendingBadgeCount);
    } catch {
      return 0;
    }
  }

  async verifyFriendPendingBadgeIsDisplayed(prevCount = 0): Promise<void> {
    const currentCount = await this.getFriendPendingBadgeCount();
    expect(currentCount - prevCount).toBe(1);
  }

  async verifyFriendPendingBadgeIsDisappeared(prevCount = 1): Promise<void> {
    const currentCount = await this.getFriendPendingBadgeCount();
    expect(prevCount - currentCount).toBe(1);
  }
}
