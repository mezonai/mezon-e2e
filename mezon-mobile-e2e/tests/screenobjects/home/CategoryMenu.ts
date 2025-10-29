export enum CATEGORY_MENU_SELECTOR {
    CONTAINER = "~categoryMenu.container",
    CREATE_CHANNEL = "~mezonMenuItem.btn.categoryMenu.createChannel",
}

export class CategoryMenuScreen {
    private DEFAULT_TIMEOUT = 15000;

    static init() {
        return new CategoryMenuScreen();
    }

    static async using<T>(fn: (obj: CategoryMenuScreen) => Promise<T>): Promise<T> {
        return fn(CategoryMenuScreen.init());
    }

    private async show(selector: string, timeout = this.DEFAULT_TIMEOUT) {
        const el = $(selector);
        await el.waitForExist({ timeout });
        await el.waitForDisplayed({ timeout });
        return el;
    }

    async waitForIsShown(isShown = true) {
        if (isShown) {
            await this.show(CATEGORY_MENU_SELECTOR.CONTAINER);
            return;
        }
        const el = $(CATEGORY_MENU_SELECTOR.CONTAINER);
        return el.waitForDisplayed({ timeout: this.DEFAULT_TIMEOUT, reverse: true });
    }

    async tapCreateChannel() {
        const el = await this.show(CATEGORY_MENU_SELECTOR.CREATE_CHANNEL);
        await el.click();
    }
}



