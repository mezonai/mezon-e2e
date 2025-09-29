import { SELECTOR } from "./constants/index.js";
import { MezonButtonIconUIObject } from "./mezon-button-icon.ui-object.js";

export class MezonButtonListUIObject {
    static async all() {
        const containers = await $$(SELECTOR.CONTAINER);
        const btnObjs = containers.map(async (c) =>
            MezonButtonIconUIObject.fromRoot(c as any)
        );
        return btnObjs;
    }

    static async findByTitle(title: string): Promise<MezonButtonIconUIObject> {
        const all = await this.all();
        for (const b of all) {
            if ((await (await b.title).getText()) === title) return b;
        }
    }
}
