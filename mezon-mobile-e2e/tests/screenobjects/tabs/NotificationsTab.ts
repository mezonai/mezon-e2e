export class NotificationsTabScreen {
    private DEFAULT_TIMEOUT = 20000;

    static init() {
        return new NotificationsTabScreen();
    }

    static async using<T>(fn: (obj: NotificationsTabScreen) => Promise<T>): Promise<T> {
        return fn(NotificationsTabScreen.init());
    }

    private get root() {
        return $("~notifications");
    }

    async waitForIsShown(isShown = true): Promise<boolean | void> {
        return this.root.waitForDisplayed({ timeout: this.DEFAULT_TIMEOUT, reverse: !isShown });
    }
}


