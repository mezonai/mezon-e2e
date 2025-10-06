import { SELECTOR } from "./constants/SELECTOR.js";

export class MezonButtonUIObject {
    private constructor() {}

    static init() {
        return new MezonButtonUIObject();
    }

    static async using<T>(
        fn: (obj: MezonButtonUIObject) => Promise<T>
    ): Promise<T> {
        return fn(MezonButtonUIObject.init());
    }

    private DEFAULT_TIMEOUT = 10000;

    async waitForVisible(timeout = 15000) {
        await this.show(SELECTOR.BUTTON, timeout);
    }

    private async show(selector: SELECTOR, timeout = this.DEFAULT_TIMEOUT) {
        const el = $(selector);
        await el.waitForExist({ timeout });
        await el.waitForDisplayed({ timeout });
        return el;
    }

    async click() {
        const button = await this.show(SELECTOR.BUTTON);
        await button.click();
    }

    get button() {
        return $(SELECTOR.BUTTON);
    }

    get title() {
        return $(SELECTOR.TITLE);
    }
}
