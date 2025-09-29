import { SELECTOR } from "./constants/index.js";
import {
    MezonButtonIconUIObject,
    MezonButtonListUIObject,
} from "../../../../component-ui-object/index.js";
import { Step } from "../../../../decorators/step.decorator.js";

export class InviteToChannelComponent {
    private DEFAULT_TIMEOUT = 15000;
    private btnInvite: MezonButtonIconUIObject;

    private constructor(btnInvite: MezonButtonIconUIObject) {
        this.btnInvite = btnInvite;
    }

    static async init(): Promise<InviteToChannelComponent> {
        const btnInvite = await MezonButtonListUIObject.findByTitle("Lời mời");
        return new InviteToChannelComponent(btnInvite);
    }

    static async using<T>(
        fn: (c: InviteToChannelComponent) => Promise<T>
    ): Promise<T> {
        return fn(await InviteToChannelComponent.init());
    }

    private async show(selector: string, timeout = this.DEFAULT_TIMEOUT) {
        const el = $(selector as string);
        await el.waitForExist({ timeout });
        await el.waitForDisplayed({ timeout });
        return el;
    }
}
