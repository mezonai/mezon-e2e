import { ChannelStatus, ChannelType, ClanPageV2 } from "@/pages/ClanPageV2";
import test, { expect } from "@playwright/test";
import { randomUUID } from "crypto";

test.describe('Create New Channels', () => {
    let clanName: string;

    test.beforeEach(async ({ page }) => {
        clanName = `New Clan ${new Date().getTime()}`;
        const clanPage = new ClanPageV2(page);
        await clanPage.navigate('/chat/direct/friends');
        await clanPage.clickCreateClanButton();
        await clanPage.createNewClan(clanName);
    });

    test.afterEach(async ({ page }) => {
        const clanPage = new ClanPageV2(page);

        const deletedClan = await clanPage.deleteClan(clanName);
        if (deletedClan) {
            console.log(`Successfully deleted clan: ${clanName}`);
        } else {
            console.log(`Failed to delete clan: ${clanName}`);
        }
    });

    test('Verify that I can create a new private text channel', async ({ page }) => {
        const ran = Math.floor(Math.random() * 999) + 1;
        const channelName = `text-channel-${ran}`;
        const clanPage = new ClanPageV2(page);
        await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PRIVATE);
        const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
        expect(isNewChannelPresent).toBe(true);
    });

    test('Verify that I can create a new public text channel', async ({ page }) => {
        const ran = Math.floor(Math.random() * 999) + 1;
        const channelName = `text-channel-${ran}`;
        const clanPage = new ClanPageV2(page);
        await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC);
        const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
        expect(isNewChannelPresent).toBe(true);
    });

    test('Verify that I can create a new voice channel', async ({ page }) => {
        const ran = Math.floor(Math.random() * 999) + 1;
        const channelName = `voice-channel-${ran}`;
        const clanPage = new ClanPageV2(page);
        await clanPage.createNewChannel(ChannelType.VOICE, channelName);
        const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
        expect(isNewChannelPresent).toBe(true);
    });

    test('Verify that I can create a new stream channel', async ({ page }) => {
       const ran = Math.floor(Math.random() * 999) + 1;
        const channelName = `text-channel-${ran}`;
        const clanPage = new ClanPageV2(page);
        await clanPage.createNewChannel(ChannelType.STREAM, channelName);
        const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
        expect(isNewChannelPresent).toBe(true);
    });

})