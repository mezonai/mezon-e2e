import { ListClanPopupComponent } from './components/index.js';
import { Step } from '../../decorators/step.decorator.js';

export class HomeScreen {
  private listClanPopup: ListClanPopupComponent;
  private constructor() {
    this.listClanPopup = ListClanPopupComponent.init();
  }

  

  private readonly pathProfile =
    'android=new UiSelector().className("android.widget.TextView").text("Profile")';

  static init() {
    return new HomeScreen();
  }

  static async using<T>(fn: (obj: HomeScreen) => Promise<T>): Promise<T> {
    return fn(HomeScreen.init());
  }

  private DEFAULT_TIMEOUT = 15000;

  private async show(selector: string, timeout = this.DEFAULT_TIMEOUT) {
    const el = $(selector as string);
    await el.waitForExist({ timeout });
    await el.waitForDisplayed({ timeout });
    return el;
  }

  public getListClanPopup() {
    return this.listClanPopup;
  }

  private async androidScrollToA11y(a11yId: string) {
    await $(
      `android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().description("${a11yId}"))`
    );
  }

  @Step('Open Create Clan Modal')
  public async openCreateClanModal() {
    await this.listClanPopup.waitForVisible();
    await this.androidScrollToA11y('listClanPopup.createClanButton');
    return this.listClanPopup.openCreateClanModal();
  }

  @Step('Open Profile')
  public async openProfile() {
    await $(this.pathProfile).waitForDisplayed({ timeout: 15000 });
    await $(this.pathProfile).click();
  }
}
