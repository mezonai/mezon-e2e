import { Page, Locator, expect } from '@playwright/test';

export class ChannelPage {
    readonly page: Page;
    readonly createButton: Locator;
    readonly channelNameInput: Locator;
    readonly textRadio: Locator;
    readonly voiceRadio: Locator;
    readonly privateToggle: Locator;
    readonly confirmButton: Locator;
    readonly cancelButton: Locator;
    readonly channelsList: Locator;
    readonly secondClan: Locator;
    readonly channelNameList: Locator;
    readonly errorMsg: Locator;
    readonly closeButton: Locator;
    readonly titleCreateChannel: Locator;

    constructor(page: Page) {
        this.page = page;
        this.createButton = page.locator('#channelList button.focus-visible\\:outline-none.text-theme-primary.text-theme-primary-hover');
        this.channelNameInput = page.locator('input.Input.grow.shrink.basis-0');
        this.textRadio = page.locator('input[name="drone"][value="1"]');
        this.voiceRadio = page.locator('input[type="radio"][name="drone"][value="10"]');
        this.privateToggle = page.locator('input[type="checkbox"].peer');
        this.confirmButton = page.locator('button.btn-primary:has-text("Create Channel")');
        this.cancelButton = page.locator('button:has-text("Cancel")');
        this.channelsList = page.locator('div[role="button"].relative.group.z-10');
        this.secondClan = this.page.locator('div[title]').nth(1);
        this.channelNameList = page.locator('p.ml-2.w-full.pointer-events-none.text-base.focus\\:bg-bgModifierHover');
        this.errorMsg = page.locator('p.text-\\[\\#e44141\\].text-xs.italic.font-thin');
        this.closeButton = this.page.locator('div.absolute.right-1 button').last();
        this.titleCreateChannel = page.locator('div.self-stretch.text-sm.font-bold.leading-normal');
    }

    async createTextChannel(name: string, type: 'private' | 'public') {
        await this.secondClan.click();
        await this.createButton.click();

        await this.channelNameInput.waitFor({ state: 'visible', timeout: 3000 });
        await this.channelNameInput.fill(name);

        if (type === 'private') {
            await this.privateToggle.click();
            await this.page.waitForTimeout(1000);
        }

        await this.textRadio.click();
        await this.page.waitForTimeout(500);

        await this.confirmButton.click();
    }

    async isTextChannelCreated(channelName: string): Promise<boolean> {
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

    async cancelCreateTextChannel(name: string) {
        await this.secondClan.click();
        await this.createButton.click();

        await this.channelNameInput.waitFor({ state: 'visible', timeout: 3000 });
        await this.channelNameInput.fill(name);

        await this.textRadio.click();
        await this.cancelButton.click();
        await this.page.waitForTimeout(1000);
    }

    async createVoiceChannel(name: string) {
        await this.secondClan.click();
        await this.createButton.click();

        await this.channelNameInput.waitFor({ state: 'visible', timeout: 3000 });
        await this.channelNameInput.fill(name);

        await this.voiceRadio.click();

        await this.page.waitForTimeout(3000);
        await this.confirmButton.click();
    }

    async isVoiceChannelCreated(name: string): Promise<boolean> {
        const locators = this.channelNameList;
        await this.page.waitForTimeout(3000);

        const count = await locators.count();
        const titles: string[] = [];

        for (let i = 0; i < count; i++) {
            const titleAttr = await locators.nth(i).getAttribute("title");
            titles.push(titleAttr || "");
        }

        return titles.some(t => t.includes(name));
    }

    async cancelCreateVoiceChannel(name: string) {
        await this.secondClan.click();
        await this.createButton.click();

        await this.channelNameInput.waitFor({ state: 'visible', timeout: 300 });
        await this.channelNameInput.fill(name);

        await this.voiceRadio.click();
        await this.cancelButton.click();
        await this.page.waitForTimeout(300);
    }

    async isErrMsgWhenExistsName(): Promise<boolean> {
        try {
            await this.errorMsg.waitFor({ state: 'visible', timeout: 10000 });
            const text = await this.errorMsg.textContent();
            return text?.trim() === "The channel  name already exists in the category . Please enter another name.";
        } catch {
            return false;
        }
    }

    async closeCreateChannel() {
        await this.secondClan.click();
        await this.createButton.click();
        await this.closeButton.click();
        await this.page.waitForTimeout(1000);
    }

    async isCloseCreateChannel(): Promise<boolean> {
        try {
            await this.titleCreateChannel.waitFor({ state: 'visible', timeout: 1000 });
            const text = await this.titleCreateChannel.textContent();
            return text?.trim() === "CREATE A NEW CHANNEL IN";
        } catch {
            return false;
        }
    }
}
