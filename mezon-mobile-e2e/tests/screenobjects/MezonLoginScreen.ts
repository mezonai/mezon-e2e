export class MezonLoginScreen {
  static init() {
    return new MezonLoginScreen();
  }

  static async using<T>(fn: (ms: MezonLoginScreen) => Promise<T>): Promise<T> {
    return fn(MezonLoginScreen.init());
  }

  private constructor() {}

  private get emailInput() {
    return $('~login.email.input');
  }

  private get passwordInput() {
    return $('~login.password.input');
  }

  private get switchPasswordLink() {
    return $('~login.switch.password');
  }

  private get primaryButton() {
    return $('~login.primary.button');
  }

  async waitForIsShown(isShown = true): Promise<boolean> {
    return this.emailInput.waitForDisplayed({
      timeout: 45000,
      reverse: !isShown,
    });
  }

  async openLoginWithPassword(): Promise<void> {
    await this.switchPasswordLink.waitForDisplayed({
      timeout: 45000,
      reverse: false,
    });
    if (await this.switchPasswordLink.isExisting()) {
      await this.switchPasswordLink.click();
    }
  }

  async setEmail(value: string): Promise<void> {
    await this.emailInput.waitForDisplayed({ timeout: 20000 });
    await this.emailInput.setValue(value);
  }

  async setPassword(value: string): Promise<void> {
    await this.passwordInput.waitForDisplayed({ timeout: 20000 });
    await this.passwordInput.setValue(value);
  }

  async submitLogin(): Promise<void> {
    await this.primaryButton.waitForEnabled({ timeout: 20000 });
    await this.primaryButton.click();
  }

  async loginWithPassword(email: string, password: string): Promise<void> {
    await this.waitForIsShown(true);
    await this.openLoginWithPassword();
    await this.setEmail(email);
    await this.setPassword(password);
    await this.submitLogin();
  }
}
