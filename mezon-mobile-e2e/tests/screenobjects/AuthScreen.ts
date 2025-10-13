export class AuthScreen {
    static init() {
        return new AuthScreen();
    }

    static async using<T>(fn: (auth: AuthScreen) => Promise<T>): Promise<T> {
        return fn(AuthScreen.init());
    }

    private constructor() {}

 
    private get loginScreen() {
        return $("~login.screen");
    }
    private get otpScreen() {
        return $("~otp.screen");
    }
    private tab(name: "home" | "messages" | "notifications" | "profile") {
        const map: Record<string, string> = {
            home: "bottomTab.home",
            messages: "bottomTab.messages",
            notifications: "bottomTab.notifications",
            profile: "bottomTab.profile",
        };
        return $(`~${map[name]}`);
    }

    // States
    async waitForUnauthenticated(timeout = 45000): Promise<void> {
        await this.loginScreen.waitForDisplayed({ timeout });
    }

    async switchToPasswordLogin(): Promise<void> {
        await $(`~login.switch.password`).click();
    }

    async waitForOtp(timeout = 45000): Promise<void> {
        await this.otpScreen.waitForDisplayed({ timeout });
    }

    async waitForAuthenticated(timeout = 60000): Promise<void> {
        await this.tab("home").waitForDisplayed({ timeout });
    }

    async goToTab(
        name: "home" | "messages" | "notifications" | "profile"
    ): Promise<void> {
        const el = await this.tab(name);
        await el.waitForDisplayed({ timeout: 20000 });
        await el.click();
    }

    async expectOnHome(): Promise<void> {
        await expect(this.tab("home")).toBeDisplayed();
    }

    async expectOnMessages(): Promise<void> {
        await expect(this.tab("messages")).toBeDisplayed();
    }
}
