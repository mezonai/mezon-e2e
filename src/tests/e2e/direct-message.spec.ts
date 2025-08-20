import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { MessgaePage } from '@/pages/MessagePage';

test.describe('Onboarding Guide Task Completion', () => {
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

    test('Create group chat ', async ({ page }) => {
        const messagePage = new MessgaePage(page);

        const prevGroupCount = await messagePage.countGroups();

        await messagePage.createGroup();

        await page.waitForTimeout(3000);

        const groupCreated = await messagePage.isGroupCreated(prevGroupCount);

        expect(groupCreated).toBeTruthy();
    });

    test('Add more member to group chat', async ({ page }) => {
        const messagePage = new MessgaePage(page);

        const getMemberCount = await messagePage.getMemberCount();

        await messagePage.addMoreMemberToGroup();

        await page.waitForTimeout(20000);

        const memberAdded = await messagePage.isMemberAdded(getMemberCount);

        expect(memberAdded).toBeTruthy();
    });
});

