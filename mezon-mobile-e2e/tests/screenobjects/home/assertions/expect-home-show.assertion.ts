import { HomeScreen } from "../home.screen.js";

export async function expectHomeShown(): Promise<void> {
    await HomeScreen.using(async (hs) => {
        await hs.waitForIsShown(true);
    });
}
