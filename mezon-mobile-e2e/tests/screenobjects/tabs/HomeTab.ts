export class HomeTabScreen {
    private DEFAULT_TIMEOUT = 20000;

    static init() {
        return new HomeTabScreen();
    }

    static async using<T>(fn: (obj: HomeTabScreen) => Promise<T>): Promise<T> {
        return fn(HomeTabScreen.init());
    }

    private get tabletContainer() {
        return $("~home.tablet");
    }
    private get serverAndChannelList() {
        return $("~serverAndChannelList");
    }
    private get homeScreenRoot() {
        return $("~homeScreen");
    }

    async waitForIsShown(isShown = true): Promise<boolean | void> {
        if (isShown) {
            // Wait for any of home containers depending on layout
            const start = Date.now();
            const timeout = this.DEFAULT_TIMEOUT;
            while (Date.now() - start < timeout) {
                if (await this.tabletContainer.isDisplayed().catch(() => false)) return;
                if (await this.serverAndChannelList.isDisplayed().catch(() => false)) return;
                if (await this.homeScreenRoot.isDisplayed().catch(() => false)) return;
                await browser.pause(200);
            }
            throw new Error("Home tab not shown within timeout");
        }

        // reverse: ensure none of them are visible
        const endAt = Date.now() + this.DEFAULT_TIMEOUT;
        while (Date.now() < endAt) {
            const anyVisible =
                (await this.tabletContainer.isDisplayed().catch(() => false)) ||
                (await this.serverAndChannelList.isDisplayed().catch(() => false)) ||
                (await this.homeScreenRoot.isDisplayed().catch(() => false));
            if (!anyVisible) return;
            await browser.pause(200);
        }
        return false;
    }
}


