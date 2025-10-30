import { ITEM_BTN, ITEM_TEXT_WRAPPER, SELECTOR } from "./constants/SELECTOR.js";

export class MezonMenuUIObject {
    static selector = SELECTOR;

    private root: WebdriverIO.Element;

    private constructor(root: WebdriverIO.Element) {
        this.root = root;
    }

    static init() {
        return new MezonMenuUIObject($(SELECTOR.CONTAINER) as any);
    }

    static fromRoot(root: WebdriverIO.Element) {
        return new MezonMenuUIObject(root);
    }

    private DEFAULT_TIMEOUT = 15000;

    private async show(selector: string, timeout = this.DEFAULT_TIMEOUT) {
        const el = this.root.$(selector);
        await el.waitForExist({ timeout });
        await el.waitForDisplayed({ timeout });
        return el;
    }

    async waitForVisible(timeout = this.DEFAULT_TIMEOUT) {
        await this.show(SELECTOR.CONTAINER, timeout);
    }

    async tapItemByTitle(title: string) {
        const btn = await this.show(ITEM_BTN(title));
        await btn.click();
    }

    async getItemTitleElement(title: string) {
        return this.show(ITEM_TEXT_WRAPPER(title));
    }
}


