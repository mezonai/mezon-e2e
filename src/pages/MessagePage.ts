import { DirectMessageHelper } from '@/utils/directMessageHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, Locator, Page } from '@playwright/test';

export class MessgaePage {
  private helpers: DirectMessageHelper;
  readonly page: Page;
  readonly user: Locator;
  readonly addUserButton: Locator;
  readonly usernameFriendItem: Locator;
  readonly userItem: Locator;
  readonly friendItems: Locator;
  readonly friendUsernames: Locator;
  readonly createGroupButton: Locator;
  readonly userNameItem: Locator;
  readonly addToGroupButton: Locator;
  readonly sumMember: Locator;
  readonly memberCount: Locator;
  readonly firsrDMUserName: Locator;
  readonly closeFirstDMButton: Locator;
  readonly firstUserAddDM: Locator;
  readonly firstUserNameAddDM: Locator;
  readonly userNamesInDM: Locator;
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
  readonly buttonCreateGroupSidebar: Locator;
  readonly users: Locator;
  readonly displaynameFriendItem: Locator;

  firstUserNameText: string = '';
  secondUserNameText: string = '';
  message: string = '';
  messageCreateTopic: string = '';
  messageInTopic: string = '';
  groupNameText: string = '';
  userNameItemText: string = '';

  constructor(page: Page) {
    this.page = page;
    this.helpers = new DirectMessageHelper(page);
    this.buttonCreateGroupSidebar = page.locator(
      generateE2eSelector('chat.direct_message.button.button_plus')
    );
    this.user = this.page
      .locator(generateE2eSelector('chat.direct_message.chat_list'))
      .filter({ hasNot: this.page.locator('p', { hasText: 'Members' }) })
      .first();
    this.users = this.page
      .locator(generateE2eSelector('chat.direct_message.chat_list'))
      .filter({ hasNot: this.page.locator('p', { hasText: 'Members' }) });
    this.addUserButton = page.locator(generateE2eSelector('chat.direct_message.button.add_user'));
    this.userItem = page
      .locator(generateE2eSelector('chat.direct_message.friend_list.friend_item'))
      .first();
    this.usernameFriendItem = page
      .locator(generateE2eSelector('chat.direct_message.friend_list.username_friend_item'))
      .first();
    this.displaynameFriendItem = page
      .locator(generateE2eSelector('chat.direct_message.friend_list.displayname_friend_item'))
      .first();
    this.friendItems = page.locator(
      generateE2eSelector('chat.direct_message.friend_list.friend_item')
    );
    this.friendUsernames = page.locator(
      generateE2eSelector('chat.direct_message.friend_list.username_friend_item')
    );
    this.createGroupButton = page.locator(
      generateE2eSelector('chat.direct_message.button.create_group')
    );
    this.userNameItem = this.userItem.locator(
      generateE2eSelector('chat.direct_message.friend_list.username_friend_item')
    );
    this.addToGroupButton = page.locator(
      generateE2eSelector('chat.direct_message.button.add_user')
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
      .locator(generateE2eSelector('base_profile.display_name'))
      .nth(1);
    this.userNamesInDM = page.locator(
      generateE2eSelector('chat.direct_message.chat_item.username')
    );
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
    try {
      await this.buttonCreateGroupSidebar.click();

      const firstUser = this.userItem;
      await firstUser.waitFor({ state: 'visible', timeout: 5000 });

      this.firstUserNameText =
        ((await this.usernameFriendItem.textContent())?.trim() ||
          (await this.displaynameFriendItem.textContent())?.trim()) ??
        '';
      await firstUser.click();
      await firstUser.waitFor({ state: 'visible', timeout: 2000 });

      await this.createGroupButton.click();
      await this.page.waitForLoadState('networkidle');
    } catch (error) {
      console.error('Error creating DM:', error);
      throw error;
    }
  }

  async isDMCreated(): Promise<boolean> {
    const allUserNamesInDM = await this.userNamesInDM.allTextContents();
    const stillExists = allUserNamesInDM.some(name =>
      name.includes(this.firstUserNameText)
    );

    return stillExists;
  }

  async createGroup(): Promise<void> {
    await this.openSelectFriendsModal();
    await this.pickFriends(2);
    await this.submitCreate();
  }

  private async openSelectFriendsModal(): Promise<void> {
    await this.buttonCreateGroupSidebar.click();
  }

  private async pickFriends(count: number): Promise<void> {
    const start = Date.now();
    while ((await this.friendItems.count()) < count) {
      if (Date.now() - start > 10000) {
        throw new Error(
          `Not enough friends to create group: need ${count}, have ${await this.friendItems.count()}`
        );
      }
      await this.page.waitForTimeout(3000);
    }

    const first = this.friendItems.nth(0);
    const second = this.friendItems.nth(1);

    await first.click();
    await second.click();

    const u0 = ((await this.friendUsernames.nth(0).textContent()) || '').trim();
    const u1 = ((await this.friendUsernames.nth(1).textContent()) || '').trim();
    this.firstUserNameText = u0;
    this.secondUserNameText = u1;
  }

  private async submitCreate(): Promise<void> {
    await this.createGroupButton.click();
  }

  async isGroupCreated(prevGroupCount: number): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < 8000) {
      const current = await this.helpers.countGroups();
      if (current >= prevGroupCount + 1) break;
      await this.page.waitForTimeout(3000);
    }

    const current = await this.helpers.countGroups();
    if (current >= prevGroupCount + 1) return true;

    const groupNames = (await this.helpers.groupList.allInnerTexts())
      .map(n => (n || '').trim())
      .filter(Boolean);
    if (!groupNames.length) return false;
    const containsFirst =
      !!this.firstUserNameText && groupNames.some(n => n.includes(this.firstUserNameText));
    const containsSecond =
      !!this.secondUserNameText && groupNames.some(n => n.includes(this.secondUserNameText));
    return containsFirst || containsSecond;
  }

  async addMoreMemberToGroup(): Promise<void> {
    await this.helpers.group.click();
    await this.addUserButton.click();
    await this.page.waitForTimeout(5000);
    await this.userItem.click();
    this.userNameItemText = (await this.userNameItem.textContent()) ?? '';
    await this.addToGroupButton.click();
    await this.page.waitForTimeout(3000);
  }

  async getMemberCount(): Promise<number> {
    await this.helpers.group.click();
    await this.sumMember.click();

    const memberItems = this.memberCount;
    const count = await memberItems.count();

    return count;
  }

  async isMemberAdded(previousCount: number): Promise<boolean> {
    const start = Date.now();
    let newCount = previousCount;
    while (Date.now() - start < 8000) {
      await this.helpers.group.click();
      await this.sumMember.click();
      newCount = await this.memberCount.count();
      if (newCount >= previousCount + 1) return true;
      await this.page.waitForTimeout(3000);
    }

    const namesRaw = await this.memberListInGroup.allTextContents();
    const names = namesRaw
      .flatMap(t => t.split(','))
      .map(s => s.trim())
      .filter(Boolean);
    return !!this.userNameItemText && names.some(n => n.includes(this.userNameItemText));
  }
  
  async closeDM(): Promise<void> {
    await this.user.hover();
    await this.closeFirstDMButton.click({ force: true });
  }

  async isDMClosed(): Promise<boolean> {
    const allUserNamesInDM = await this.userNamesInDM.allInnerTexts();
    const stillExists = allUserNamesInDM.some(name => name.includes(this.firstUserNameText));
    return !stillExists;
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
  async isLeavedGroup(): Promise<boolean> {
    const groupNames = await this.helpers.groupList.allInnerTexts(); // lấy lại toàn bộ tên group

    if (!groupNames.length) {
      return true;
    }

    const containsFirst =
      !!this.firstUserNameText && groupNames.some(n => n.includes(this.firstUserNameText));
    const containsSecond =
      !!this.secondUserNameText && groupNames.some(n => n.includes(this.secondUserNameText));

    return !containsFirst && !containsSecond;
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

  async cleanDMAndGroup() {
    let dmCount = await this.helpers.countUsers();
    while (dmCount > 0) {
      const firstDM = this.users.first();
      await firstDM.waitFor({ state: 'visible' });
      await this.closeDM();

      await expect(this.users).toHaveCount(dmCount - 1);

      dmCount = await this.helpers.countUsers();
    }

    let groupCount = await this.helpers.countGroups();
    while (groupCount > 0) {
      const firstGroup = this.helpers.groups.first();
      await firstGroup.waitFor({ state: 'visible' });
      await this.leaveGroupByXBtn();

      await expect(this.helpers.groups).toHaveCount(groupCount - 1);

      groupCount = await this.helpers.countGroups();
    }
  }
}
