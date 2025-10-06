import { ListClanPopupComponent } from "./components/index.js";
import { Step } from "../../decorators/step.decorator.js";

export class HomeScreen {
    private listClanPopup: ListClanPopupComponent;
    private constructor() {
        this.listClanPopup = ListClanPopupComponent.init();
    }

    static init() {
        return new HomeScreen();
    }

    static async using<T>(fn: (obj: HomeScreen) => Promise<T>): Promise<T> {
        return fn(HomeScreen.init());
    }

    private DEFAULT_TIMEOUT = 15000;

    private async show(selector: string, timeout = this.DEFAULT_TIMEOUT) {
        const el = $(selector as string);
        await el.waitForExist({ timeout });
        await el.waitForDisplayed({ timeout });
        return el;
    }

    public getListClanPopup() {
        return this.listClanPopup;
    }

    @Step("Open Create Clan Modal")
    public async openCreateClanModal() {
        await this.listClanPopup.waitForVisible();
        return this.listClanPopup.openCreateClanModal();
    }
}
