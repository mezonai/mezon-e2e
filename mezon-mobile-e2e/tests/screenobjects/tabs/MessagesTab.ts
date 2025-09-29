export class MessagesTabScreen {
    private DEFAULT_TIMEOUT = 20000;

    static init() {
        return new MessagesTabScreen();
    }

    static async using<T>(fn: (obj: MessagesTabScreen) => Promise<T>): Promise<T> {
        return fn(MessagesTabScreen.init());
    }

    private get root() {
        return $("~messages");
    }

    async waitForIsShown(isShown = true): Promise<boolean | void> {
        return this.root.waitForDisplayed({ timeout: this.DEFAULT_TIMEOUT, reverse: !isShown });
    }
}


