export enum SERVER_CHANNEL_SELECTOR {
    CONTAINER = "~serverAndChannelList",
    SERVER_LIST = "~serverList",
    DM_LOGO_BUTTON = "~serverList.logoButton",
    CLAN_LIST = "~listClanPopup.container",
    CHANNEL_LIST = "~channelList",
    CHANNEL_LIST_FLAT = "~channelList.flatList",
    CHANNEL_HEADER_SEARCH = "~channelList.header.search",
}

export class ServerAndChannelListScreen {
    private DEFAULT_TIMEOUT = 15000;

    static init() {
        return new ServerAndChannelListScreen();
    }

    static async using<T>(
        fn: (obj: ServerAndChannelListScreen) => Promise<T>
    ): Promise<T> {
        return fn(ServerAndChannelListScreen.init());
    }

    private async show(selector: string, timeout = this.DEFAULT_TIMEOUT) {
        const el = $(selector);
        await el.waitForExist({ timeout });
        await el.waitForDisplayed({ timeout });
        return el;
    }

    async waitForIsShown(isShown = true) {
        if (isShown) {
            await this.show(SERVER_CHANNEL_SELECTOR.CONTAINER);
            await this.show(SERVER_CHANNEL_SELECTOR.SERVER_LIST);
            await this.show(SERVER_CHANNEL_SELECTOR.CHANNEL_LIST);
            return;
        }
        const el = $(SERVER_CHANNEL_SELECTOR.CONTAINER);
        return el.waitForDisplayed({
            timeout: this.DEFAULT_TIMEOUT,
            reverse: true,
        });
    }

    async tapDmLogo() {
        const el = await this.show(SERVER_CHANNEL_SELECTOR.DM_LOGO_BUTTON);
        await el.click();
    }

    async selectClanById(clanId: string) {
        const el = await this.show(`~clanIcon.${clanId}`);
        await el.click();
    }

    async openSearch() {
        const el = await this.show(
            SERVER_CHANNEL_SELECTOR.CHANNEL_HEADER_SEARCH
        );
        await el.click();
    }

    async selectChannelById(channelId: string) {
        const el = await this.show(`~channelList.item.${channelId}`);
        await el.click();
    }

    async scrollChannelListTo(
        selector: string,
        opts?: { maxSwipes?: number; profile?: "short" | "medium" | "long" }
    ) {
        const { maxSwipes = 8, profile = "medium" } = opts ?? {};
        const list = await this.show(SERVER_CHANNEL_SELECTOR.CHANNEL_LIST_FLAT);

        const { swipe } = await import("../gestures.js");

        for (let i = 0; i < maxSwipes; i++) {
            const candidates = await list.$$(selector);
            if (candidates.length) {
                const el = candidates[0] as any;
                if (typeof el.isDisplayedInViewport === "function") {
                    if (await el.isDisplayedInViewport()) return el;
                } else {
                    return el;
                }
            }
            await swipe(list, "up", profile);
        }

        throw new Error(
            `Element not found after ${maxSwipes} swipes: ${selector}`
        );
    }
}
