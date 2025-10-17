import { sleep } from '../../utils/index.js';
import { Step } from '../../decorators/step.decorator.js';
import { FriendScreen } from '../friend/index.js';
import { AppAction } from '../../utils/native-action/index.js';

export class UserProfileScreen extends AppAction {
  static init() {
    return new UserProfileScreen();
  }

  private friendScreen: FriendScreen;

  public constructor() {
    super();
    this.friendScreen = FriendScreen.init();
  }

  private get scrollView() {
    return $('~profile.scrollView');
  }

  private get yourFriendsButton() {
    return $('~profile.touch.yourFriend');
  }
  private get addStatusButton() {
    return $('~profile.touch.addStatus');
  }

  static async using<T>(fn: (ms: UserProfileScreen) => Promise<T>): Promise<T> {
    return fn(UserProfileScreen.init());
  }

  @Step('Wait for user profile screen')
  async waitForIsShown(isShown = true): Promise<boolean> {
    return this.addStatusButton.waitForDisplayed({
      timeout: 45000,
      reverse: !isShown,
    });
  }

  @Step('Open add status')
  async openAddStatus() {
    await this.waitForIsShown();
    await this.addStatusButton.click();
  }

  @Step('Open your friends')
  async openYourFriends() {
    await this.waitForIsShown();
    const container = await $(
      'android=new UiSelector().className("android.widget.ScrollView").scrollable(true)'
    );
    await driver.swipe({
      direction: 'up',
      percent: 0.6,
      scrollableElement: container,
      duration: 800,
    });
    await this.yourFriendsButton.click();
    return this.friendScreen;
  }
}
