export type BottomTabKey = "home" | "messages" | "notifications" | "profile";
import { HomeTabScreen } from "./tabs/HomeTab.js";
import { MessagesTabScreen } from "./tabs/MessagesTab.js";
import { NotificationsTabScreen } from "./tabs/NotificationsTab.js";
import { ProfileTabScreen } from "./tabs/ProfileTab.js";

export class BottomNavigator {
    private DEFAULT_TIMEOUT = 20000;

    static init() {
        return new BottomNavigator();
    }

    static async using<T>(fn: (obj: BottomNavigator) => Promise<T>): Promise<T> {
        return fn(BottomNavigator.init());
    }

    private get wrapper() {
        return $("~bottomNavigatorWrapper");
    }

    async waitForIsShown(isShown = true): Promise<boolean | void> {
        if (isShown) {
            await this.wrapper.waitForDisplayed({ timeout: this.DEFAULT_TIMEOUT });
            return;
        }
        return this.wrapper.waitForDisplayed({ timeout: this.DEFAULT_TIMEOUT, reverse: true });
    }

    private tabSelectorMap: Record<BottomTabKey, string> = {
        home: "~home",
        messages: "~messages",
        notifications: "~notifications",
        profile: "~profile",
    };

    async tapTabByKey(key: BottomTabKey): Promise<void> {
        const selector = this.tabSelectorMap[key];
        const el = $(selector);
        await el.waitForDisplayed({ timeout: this.DEFAULT_TIMEOUT });
        await el.click();
    }

    async openHome() {
        // await this.waitForIsShown(true);
        await this.tapTabByKey("home");
        const screen = HomeTabScreen.init();
        await screen.waitForIsShown(true);
        return screen;
    }

    async openMessages() {
        // await this.waitForIsShown(true);
        await this.tapTabByKey("messages");
        const screen = MessagesTabScreen.init();
        await screen.waitForIsShown(true);
        return screen;
    }

    async openNotifications() {
        // await this.waitForIsShown(true);
        await this.tapTabByKey("notifications");
        const screen = NotificationsTabScreen.init();
        await screen.waitForIsShown(true);
        return screen;
    }

    async openProfile() {
        // await this.waitForIsShown(true);
        await this.tapTabByKey("profile");
        const screen = ProfileTabScreen.init();
        await screen.waitForIsShown(true);
        return screen;
    }
}

export const bottomNavigator = new BottomNavigator();


