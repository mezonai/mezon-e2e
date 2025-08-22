import { Page, Locator } from '@playwright/test';

export class DirectMessageHelper {
    readonly textarea: Locator;
    readonly textAreaInTopic: Locator;
    readonly messagesInTopic: Locator;
    readonly memberList: Locator;
    readonly groupList: Locator;
    readonly groupName: Locator;
    readonly group: Locator;

    constructor(private page: Page) {
        this.textarea = page.locator('#editorReactMentionChannel');
        this.textAreaInTopic = page.locator('#editorReactMention');
        this.messagesInTopic = page.locator('.thread-scroll .text-theme-message');
        this.memberList = page.locator('.dm-wrap');
        this.groupList = page.locator('.dm-wrap').filter({ has: page.locator('p:has-text("Members")')}).locator('span.one-line');
        this.group = this.page.locator('.dm-wrap .flex.bg-item-hover').filter({has: this.page.locator('p', { hasText: 'Members' })}).first();
        this.groupName = page.locator('div[title="Click to edit group"]');
    }

    async countGroups(): Promise<number> {
        let groupCount = 0;
        const count = await this.memberList.count();

        for (let i = 0; i < count; i++) {
            const dm = this.memberList.nth(i);
            const pCount = await dm.locator('p').count();
            if (pCount > 0) {
                const text = await dm.locator('p').first().textContent();
                if (text?.includes('Members')) {
                    groupCount++;
                }
            }
        }
        return groupCount;
    }

    async countUsers(): Promise<number> {
        let userCount = 0;
        const count = await this.memberList.count();

        for (let i = 0; i < count; i++) {
            const dm = this.memberList.nth(i);
            const pCount = await dm.locator('p').count();

            if (pCount === 0) {
                userCount++;
            } else {
                const text = await dm.locator('p').first().textContent();
                if (!text?.includes('Members')) {
                    userCount++;
                }
            }
        }
        return userCount;
    }

    async getAllMessageTexts(): Promise<string[]> {
        const allMessages = this.messagesInTopic;
        const count = await allMessages.count();
        const texts: string[] = [];

        for (let i = 0; i < count; i++) {
            const message = allMessages.nth(i);
            const text = (await message.innerText()).trim();
            texts.push(text);
        }
        return texts;
    }

    async containsMessage(expected: string): Promise<boolean> {
        const texts = await this.getAllMessageTexts();
        return texts.some(text => text.includes(expected));
    }
}
