export class AppScreen {
    protected driver: WebdriverIO.Browser;
    private appId: string;

    constructor(driver: WebdriverIO.Browser) {
        this.driver = driver;
    }

    private getAppLaunchParam(): { bundleId?: string; appId?: string } {
        if (this.driver.isAndroid) {
            const caps = this.driver.capabilities as any;
            const appId = caps["appPackage"];
            this.appId = appId;
            return { appId: appId };
        } else if (this.driver.isIOS) {
            const caps = this.driver.capabilities as any;
            const bundleId = caps["bundleId"];
            this.appId = bundleId;
            return { bundleId: bundleId };
        } else {
            throw new Error("[BasePage] Unknown platform");
        }
    }

    async openApp() {
        await this.driver.execute(
            "mobile: activateApp",
            this.getAppLaunchParam()
        );
    }

    async terminateApp() {
        await this.driver.execute(
            "mobile: terminateApp",
            this.getAppLaunchParam()
        );
    }

    async enableBiometric() {
        const param = this.getAppLaunchParam();
        await this.driver.execute("mobile: enrollBiometric", {
            isEnabled: true,
            ...param,
        });
    }

    async waitUntilAppIsReady(
        driver: WebdriverIO.Browser,
        timeout = 10000
    ): Promise<boolean> {

        return await driver.waitUntil(
            async () => {
                if (this.driver.isAndroid) {
                    const source = await driver.getPageSource();
                    return source.includes(this.appId);
                } else {
                    const state = await driver.execute(
                        "mobile: queryAppState",
                        {
                            bundleId: this.appId,
                        }
                    );
                    return state === 4;
                }
            },
            {
                timeout,
                timeoutMsg: `App [${this.appId}] failed to become ready within ${
                    timeout / 1000
                } seconds`,
            }
        );
    }
}
