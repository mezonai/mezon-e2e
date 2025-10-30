import { sleep } from '../../../../utils/index.js';
import { Step } from '../../../../decorators/step.decorator.js';
import { MezonButtonUIObject } from '../../../../component-ui-object/index.js';

export class AddFriendScreen {
  static init() {
    return new AddFriendScreen();
  }
  private mezonButton: MezonButtonUIObject;

  private constructor() {
    this.mezonButton = MezonButtonUIObject.init();
  }

  private get addFriendButton() {
    return $('~addFriend.button');
  }

  private get usernameInput() {
    return $('~addFriend.input.username');
  }

  @Step('Type username')
  async typeUsername(username: string) {
    await this.usernameInput.waitForDisplayed({ timeout: 45000 });
    await this.usernameInput.clearValue();
    await this.usernameInput.setValue(username);
  }

  static async using<T>(fn: (ms: AddFriendScreen) => Promise<T>): Promise<T> {
    return fn(AddFriendScreen.init());
  }

  @Step('Wait for add friend screen')
  async waitForIsShown(isShown = true): Promise<boolean> {
    return this.addFriendButton.waitForDisplayed({
      timeout: 45000,
      reverse: !isShown,
    });
  }

  @Step('Open add friend')
  async openAddFriend() {
    await this.waitForIsShown();
    await this.addFriendButton.click();
  }

  @Step('Send friend request')
  async sendFriendRequest() {
    await this.mezonButton.waitForVisible();
    await this.mezonButton.click();
    await sleep(1000);
  }
}
