import { SELECTOR } from './constants/index.js';

export class MezonConfirmObject {
  private constructor() {}

  static init() {
    return new MezonConfirmObject();
  }

  static async using<T>(fn: (obj: MezonConfirmObject) => Promise<T>): Promise<T> {
    return fn(MezonConfirmObject.init());
  }

  private DEFAULT_TIMEOUT = 10000;

  async waitForVisible(timeout = 15000) {
    await this.show(SELECTOR.TITLE, timeout);
  }

  private async show(selector: SELECTOR, timeout = this.DEFAULT_TIMEOUT) {
    const el = $(selector);
    await el.waitForExist({ timeout });
    await el.waitForDisplayed({ timeout });
    return el;
  }

  public async clickCancelBtn() {
    await this.cancelBtn.click();
  }

  public async clickConfirmBtn() {
    await this.confirmBtn.click();
  }

  get cancelBtn() {
    return $(SELECTOR.BUTTON_CANCEL);
  }
  get confirmBtn() {
    return $(SELECTOR.BUTTON);
  }
  get confirmBtnText() {
    return $(SELECTOR.BUTTON_TEXT);
  }
}
