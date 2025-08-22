import { Page, Locator, expect } from '@playwright/test';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { DirectMessageHelper } from '@/utils/directMessageHelper';

export class MessgaePage {
    private helpers: DirectMessageHelper;
    readonly page: Page;
    readonly user: Locator;
    readonly addUserButton: Locator;
    readonly userItem: Locator;
    readonly createGroupButton: Locator;
    readonly userNameItem: Locator;
    readonly addToGroupButton: Locator;
    readonly sumMember: Locator;
    readonly memberCount: Locator;
    readonly firstDM: Locator;
    readonly firsrDMUserName: Locator;
    readonly closeFirstDMButton: Locator;
    readonly firstUserAddDM: Locator;
    readonly firstUserNameAddDM: Locator;
    readonly userNameInDM: Locator;
    readonly secondClan: Locator;
    readonly messages: Locator;
    readonly leaveGroupButton: Locator;
    readonly confirmLeaveGroupButton: Locator;
    readonly messagesInTopic: Locator;
    readonly memberListInGroup: Locator;
    readonly editGroupButton: Locator;
    readonly groupNameInput: Locator;
    readonly saveGroupNameButton: Locator;
    readonly leaveGroupButtonInPopup: Locator;

    firstUserNameText: string = "";
    message: string = "";
    messageCreateTopic: string = "";
    messageInTopic: string = "";
    groupNameText: string = "";
    userNameItemText: string = "";

    constructor(page: Page) {
        this.page = page;
        this.helpers = new DirectMessageHelper(page);
        this.user = this.page.locator('.dm-wrap').filter({ hasNot: this.page.locator('p', { hasText: 'Members' }) }).first();
        this.addUserButton = page.locator('span[title="Add friends to DM"]');
        // this.userItem = page.locator('div.bg-item-theme.flex.items-center.h-10.px-2.ml-3.mr-2.rounded-lg.cursor-pointer').first();
        this.userItem = page.locator('div.bg-item-theme.flex.items-center.h-10.px-2.ml-3.mr-2.rounded-lg.cursor-pointer').first();
        this.createGroupButton = page.locator('button:has-text("Create Group Chat")');
        this.userNameItem = this.userItem.locator('span.text-base.font-medium.text-theme-primary-active.one-line');
        this.addToGroupButton = page.locator('button:has-text("Add to Group Chat")');
        this.sumMember = page.locator('button[title="Show Member List"]:not(.sbm\\:hidden)');
        this.memberCount = page.locator('div.p-2.bg-item-hover');
        this.firstDM = this.page.locator('.dm-wrap').filter({ hasNot: this.page.locator('p', { hasText: 'Members' }) }).first();
        this.firsrDMUserName = this.firstDM.locator('span.one-line');
        this.closeFirstDMButton = this.firstDM.locator('button.absolute.right-2.text-gray-500.text-2xl.hover\\:text-red-500');
        this.firstUserAddDM = this.page.locator('.group\\/list_friends').first();
        this.firstUserNameAddDM = this.firstUserAddDM.locator('.one-line').first();
        this.userNameInDM = page.locator('div.overflow-hidden.whitespace-nowrap.text-ellipsis.none-draggable-area.pointer-events-none.cursor-default.font-medium.bg-transparent.outline-none.leading-10.text-theme-primary');
        this.secondClan = this.page.locator('div[title]').nth(1);
        this.messages = this.page.locator('div.message-list-item');
        this.leaveGroupButton = this.helpers.group.locator('button.absolute.right-2.text-gray-500.text-2xl.hover\\:text-red-500');
        this.confirmLeaveGroupButton = this.page.locator('div.bottom-block div', { hasText: 'Leave Group' });
        this.messagesInTopic = page.locator('.thread-scroll .text-theme-message');
        this.memberListInGroup = page.locator('span.one-line.text-start');
        this.editGroupButton = page.locator('button[title="Edit Group"]');
        this.groupNameInput = page.locator('input[placeholder="Enter group name"]');
        this.saveGroupNameButton = page.locator('button:has-text("Save")');
        this.leaveGroupButtonInPopup = page.locator('button:has-text("Leave Group")');

    }

    async createDM(): Promise<void> {
        await this.firstUserAddDM.click();
        const fullText = (await this.firstUserNameAddDM.textContent())?.trim() ?? '';
        this.firstUserNameText = fullText.split(' ')[0];
    }

    async isDMCreated(prevUsersCount: number): Promise<boolean> {

        await this.page.waitForTimeout(2000);

        const currentUsersCount = await this.helpers.countUsers();
        if (currentUsersCount !== prevUsersCount + 1) {
            return false;
        }

        const firstUserNameInDMText = (await this.userNameInDM.textContent())?.trim() ?? '';
        if (firstUserNameInDMText !== this.firstUserNameText) {
            return false;
        }

        return true;
    }

    async createGroup(): Promise<void> {
        await this.user.click();
        this.firstUserNameText = (await this.userNameInDM.textContent())?.trim() ?? '';
        await this.addUserButton.click();
        await this.userItem.waitFor({ state: 'visible', timeout: 50000 });
        await this.userItem.click();
        await this.createGroupButton.click();
    }

    async isGroupCreated(prevGroupCount: number): Promise<boolean> {
        await this.page.waitForTimeout(2000);

        const currentGroupCount = await this.helpers.countGroups();
        if (currentGroupCount !== prevGroupCount + 1) {
            return false;
        }

        const groupNames = await this.helpers.groupList.allTextContents();
        const newGroupName = groupNames[groupNames.length - 1].trim();
        if (!newGroupName.startsWith(this.firstUserNameText)) {
            return false;
        }

        return true;
    }

    async addMoreMemberToGroup(): Promise<void> {
        await this.helpers.group.click();
        await this.addUserButton.click();
        await this.page.waitForTimeout(5000);
        await this.userItem.click();
        this.userNameItemText = (await this.userNameItem.textContent()) ?? "";
        await this.addToGroupButton.click();
        await this.page.waitForTimeout(1000);
    }

    async getMemberCount(): Promise<number> {
        await this.helpers.group.click();
        await this.sumMember.click();

        const memberItems = this.memberCount;
        const count = await memberItems.count();

        return count;
    }

    async isMemberAdded(previousCount: number): Promise<boolean> {
        const memberItems = this.memberCount;
        const newCount = await memberItems.count();
        if (newCount !== previousCount + 1) {
            return false;
        }

        const userNamesRaw: string[] = await this.memberListInGroup.allTextContents();
        const userNames: string[] = userNamesRaw.flatMap(text => text.split(',')).map(name => name.trim()).filter(name => name.length > 0);

        if (!userNames.includes(this.userNameItemText)) {
            return false;
        }

        return true;
    }

    async closeDM(): Promise<void> {
        await this.firstDM.hover();
        await this.closeFirstDMButton.click({ force: true });
    }

    async isDMClosed(prevUserCount: number): Promise<boolean> {
        await this.page.waitForTimeout(2000);

        const currentUserCount = await this.helpers.countUsers();

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

        await this.helpers.textAreaInTopic.fill(message);
        await this.helpers.textAreaInTopic.press('Enter');
    }

    async isTopicCreated(): Promise<boolean> {
        await this.page.waitForTimeout(3000);

        return (
            await this.helpers.containsMessage(this.messageCreateTopic) ||
            await this.helpers.containsMessage(this.messageInTopic)
        );
    }

    // async leaveGroupByXBtn(): Promise<void> {
    //     await this.helpers.group.hover();
    //     await this.leaveGroupButton.click({ force: true });
    //     await this.confirmLeaveGroupButton.click();
    // }

    async leaveGroupByLeaveGroupBtn(): Promise<void> {
        await this.helpers.group.hover();
        await this.helpers.group.click({ button: 'right' });
        //await this.leaveGroupButtonInPopup.click({ force: true });
    }

    async isLeavedGroup(prevGroupCount: number): Promise<boolean> {
        await this.page.waitForTimeout(2000);

        const currentGroupCount = await this.helpers.countGroups();

        return currentGroupCount === prevGroupCount - 1;
    }

    async selectConversation(): Promise<void> {
        await this.firstDM.click();
    }

    async isConversationSelected(): Promise<boolean> {
        const firstDMName = await this.firsrDMUserName.innerText();
        const firstUserNameInDMText = (await this.userNameInDM.textContent())?.trim() ?? '';

        return firstUserNameInDMText === firstDMName;
    }

    async sendMessage(message: string): Promise<void> {
        this.message = message;
        await this.firstDM.click();
        await this.helpers.textarea.click();
        await this.helpers.textarea.fill(message);
        await this.helpers.textarea.press('Enter');
    }

    async isMessageSend(): Promise<boolean> {
        const lastMessage = this.messages.last();
        const text = await lastMessage.innerText();

        return text.trim() === this.message;
    }

    async updateNameGroupChatDM(groupName: string): Promise<void> {
        this.groupNameText = groupName;

        await this.helpers.group.click();
        await this.editGroupButton.click();
        await this.groupNameInput.click();
        await this.groupNameInput.fill('');
        await this.groupNameInput.fill(groupName);
        await this.saveGroupNameButton.click();
    }

    async isGroupNameDMUpdated(): Promise<boolean> {
        const groupName = (await this.helpers.groupName.innerText()).trim();
        return groupName === this.groupNameText;
    }
}