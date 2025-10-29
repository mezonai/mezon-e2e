export enum CLAN_MENU_SELECTOR {
    HEADER_CONTAINER = "~channelList.header.container",
    OPEN_MENU = "~channelList.header.title",
    MENU_CONTAINER = "~mezonMenu.container",
}

export class ClanMenuScreen {
    private DEFAULT_TIMEOUT = 15000;

    static init() {
        return new ClanMenuScreen();
    }

    static async using<T>(fn: (obj: ClanMenuScreen) => Promise<T>): Promise<T> {
        return fn(ClanMenuScreen.init());
    }

    private async show(selector: string, timeout = this.DEFAULT_TIMEOUT) {
        const el = $(selector);
        await el.waitForExist({ timeout });
        await el.waitForDisplayed({ timeout });
        return el;
    }

    async openFromHeader() {
        const btn = await this.show(CLAN_MENU_SELECTOR.OPEN_MENU);
        await btn.click();
    }

    async waitForIsShown(timeout = this.DEFAULT_TIMEOUT) {
        await this.show(CLAN_MENU_SELECTOR.MENU_CONTAINER, timeout);
    }
}


