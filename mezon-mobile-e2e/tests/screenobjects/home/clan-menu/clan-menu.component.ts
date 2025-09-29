import { MezonButtonIconUIObject } from "../../../component-ui-object/mezon-button-icon/mezon-button-icon.ui-object.js";
import { MezonMenuUIObject } from "../../../component-ui-object/mezon-menu/index.js";
import { MezonSwitchUIObject } from "../../../component-ui-object/mezon-switch/index.js";

export class ClanMenuActionButtonsComponent {
    private DEFAULT_TIMEOUT = 15000;

    static async getByTitle(
        title: string
    ): Promise<MezonButtonIconUIObject | undefined> {
        const containers = (await $$(
            MezonButtonIconUIObject.selector.CONTAINER
        )) as unknown as any[];
        const btnObjs = containers.map((c) =>
            MezonButtonIconUIObject.fromRoot(c as any)
        );
        for (const b of btnObjs as any[]) {
            const text = await (await b.title).getText();
            if (text === title) return b;
        }
        return undefined;
    }

    static async clickByTitle(title: string) {
        const target = await ClanMenuActionButtonsComponent.getByTitle(title);
        await target?.click();
    }
}

export class ClanMenuListComponent {
    private menu = MezonMenuUIObject.init();

    async clickItem(title: string) {
        await this.menu.tapItemByTitle(title);
    }

    async toggleShowEmptyCategories() {
        const switchContainers = await $$(
            MezonSwitchUIObject.selector.CONTAINER
        );
        const first = switchContainers[0] as any;
        await MezonSwitchUIObject.fromRoot(first).toggle();
    }
}
