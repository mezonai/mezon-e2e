export class MezonLoginScreen {
    private email: string;
    static init() {
        return new MezonLoginScreen();
    }

    static async using<T>(
        fn: (ms: MezonLoginScreen) => Promise<T>
    ): Promise<T> {
        return fn(MezonLoginScreen.init());
    }

    private constructor() {}

    private get root() {
        return $("~login.screen");
    }
    private get emailInput() {
        return $("~login.email.input");
    }
    private get phoneInput() {
        return $("~login.phone.input");
    }
    private get passwordInput() {
        return $("~login.password.input");
    }
    private get primaryButton() {
        return $("~login.primary.button");
    }
    private get switchSmsLink() {
        return $("~login.switch.sms");
    }
    private get switchPasswordLink() {
        return $("~login.switch.password");
    }
    private get switchOtpLink() {
        return $("~login.switch.otp");
    }
    private get toggleShowPasswordLabel() {
        return $("~login.toggle.showPassword");
    }

    async waitForIsShown(isShown = true): Promise<boolean> {
        return this.root.waitForDisplayed({
            timeout: 45000,
            reverse: !isShown,
        });
    }

    async openLoginWithOtp(): Promise<void> {
        if (await this.switchOtpLink.isExisting()) {
            await this.switchOtpLink.click();
        }
    }

    async setEmail(value: string): Promise<void> {
        await this.emailInput.waitForDisplayed({ timeout: 20000 });
        await this.emailInput.setValue(value);
    }

    async setPhone(value: string): Promise<void> {
        await this.switchSmsLink.click();
        await this.phoneInput.waitForDisplayed({ timeout: 20000 });
        await this.phoneInput.setValue(value);
    }

    async setPassword(value: string): Promise<void> {
        if (await this.switchPasswordLink.isExisting()) {
            await this.switchPasswordLink.click();
        }
        await this.passwordInput.waitForDisplayed({ timeout: 20000 });
        await this.passwordInput.setValue(value);
    }

    async toggleShowPassword(): Promise<void> {
        if (await this.toggleShowPasswordLabel.isExisting()) {
            await this.toggleShowPasswordLabel.click();
        }
    }

    async requestOtpFor(email: string): Promise<void> {
        this.email = email;
        await this.waitForIsShown(true);
        await this.setEmail(email);
        await this.primaryButton.click();
    }

    async submitLogin(): Promise<void> {
        await this.primaryButton.waitForEnabled({ timeout: 20000 });
        await this.primaryButton.click();
    }

    async submitOtp(otpCode: string): Promise<void> {
        const digits = otpCode.split("");
        await Promise.all(
            digits.map(async (digit, i) => {
                const input = await $(`~otp.input.${i}`);
                await input.setValue(digit);
            })
        );
    }

    async login(email: string, password: string): Promise<void> {
        await this.waitForIsShown(true);
        await this.setEmail(email);
        await this.setPassword(password);
        await this.submitLogin();
    }
}
