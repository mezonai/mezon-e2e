export enum TABLET_SELECTOR {
    CONTAINER = "~home.tablet",
    LEFT_PANE = "~home.tablet.leftPane",
    RIGHT_PANE = "~home.tablet.rightPane",
}

import { HomeScreen } from "../home.screen.js";

export class HomeTabletScreen {
    private DEFAULT_TIMEOUT = 15000;

    private async show(selector: string, timeout = this.DEFAULT_TIMEOUT) {
        const el = $(selector);
        await el.waitForExist({ timeout });
        await el.waitForDisplayed({ timeout });
        return el;
    }

    async waitForIsShown(isShown = true) {
        if (isShown) {
            await this.show(TABLET_SELECTOR.CONTAINER);
            await this.show(TABLET_SELECTOR.LEFT_PANE);
            await this.show(TABLET_SELECTOR.RIGHT_PANE);
            return;
        }
        const el = $(TABLET_SELECTOR.CONTAINER);
        return el.waitForDisplayed({
            timeout: this.DEFAULT_TIMEOUT,
            reverse: true,
        });
    }

    get container() {
        return $(TABLET_SELECTOR.CONTAINER);
    }
    get leftPane() {
        return $(TABLET_SELECTOR.LEFT_PANE);
    }
    get rightPane() {
        return $(TABLET_SELECTOR.RIGHT_PANE);
    }

    // Server and clan interactions
    async tapDmLogo() {
        const el = await this.show("~serverList.logoButton");
        await el.click();
    }

    async openClanList() {
        return this.show("~listClanPopup.container");
    }

    async selectClanById(clanId: string) {
        const selector = `~clanIcon.${clanId}`;
        const el = await this.show(selector);
        await el.click();
    }

    // Channel list interactions
    async waitForChannelList() {
        return this.show("~channelList");
    }

    async selectChannelById(channelId: string) {
        const el = await this.show(`~channelList.item.${channelId}`);
        await el.click();
    }

    async openChannelSearch() {
        const el = await this.show("~channelList.header.search");
        await el.click();
    }

    async typeInChat(text: string) {
        const el = await this.show("~chat.input");
        await el.click();
        await el.setValue(text);
    }

    async sendChat() {
        const sendBtn = await this.show("~chat.sendButton");
        await sendBtn.click();
    }

    async sendMessage(text: string) {
        await this.typeInChat(text);
        await this.sendChat();
    }

    async waitForHomeDefaultShown() {
        const hs = await HomeScreen.using(async (hs) => {
            await hs.waitForIsShown(true);
            return hs;
        });
        return hs;
    }
}

export const HomeTablet = new HomeTabletScreen();
