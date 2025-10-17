import { sleep } from '../../utils/index.js';
import { Step } from '../../decorators/step.decorator.js';
import { AddFriendScreen } from './screen/add-friend/index.js';

export class FriendScreen {
  static init() {
    return new FriendScreen();
  }
  private get addFriendsButton() {
    return $('~friend.button.addFriends');
  }

  private addFriendScreen: AddFriendScreen;

  private constructor() {
    this.addFriendScreen = AddFriendScreen.init();
  }

  private get searchInput() {
    return $('~friend.input.search');
  }

  private get requestReceivedText() {
    return $('~friend.text.requestReceived');
  }

  private get requestSentText() {
    return $('~friend.text.requestSent');
  }

  private get requestFriendButton() {
    return $('~friend.button.requestFriend');
  }

  static async using<T>(fn: (ms: FriendScreen) => Promise<T>): Promise<T> {
    return fn(FriendScreen.init());
  }

  @Step('Wait for friend screen')
  async waitForIsShown(isShown = true): Promise<boolean> {
    return this.addFriendsButton.waitForDisplayed({
      timeout: 45000,
      reverse: !isShown,
    });
  }

  @Step('Type search text')
  async typeSearchText(text: string) {
    await this.searchInput.waitForDisplayed();
    await this.searchInput.clearValue();
    await this.searchInput.setValue(text);
  }

  @Step('Open add friends')
  async openAddFriends() {
    await this.waitForIsShown();
    await this.addFriendsButton.click();
  }

  @Step('Open request friend')
  async openRequestFriend() {
    await this.waitForIsShown();
    await this.requestFriendButton.click();
  }

  @Step('Send friend request to user')
  async sendFriendRequestToUser(username: string) {
    await this.openAddFriends();
    await this.addFriendScreen.openAddFriend();
    await this.addFriendScreen.typeUsername(username);
    await this.addFriendScreen.sendFriendRequest();
  }

  @Step('Find friend item')
  async findFriendItem(username: string) {
    const displayName = `${username.charAt?.(0)?.toUpperCase()}${username.slice(1)}`;
    const pathFriendRequest = `android=new UiSelector().className("android.widget.TextView").text("${displayName}")`;
    const item = await $(pathFriendRequest);
    await item.waitForDisplayed({ timeout: 20000 });
    return item;
  }

  @Step('Accept friend request')
  async acceptFriendRequest(username: string) {
    await this.openRequestFriend();
    await sleep(1000);
    await $(`~friend.button.approveFriend`).click();
    await sleep(5000);
  }

  @Step('Get request received text')
  async getRequestReceivedText() {
    return await this.requestReceivedText.getText();
  }

  @Step('Get request sent text')
  async getRequestSentText() {
    return await this.requestSentText.getText();
  }
}
