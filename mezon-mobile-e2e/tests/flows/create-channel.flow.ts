import {
    ServerAndChannelListScreen,
    HomeTablet,
    CategoryMenuScreen,
    ChannelCreatorScreen,
    longPress,
} from "../screenobjects/index.js";

export interface CreateChannelOptions {
    clanId?: string;
    categoryId?: string;
    channelName: string;
}

export async function createChannelFlow(
    opts: CreateChannelOptions
): Promise<void> {
    const { clanId, categoryId, channelName } = opts;

    await HomeTablet.waitForIsShown(true);

    if (clanId) {
        await HomeTablet.tapDmLogo();
        await HomeTablet.openClanList();
        await HomeTablet.selectClanById(clanId);
    }

    await HomeTablet.waitForChannelList();

    const list = new ServerAndChannelListScreen();
    const headerSelector = `~channelList.section.header.${categoryId}`;
    const header = await list.scrollChannelListTo(headerSelector, {
        maxSwipes: 10,
        profile: "medium",
    });
    await longPress(header, 700);

    await CategoryMenuScreen.using(async (categoryMenu) => {
        await categoryMenu.waitForIsShown(true);
        await categoryMenu.tapCreateChannel();
    });
    await ChannelCreatorScreen.using(async (channelCreator) => {
        await channelCreator.waitForIsShown(true);
        await channelCreator.setChannelName(channelName);
        await channelCreator.submitCreate();
    });
}
