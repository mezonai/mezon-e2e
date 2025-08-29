import { Page, Locator, expect } from '@playwright/test';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { DirectMessageHelper } from '@/utils/directMessageHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';

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

  firstUserNameText: string = '';
  message: string = '';
  messageCreateTopic: string = '';
  messageInTopic: string = '';
  groupNameText: string = '';
  userNameItemText: string = '';

  constructor(page: Page) {
    this.page = page;
    this.helpers = new DirectMessageHelper(page);
    this.user = this.page
      .locator(generateE2eSelector('chat.direct_message.chat_list'))
      .filter({ hasNot: this.page.locator('p', { hasText: 'Members' }) })
      .first();
    this.addUserButton = page.locator(
      generateE2eSelector('chat.direct_message.create_group.button')
    );
    this.userItem = page
      .locator(generateE2eSelector('chat.direct_message.friend_list.friend_item'))
      .first();
    this.createGroupButton = page.locator(
      generateE2eSelector('chat.direct_message.create_group.button')
    );
    this.userNameItem = this.userItem.locator(
      generateE2eSelector('chat.direct_message.friend_list.username_friend_item')
    );
    this.addToGroupButton = page.locator(
      generateE2eSelector('chat.direct_message.create_group.button')
    );
    this.sumMember = page.locator(generateE2eSelector('chat.direct_message.member_list.button'));
    this.memberCount = page.locator(
      generateE2eSelector('chat.direct_message.member_list.member_count')
    );
    this.firsrDMUserName = this.user.locator(
      generateE2eSelector('chat.direct_message.chat_item.username')
    );
    this.closeFirstDMButton = this.user.locator(
      generateE2eSelector('chat.direct_message.chat_item.close_dm_button')
    );
    this.firstUserAddDM = this.page
      .locator(generateE2eSelector('chat.direct_message.friend_list.all_friend'))
      .nth(1);
    this.firstUserNameAddDM = this.page
      .locator(generateE2eSelector('common.friend_list.username'))
      .nth(1);
    this.userNameInDM = page.locator(generateE2eSelector('chat.direct_message.chat_item.username'));
    this.secondClan = this.page.locator('div[title]').nth(1);
    this.messages = this.page.locator(generateE2eSelector('chat.direct_message.message.item'));
    this.leaveGroupButton = this.helpers.group.locator(
      generateE2eSelector('chat.direct_message.chat_item.close_dm_button')
    );
    this.confirmLeaveGroupButton = this.page.locator(
      generateE2eSelector('chat.direct_message.leave_group.button')
    );
    this.messagesInTopic = page.locator('.thread-scroll .text-theme-message');
    this.memberListInGroup = page.locator(
      generateE2eSelector('chat.direct_message.member_list.member_count')
    );
    this.editGroupButton = page.locator('button[title="Edit Group"]');
    this.groupNameInput = page.locator('input[placeholder="Enter group name"]');
    this.saveGroupNameButton = page.locator('button:has-text("Save")');
    this.leaveGroupButtonInPopup = page.locator(
      generateE2eSelector('chat.direct_message.menu.leave_group.button')
    );
  }

  async createDM(): Promise<void> {
    await this.firstUserAddDM.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(3000);
    await this.firstUserAddDM.click();

    this.firstUserNameText =
      (await this.firstUserNameAddDM.textContent())?.trim().split(/\s+/)[0] ?? '';
  }

  async isDMCreated(prevUsersCount: number): Promise<boolean> {
    await this.page.waitForTimeout(3000);

    const currentUsersCount = await this.helpers.countUsers();
    if (currentUsersCount !== prevUsersCount + 1) {
      return false;
    }

    const allUserNamesInDM = await this.userNameInDM.allInnerTexts();
    if (!allUserNamesInDM.includes(this.firstUserNameText)) {
      return false;
    }

    return true;
  }

  async selectConversation(): Promise<void> {
    await this.user.first().waitFor({ state: 'visible' });
    await this.user.click();
  }

  async isConversationSelected(): Promise<boolean> {
    const firstDMName = await this.firsrDMUserName.innerText();
    const firstUserNameInDMText = (await this.userNameInDM.first().innerText()).trim();

    return firstUserNameInDMText === firstDMName;
  }

  async createGroup(): Promise<void> {
    await this.user.click();
    this.firstUserNameText = (await this.userNameInDM.first().textContent())?.trim() ?? '';
    await this.addUserButton.click();
    await this.userItem.waitFor({ state: 'visible', timeout: 50000 });
    await this.userItem.click();
    await this.createGroupButton.first().click();
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
    this.userNameItemText = (await this.userNameItem.textContent()) ?? '';
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
    const userNames: string[] = userNamesRaw
      .flatMap(text => text.split(','))
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (!userNames.includes(this.userNameItemText)) {
      return false;
    }

    return true;
  }

  async closeDM(): Promise<void> {
    await this.user.hover();
    await this.closeFirstDMButton.click({ force: true });
  }

  async isDMClosed(prevUserCount: number): Promise<boolean> {
    await this.page.waitForTimeout(2000);

    const currentUserCount = await this.helpers.countUsers();

    return currentUserCount === prevUserCount - 1;
  }

  async leaveGroupByXBtn(): Promise<void> {
    await this.helpers.group.hover();
    await this.leaveGroupButton.click({ force: true });
    await this.confirmLeaveGroupButton.click();
  }

  async leaveGroupByLeaveGroupBtn(): Promise<void> {
    // await this.helpers.group.hover();
    // await this.helpers.group.click({ button: 'right' });
    // await this.helpers.group.dispatchEvent('contextmenu');

    // bắn sự kiện chuột phải lên group
    await this.helpers.group.dispatchEvent('contextmenu');

    // chờ menu "Leave Group" hiện ra
    // const leaveGroupBtn = this.page.locator('text=Leave Group');
    // await leaveGroupBtn.waitFor({ state: 'visible' });

    // click vào "Leave Group"
    //await leaveGroupBtn.click();
  }

  async isLeavedGroup(prevGroupCount: number): Promise<boolean> {
    await this.page.waitForTimeout(2000);

    const currentGroupCount = await this.helpers.countGroups();

    return currentGroupCount === prevGroupCount - 1;
  }

  async sendMessage(message: string): Promise<void> {
    this.message = message;
    await this.user.click();
    await this.helpers.textarea.click();
    await this.helpers.textarea.fill(message);
    await this.helpers.textarea.press('Enter');
  }

  async isMessageSend(): Promise<boolean> {
    const lastMessage = this.messages.last();
    const text = await lastMessage.innerText();

    return text.includes(this.message);
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
