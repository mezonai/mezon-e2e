import { DURATION_CODE, SELECTOR } from "./constants/index.js";

export class AddStatusUserModalObject {
    private constructor() {}

    static init() {
        return new AddStatusUserModalObject();
    }

    static async using<T>(
        fn: (obj: AddStatusUserModalObject) => Promise<T>
    ): Promise<T> {
        return fn(AddStatusUserModalObject.init());
    }

    private DEFAULT_TIMEOUT = 10000;

    async waitForVisible(timeout = 15000) {
        await this.show(SELECTOR.CONTAINER, timeout);
    }

    private async show(selector: SELECTOR, timeout = this.DEFAULT_TIMEOUT) {
        const el = $(selector);
        await el.waitForExist({ timeout });
        await el.waitForDisplayed({ timeout });
        return el;
    }

    async setStatusText(text: string) {
        const input = await this.show(SELECTOR.INPUT_TEXT);
        await input.click();
        await input.clearValue?.();
        await input.setValue(text);
    }

    private optionBy(code: DURATION_CODE) {
        return `~mezonOption.radioButton.${code}` as SELECTOR;
    }

    async pickDuration(code: DURATION_CODE) {
        const el = await this.show(this.optionBy(code));
        await el.click();
    }

    async save() {
        const btn = await this.show(SELECTOR.CONFIRM);
        await btn.click();
    }

    async updateStatus(payload: { text: string; duration: DURATION_CODE }) {
        await this.waitForVisible();
        await this.setStatusText(payload.text);
        await this.pickDuration(payload.duration);
        await this.save();
    }

    get container() {
        return $(SELECTOR.CONTAINER);
    }
    get title() {
        return $(SELECTOR.TITLE);
    }
}
