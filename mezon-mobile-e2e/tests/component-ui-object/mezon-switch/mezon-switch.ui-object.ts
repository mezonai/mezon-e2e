import { SELECTOR } from "./constants/SELECTOR.js";

export class MezonSwitchUIObject {
    static selector = SELECTOR;

    private root: WebdriverIO.Element;

    private constructor(root: WebdriverIO.Element) {
        this.root = root;
    }

    static init() {
        return new MezonSwitchUIObject($(SELECTOR.CONTAINER) as any);
    }

    static fromRoot(root: WebdriverIO.Element) {
        return new MezonSwitchUIObject(root);
    }

    private DEFAULT_TIMEOUT = 15000;

    private async show(selector: SELECTOR, timeout = this.DEFAULT_TIMEOUT) {
        const el = this.root.$(selector);
        await el.waitForExist({ timeout });
        await el.waitForDisplayed({ timeout });
        return el;
    }

    async toggle() {
        const el = await this.show(SELECTOR.CONTAINER);
        await el.click();
    }
}


