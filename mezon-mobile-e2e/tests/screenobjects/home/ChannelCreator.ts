export enum CHANNEL_CREATOR_SELECTOR {
    SCREEN = "~channelCreator.screen",
    HEADER_CREATE = "~channelCreator.header.create",
    HEADER_CLOSE = "~channelCreator.header.close",
    INPUT_NAME = "~channelCreator.input.channelName",
    OPTION_TYPE = "~channelCreator.option.channelType",
    MENU_PRIVATE = "~channelCreator.menu.private",
}

export class ChannelCreatorScreen {
    private DEFAULT_TIMEOUT = 15000;

    static init() {
        return new ChannelCreatorScreen();
    }

    static async using<T>(
        fn: (obj: ChannelCreatorScreen) => Promise<T>
    ): Promise<T> {
        return fn(ChannelCreatorScreen.init());
    }

    private async show(selector: string, timeout = this.DEFAULT_TIMEOUT) {
        const el = $(selector);
        await el.waitForExist({ timeout });
        await el.waitForDisplayed({ timeout });
        return el;
    }

    async waitForIsShown(isShown = true) {
        if (isShown) {
            await this.show(CHANNEL_CREATOR_SELECTOR.SCREEN);
            return;
        }
        const el = $(CHANNEL_CREATOR_SELECTOR.SCREEN);
        return el.waitForDisplayed({
            timeout: this.DEFAULT_TIMEOUT,
            reverse: true,
        });
    }

    async setChannelName(name: string) {
        const input = await this.show(CHANNEL_CREATOR_SELECTOR.INPUT_NAME);
        if (typeof (input as any).clearValue === "function") {
            await (input as any).clearValue();
        }
        await input.setValue(name);
    }

    async submitCreate() {
        const btn = await this.show(CHANNEL_CREATOR_SELECTOR.HEADER_CREATE);
        await btn.click();
    }
}
