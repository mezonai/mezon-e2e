import { Page, Locator, expect } from '@playwright/test';
import { MessageTestHelpers } from '@/utils/messageHelpers';

export class MessgaePage {
    readonly page: Page;
    readonly user: Locator;
    readonly addUserButton: Locator;
    readonly userItem: Locator;
    readonly createGroupButton: Locator;
    readonly secondUserName: Locator;
    readonly group: Locator;
    readonly addToGroupButton: Locator;
    readonly sumMember: Locator;
    readonly memberCount: Locator;
    readonly firstDM: Locator;
    readonly firsrDMUserName: Locator;
    readonly closeFirstDMButton: Locator;
    readonly firstUserAddDM: Locator;
    readonly firstUserNameAddDM: Locator;
    readonly UserNameInDM: Locator;
    readonly secondClan: Locator;
    readonly messages: Locator;
    readonly leaveGroupButton: Locator;
    readonly memberList: Locator;
    readonly confirmLeaveGroupButton: Locator;
    readonly textarea: Locator;
    readonly messagesInTopic: Locator;
    readonly textAreaInTopic: Locator;
    readonly groupName: Locator;

    firstUserNameText: string = "";
    message: string = "";
    messageCreateTopic: string = "";
    messageInTopic: string = "";
    groupNameText: string = "";

    constructor(page: Page) {
        this.page = page;
        this.user = this.page.locator('.dm-wrap').filter({ hasNot: this.page.locator('p', { hasText: 'Members' }) }).first();
        this.addUserButton = page.locator('span[title="Add friends to DM"]');
        this.userItem = page.locator('div.bg-item-theme.flex.items-center.h-10.px-2.ml-3.mr-2.rounded-lg.cursor-pointer').first();
        this.createGroupButton = page.locator('button:has-text("Create Group Chat")');
        this.secondUserName = this.userItem.locator('span.text-base.font-medium.text-theme-primary-active.one-line');
        this.group = this.page.locator('.dm-wrap .flex.bg-item-hover').filter({has: this.page.locator('p', { hasText: 'Members' })}).first();
        this.addToGroupButton = page.locator('button:has-text("Add to Group Chat")');
        this.sumMember = page.locator('button[title="Show Member List"]:not(.sbm\\:hidden)');
        this.memberCount = page.locator('div.p-2.bg-item-hover');
        this.firstDM = this.page.locator('.dm-wrap').filter({ hasNot: this.page.locator('p', { hasText: 'Members' }) }).first();
        this.firsrDMUserName = this.firstDM.locator('span.one-line');
        this.closeFirstDMButton = this.firstDM.locator('button.absolute.right-2.text-gray-500.text-2xl.hover\\:text-red-500');
        this.firstUserAddDM = this.page.locator('.group\\/list_friends').first();
        this.firstUserNameAddDM = this.firstUserAddDM.locator('.one-line').first();
        this.UserNameInDM = page.locator('div.overflow-hidden.whitespace-nowrap.text-ellipsis.none-draggable-area.pointer-events-none.cursor-default.font-medium.bg-transparent.outline-none.leading-10.text-theme-primary');
        this.secondClan = this.page.locator('div[title]').nth(1);
        this.messages = this.page.locator('div.message-list-item');
        this.leaveGroupButton = this.group.locator('button.absolute.right-2.text-gray-500.text-2xl.hover\\:text-red-500');
        this.memberList = this.page.locator('.dm-wrap');
        this.confirmLeaveGroupButton = this.page.locator('div.bottom-block div', { hasText: 'Leave Group' });
        this.textarea = this.page.locator('#editorReactMentionChannel');
        this.messagesInTopic = page.locator('.thread-scroll .text-theme-message');
        this.textAreaInTopic = page.locator('#editorReactMention');
        this.groupName = page.locator('div.text-theme-primary.cursor-text');
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

    async createDM() {
        await this.firstUserAddDM.click();
        const fullText = (await this.firstUserNameAddDM.textContent())?.trim() ?? '';
        this.firstUserNameText = fullText.split(' ')[0];
    }

    async isDMCreated(prevUsersCount: number): Promise<boolean> {
        await this.page.waitForTimeout(2000);

        const currentUsersCount = await this.countUsers();
        if (currentUsersCount !== prevUsersCount + 1) {
            return false;
        }

        const firstUserNameInDMText = (await this.UserNameInDM.textContent())?.trim() ?? '';
        if (firstUserNameInDMText !== this.firstUserNameText) {
            return false;
        }

        return true;
    }

    async createGroup() {
        await this.user.click();
        this.firstUserNameText = (await this.UserNameInDM.textContent())?.trim() ?? '';
        await this.addUserButton.click();
        await this.userItem.waitFor({ state: 'visible', timeout: 50000 });
        await this.userItem.click();
        await this.createGroupButton.click();
    }

    async isGroupCreated(prevGroupCount: number): Promise<boolean> {
        await this.page.waitForTimeout(2000);

        const currentGroupCount = await this.countGroups();
        if (currentGroupCount !== prevGroupCount + 1) {
            return false;
        }

        const groupNames = await this.groupName.allTextContents();
        const newGroupName = groupNames[groupNames.length - 1].trim();
        if (!newGroupName.startsWith(this.firstUserNameText)) {
            return false;
        }

        return true;
    }

    async addMoreMemberToGroup() {
        await this.group.click();
        await this.addUserButton.click();
        await this.userItem.waitFor({ state: 'visible', timeout: 5000 });
        await this.userItem.click();
        await this.addToGroupButton.click();
        await this.page.waitForTimeout(1000);
    }

    async getMemberCount(): Promise<number> {
        await this.group.click();
        await this.sumMember.click();

        const memberItems = this.memberCount;
        const count = await memberItems.count();
        
        return count;
    }

    async isMemberAdded(previousCount: number): Promise<boolean> {
        const memberItems = this.memberCount;
        const newCount = await memberItems.count();
        return newCount === previousCount + 1;
    }

    async closeDM(): Promise<void> {
        await this.firstDM.hover();
        await this.closeFirstDMButton.click({ force: true });
    }

    async isDMClosed(prevUserCount: number): Promise<boolean> {
        await this.page.waitForTimeout(2000);

        const currentUserCount = await this.countUsers();

        return currentUserCount === prevUserCount - 1;
    }

    async createTopic(message: string): Promise<void> {
        const helpers = new MessageTestHelpers(this.page);

        await this.secondClan.click();

        const lastMessage = this.messages.last();
        await lastMessage.click({ button: 'right' });

        await this.page.waitForTimeout(10000);

        const topicButton = await helpers.findTopicDiscussionOption();
        topicButton.click();

        await this.textAreaInTopic.fill(message);
        await this.textAreaInTopic.press('Enter');
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

    async isTopicCreated(): Promise<boolean> {
        await this.page.waitForTimeout(3000);

        return (
            await this.containsMessage(this.messageCreateTopic) ||
            await this.containsMessage(this.messageInTopic)
        );
    }

    async leaveGroup(): Promise<void> {
        await this.group.hover();
        await this.leaveGroupButton.click({ force: true });
        await this.confirmLeaveGroupButton.click();
    }

    async isLeavedGroup(prevGroupCount: number): Promise<boolean> {
        await this.page.waitForTimeout(2000);

        const currentGroupCount = await this.countGroups();

        return currentGroupCount === prevGroupCount - 1;
    }

    async selectConversation(): Promise<void> {
        await this.firstDM.click();
    }

    async isConversationSelected(): Promise<boolean> {
        const firstDMName = await this.firsrDMUserName.innerText();
        const firstUserNameInDMText = (await this.UserNameInDM.textContent())?.trim() ?? '';

        return firstUserNameInDMText === firstDMName;
    }

    async sendMessage(message: string): Promise<void> {
        this.message = message;
        await this.firstDM.click();
        await this.textarea.click();
        await this.textarea.fill(message);
        await this.textarea.press('Enter');
    }

    async isMessageSend(): Promise<boolean> {
        const lastMessage = this.messages.last();
        const text = await lastMessage.innerText();

        return text.trim() === this.message;
    }

    async updateNameGroupChatDM(groupName: string): Promise<void> {
        this.groupNameText = groupName;

        await this.group.click();
        await this.groupName.dblclick(); 
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Delete');
        await this.page.keyboard.type(groupName);
        await this.page.keyboard.press('Enter');
    }

    async isGroupNameDMUpdated(): Promise<boolean> {
        const groupName = (await this.groupName.innerText()).trim();
        return groupName === this.groupNameText;
    }
}