import { test, expect } from '@playwright/test';
import { TextChannelPage } from '../../pages/TextChannelPage';
import { HomePage } from '../../pages/HomePage';

test.describe('Create Text Channels', () => {
    test.beforeEach(async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();

        const currentUrl = page.url();
        if (currentUrl.includes('dev-mezon.nccsoft.vn') && !currentUrl.includes('/chat')) {
            console.log('On landing page, clicking "Open Mezon" button...');

            const openMezonSelectors = [
                'button:has-text("Open Mezon")',
                'a:has-text("Open Mezon")',
                '[data-testid="open-mezon"]',
                '.open-mezon-btn',
                'button[class*="open"]',
                'a[href*="/chat"]'
            ];

            let buttonFound = false;
            for (const selector of openMezonSelectors) {
                try {
                    const button = page.locator(selector).first();
                    if (await button.isVisible({ timeout: 3000 })) {
                        console.log(`Found "Open Mezon" button using: ${selector}`);
                        await button.click();
                        buttonFound = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!buttonFound) {
                console.log('Button not found, trying direct navigation...');
                await page.goto('/chat');
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);

            console.log(`After navigation: ${page.url()}`);
        }

        const finalUrl = page.url();
        expect(finalUrl).not.toMatch(/login|signin|authentication/);
    });

    const textChannelPrivate = 'text-channel-private7';
    const textChannelPublic = 'text-channel-public';
    const textChannelCancel = 'text-channel-cancel';

    // test('should create private voice channel', async ({ page }) => {
    //     const voiceChannelPage = new TextChannelPage(page);

    //     await page.goto('https://dev-mezon.nccsoft.vn/chat/clans/1840654642682269696/channels/1840654642703241216');

    //     await test.step(`Create private voice channel named "${textChannelPrivate}"`, async () => {
    //         const created = await voiceChannelPage.createVoiceChannel(textChannelPrivate, 'private');
    //         expect(created).toBeTruthy();
    //         console.log(`Created private voice channel: ${textChannelPrivate}`);
    //     });

    //     await test.step('Verify private voice channel exists', async () => {
    //         const exists = await voiceChannelPage.isChannelCreated(textChannelPrivate);
    //         expect(exists).toBe(true);
    //     });
    // });


    // test('should create public voice channel', async ({ page }) => {
    //     const voiceChannelPage = new TextChannelPage(page);

    //     await page.goto('https://dev-mezon.nccsoft.vn/chat/clans/1840654642682269696/channels/1840654642703241216');

    //     await test.step(`Create public voice channel named "${textChannelPublic}"`, async () => {
    //         const created = await voiceChannelPage.createVoiceChannel(textChannelPublic, 'public');
    //         expect(created).toBeTruthy();
    //         console.log(`Created public voice channel: ${textChannelPublic}`);
    //     });

    //     await test.step('Verify public voice channel exists', async () => {
    //         const exists = await voiceChannelPage.isChannelCreated(textChannelPublic);
    //         expect(exists).toBe(true);
    //     });
    // });

    test('should cancel creation of voice channel with name containing special characters', async ({ page }) => {
        const voiceChannelPage = new TextChannelPage(page);

        await page.goto('https://dev-mezon.nccsoft.vn/chat/clans/1840654642682269696/channels/1840654642703241216');

        await test.step(`Attempt to create voice channel named "${textChannelCancel}" and cancel`, async () => {
            const cancelled = await voiceChannelPage.cancelCreateVoiceChannel(textChannelCancel);
            expect(cancelled).toBe(true);
            console.log(`Cancelled creation of voice channel: ${textChannelCancel}`);
        });

        await test.step('Verify voice channel was NOT created', async () => {
            const exists = await voiceChannelPage.isChannelCreated(textChannelCancel);
            expect(exists).toBe(false);
        });
    });
});
