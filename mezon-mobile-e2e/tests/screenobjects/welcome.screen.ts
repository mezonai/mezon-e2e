export class WelcomeScreen {
  static init() {
    return new WelcomeScreen();
  }

  static async using<T>(fn: (ms: WelcomeScreen) => Promise<T>): Promise<T> {
    return fn(WelcomeScreen.init());
  }

  private constructor() {}

  private get startedButton() {
    return $('~started.button');
  }

  async waitForIsShown(isShown = true): Promise<boolean> {
    return this.startedButton.waitForDisplayed({
      timeout: 45000,
      reverse: !isShown,
    });
  }

  async clickStartedButton(): Promise<void> {
    if (await this.startedButton.isExisting()) {
      await this.startedButton.click();
    }
  }
}
