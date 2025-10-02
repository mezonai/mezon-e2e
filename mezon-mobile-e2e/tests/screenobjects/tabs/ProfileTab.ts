export class ProfileTabScreen {
    private DEFAULT_TIMEOUT = 20000;

    static init() {
        return new ProfileTabScreen();
    }

    static async using<T>(fn: (obj: ProfileTabScreen) => Promise<T>): Promise<T> {
        return fn(ProfileTabScreen.init());
    }

    private get root() {
        return $("~profile");
    }

    async waitForIsShown(isShown = true): Promise<boolean | void> {
        return this.root.waitForDisplayed({ timeout: this.DEFAULT_TIMEOUT, reverse: !isShown });
    }
}


