import { sleep } from '../utils/index.js';

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

  private get switchSMSLink() {
    return $('~login.switch.SMS');
  }

  private get phoneInput() {
    return $('~login.phone.input');
  }

  private get verifyPrimaryButton() {
    return $('~otp.verify.primary.button');
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
    await sleep(2000);
    await this.switchPasswordLink.waitForDisplayed({
      timeout: 45000,
    });
    if (await this.switchPasswordLink.isExisting()) {
      await this.switchPasswordLink.click();
    }
  }

  async openLoginWithSMS(): Promise<void> {
    await sleep(2000);
    await this.switchSMSLink.waitForDisplayed({
      timeout: 45000,
    });
    if (await this.switchSMSLink.isExisting()) {
      await this.switchSMSLink.click();
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

  async setPhone(value: string): Promise<void> {
    await this.phoneInput.waitForDisplayed({ timeout: 20000 });
    await this.phoneInput.setValue(value);
  }

  async setOTP(value: string): Promise<void> {
    await $('~otp.input.0').waitForDisplayed({ timeout: 20000 });
    await Promise.all(
      value.split('').map(async (char, index) => {
        await $(`~otp.input.${index}`).setValue(char);
      })
    );
  }

  async submitLogin(): Promise<void> {
    await this.primaryButton.waitForEnabled({ timeout: 20000 });
    await this.primaryButton.click();
  }



  async loginWithPassword(email: string, password: string): Promise<void> {
    await this.openLoginWithPassword();
    await this.setEmail(email);
    await this.setPassword(password);
    await this.submitLogin();
  }

  async loginWithPhone(phone: string, otp: string): Promise<void> {
    await this.openLoginWithSMS();
    await this.setPhone(phone);
    await this.submitLogin();
    await this.setOTP(otp);
    // await this.submitOTP();
  }

  async loginWithEmail(email: string, otp: string): Promise<void> {
    await this.setEmail(email);
    await this.submitLogin();
    await this.setOTP(otp);
    // await this.submitOTP();
  }
}
