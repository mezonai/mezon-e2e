import { SELECTOR } from "./constants/SELECTOR.js";

export class MezonButtonIconUIObject {
    static selector: typeof SELECTOR = SELECTOR;
    private root: WebdriverIO.Element;

    private constructor(root: WebdriverIO.Element) {
        this.root = root;
    }

    static async init() {
        return new MezonButtonIconUIObject($(SELECTOR.CONTAINER) as any);
    }

    static fromRoot(root: WebdriverIO.Element) {
        return new MezonButtonIconUIObject(root);
    }

    private DEFAULT_TIMEOUT = 10000;

    async waitForVisible(timeout = 15000) {
        await this.show(SELECTOR.CONTAINER, timeout);
    }

    private async show(selector: SELECTOR, timeout = this.DEFAULT_TIMEOUT) {
        const el = this.root.$(selector);
        await el.waitForExist({ timeout });
        await el.waitForDisplayed({ timeout });
        return el;
    }

    async click() {
        const button = await this.show(SELECTOR.CONTAINER);
        await button.click();
    }

    get button() {
        return this.root.$(SELECTOR.CONTAINER);
    }

    get title() {
        return this.root.$(SELECTOR.TITLE);
    }
}
