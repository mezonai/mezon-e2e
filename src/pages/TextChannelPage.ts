import { Page, Locator, expect } from '@playwright/test';

export class TextChannelPage {
    readonly page: Page;
    readonly createButton: Locator;
    readonly channelNameInput: Locator;
    readonly textRadio: Locator;
    readonly privateToggle: Locator;
    readonly confirmButton: Locator;
    readonly cancelButton: Locator;
    readonly channelsList: Locator;

    constructor(page: Page) {
        this.page = page;
        this.createButton = page.locator('#channelList button.focus-visible\\:outline-none.text-theme-primary.text-theme-primary-hover');
        this.channelNameInput = page.locator('input.Input.grow.shrink.basis-0');
        this.textRadio = page.locator('input[name="drone"][value="1"]');
        this.privateToggle = page.locator('input[type="checkbox"].peer');
        this.confirmButton = page.locator('button.btn-primary:has-text("Create Channel")');
        this.cancelButton = page.locator('button:has-text("Cancel")');
        this.channelsList = page.locator('div[role="button"].relative.group.z-10');
    }

    async createVoiceChannel(name: string, type: 'private' | 'public'): Promise<boolean> {
        await this.createButton.click();

        await this.channelNameInput.waitFor({ state: 'visible', timeout: 5000 });
        await this.channelNameInput.fill(name);

        if (type === 'private') {
            await this.privateToggle.click();
            await this.page.waitForTimeout(500);
        }

        await this.textRadio.click();
        await this.page.waitForTimeout(500);

        await this.confirmButton.click();

        return await this.isChannelCreated(name);
    }

    async isChannelCreated(channelName: string): Promise<boolean> {
        const welcomeLocator = this.page.locator(
            'p.text-xl.md\\:text-3xl.font-bold.pt-1.text-theme-primary-active',
            { hasText: `Welcome to #${channelName}` }
        );
        try {
            await welcomeLocator.waitFor({ state: 'visible', timeout: 15000 });
            return true;
        } catch {
            return false;
        }
    }

    async cancelCreateVoiceChannel(name: string): Promise<boolean> {
        await this.createButton.click();

        await this.channelNameInput.waitFor({ state: 'visible', timeout: 3000 });
        await this.channelNameInput.fill(name);

        await this.textRadio.click();
        await this.cancelButton.click();
        await this.page.waitForTimeout(1000);

        return !(await this.isChannelCreated(name));
    }
}
