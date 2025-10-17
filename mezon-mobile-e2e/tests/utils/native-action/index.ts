import { AndroidAction } from './android.js';
import { IosAction } from './ios.js';
import { IRequestScroll } from './interfaces/index.js';

export class AppAction {
  private readonly android: AndroidAction;
  private readonly ios: IosAction;
  static init() {
    return new AppAction();
  }

  public constructor() {
    this.android = AndroidAction.init();
    this.ios = IosAction.init();
  }

  public async scroll(request?: Partial<IRequestScroll>) {
    const {
      percent = 0.85,
      containerSelectorAndroid = 'android=new UiSelector().scrollable(true)',
      containerSelectorIos = '-ios class chain:**/(XCUIElementTypeTable|XCUIElementTypeCollectionView|XCUIElementTypeScrollView)[1]',
      repeats = 1,
      pauseMs,
      direction = 'down',
    } = request ?? {};

    if (percent <= 0 || percent > 1) {
      throw new Error('Percent must be between 0 and 1');
    }

    for (let i = 0; i < repeats; i++) {
      // await (driver.isAndroid
        await this.android.scrollGesture({ percent, containerSelectorAndroid, direction })
        // : this.ios.scrollGesture({ percent, containerSelectorIos, direction }));
      if (pauseMs) await driver.pause(pauseMs);
    }
  }
}
