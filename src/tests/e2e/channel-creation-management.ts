import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { ChannelPage } from '@/pages/ChannelPage';
import { GLOBAL_CONFIG, ROUTES } from '@/config/environment';


test.describe('Create Text Channels', () => {
    test.beforeEach(async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
    
        await page.goto(`${GLOBAL_CONFIG.LOCAL_BASE_URL}${ROUTES.DIRECT_FRIENDS}`);
    });

    const now = new Date();
    const dateTimeString = now.toISOString().replace(/[:.]/g, '-');

    const textChannelPrivate = `text-channel-private-${dateTimeString}`;
    const textChannelPublic = `text-channel-public-${dateTimeString}`;
    const textChannelCancel = `text-channel-cancel-${dateTimeString}`;
    const textChannelExist = `text-channel-exist16`;

    const voiceChannel = `voice-channel-${dateTimeString}`;
    const voiceChannelCancel = `voice-channel-cancel-${dateTimeString}`;
    const voiceChannelExist = `voice-channel-exist16`;

    test('should create private text channel', async ({ page }) => {
        const channelPage = new ChannelPage(page);

        await test.step(`Create private text channel named "${textChannelPrivate}"`, async () => {
            await channelPage.createTextChannel(textChannelPrivate, 'private');
        });

        await test.step('Verify private text channel exists', async () => {
            const exists = await channelPage.isTextChannelCreated(textChannelPrivate);
            expect(exists).toBe(true);
        });
    });

    // test('should create public text channel', async ({ page }) => {
    //      const channelPage = new ChannelPage(page);

    //     await test.step(`Create public text channel named "${textChannelPublic}"`, async () => {
    //         await channelPage.createTextChannel(textChannelPublic, 'public');
    //     });

    //     await test.step('Verify public text channel exists', async () => {
    //         const exists = await channelPage.isTextChannelCreated(textChannelPublic);
    //         expect(exists).toBe(true);
    //     });
    // });

    // test('should cancel creation of text channel', async ({ page }) => {
    //     const channelPage = new ChannelPage(page);

    //     await test.step(`Attempt to create text channel named "${textChannelCancel}" and cancel`, async () => {
    //         await channelPage.cancelCreateVoiceChannel(textChannelCancel);
    //     });

    //     await test.step('Verify text channel was NOT created', async () => {
    //         const exists = await channelPage.isTextChannelCreated(textChannelCancel);
    //         expect(exists).toBe(false);
    //     });
    // });

    // test('should appear the error message when input exist name in text channel', async ({ page }) => {
    //     const channelPage = new ChannelPage(page);

    //     await test.step(`Attempt to create text channel named "${textChannelExist}" and cancel`, async () => {
    //         await channelPage.createTextChannel(textChannelExist, 'public');
    //     });

    //     await test.step(`Attempt to create text channel exist named "${textChannelExist}" and cancel`, async () => {
    //         await channelPage.createTextChannel(textChannelExist, 'public');
    //     });

    //     await test.step('Verify error message is appeared', async () => {
    //         const exists = await channelPage.isErrMsgWhenExistsName();
    //         expect(exists).toBe(true);
    //     });
    // });

    // test('should create voice channel', async ({ page }) => {
    //      const channelPage = new ChannelPage(page);

    //     await test.step(`Create voice channel named "${voiceChannel}"`, async () => {
    //         await channelPage.createVoiceChannel(voiceChannel);
    //     });

    //     await test.step('Verify voice channel exists', async () => {
    //         const exists = await channelPage.isVoiceChannelCreated(voiceChannel);
    //         expect(exists).toBe(true);
    //     });
    // });

    // test('should cancel creation of voice channel', async ({ page }) => {
    //      const channelPage = new ChannelPage(page);

    //     await test.step(`Attempt to create voice channel named "${voiceChannelCancel}" and cancel`, async () => {
    //         await channelPage.cancelCreateVoiceChannel(voiceChannelCancel);
    //     });

    //     await test.step('Verify voice channel was NOT created', async () => {
    //         const exists = await channelPage.isVoiceChannelCreated(voiceChannelCancel);
    //         expect(exists).toBe(false);
    //     });
    // });

    // test('should appear the error message when input exist name in voice channel', async ({ page }) => {
    //     const channelPage = new ChannelPage(page);

    //     await test.step(`Attempt to create voice channel named "${voiceChannelExist}" and cancel`, async () => {
    //         await channelPage.createVoiceChannel(voiceChannelExist);
    //     });

    //     await test.step(`Attempt to create voice channel exist named "${voiceChannelExist}" and cancel`, async () => {
    //         await channelPage.createVoiceChannel(voiceChannelExist);
    //     });

    //     await test.step('Verify error message is appeared', async () => {
    //         const exists = await channelPage.isErrMsgWhenExistsName();
    //         expect(exists).toBe(true);
    //     });
    // });

    // test('should close the create channel popup when click button "x"', async ({ page }) => {
    //     const channelPage = new ChannelPage(page);

    //     await test.step(`Close the create channel popup`, async () => {
    //         await channelPage.closeCreateChannel();
    //     });

    //     await test.step('Verify the create channel popup is closed', async () => {
    //         const exists = await channelPage.isCloseCreateChannel();
    //         expect(exists).toBe(false);
    //     });
    // });
});
