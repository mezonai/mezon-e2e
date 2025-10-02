import { SELECTOR } from "./constants/index.js";

export class MezonInputObject {
    private constructor() {}

    static init() {
        return new MezonInputObject();
    }

    static async using<T>(
        fn: (obj: MezonInputObject) => Promise<T>
    ): Promise<T> {
        return fn(MezonInputObject.init());
    }

    private DEFAULT_TIMEOUT = 10000;

    async waitForVisible(timeout = 15000) {
        await this.show(SELECTOR.LABEL, timeout);
    }

    private async show(selector: SELECTOR, timeout = this.DEFAULT_TIMEOUT) {
        const el = $(selector);
        await el.waitForExist({ timeout });
        await el.waitForDisplayed({ timeout });
        return el;
    }

    async setInput(text: string) {
        const input = await this.show(SELECTOR.INPUT);
        await input.click();
        await input.clearValue?.();
        await input.setValue(text);
    }

    async clearInput() {
        const input = await this.show(SELECTOR.CLEAR_BTN);
        await input.click();
    }

    get clearBtn() {
        return $(SELECTOR.CLEAR_BTN);
    }

    get label() {
        return $(SELECTOR.LABEL);
    }
    get input() {
        return $(SELECTOR.INPUT);
    }
}
