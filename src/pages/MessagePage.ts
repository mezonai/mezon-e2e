import { DirectMessageHelper } from '@/utils/directMessageHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Locator, Page } from '@playwright/test';

export class MessgaePage {
  private helpers: DirectMessageHelper;
  readonly page: Page;
  readonly user: Locator;
  readonly addUserButton: Locator;
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
  readonly pendingFriendStatusButton: Locator;
  readonly addFriendButton: Locator;
  readonly friendRequestFormInput: Locator;
  readonly friendRequestFormSubmitButton: Locator;
  readonly friendStatusListTitle: Locator;
  readonly friendStatusListItem: Locator;
  readonly friendStatusListUsername: Locator;

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
    this.addUserButton = page.locator(generateE2eSelector('chat.direct_message.button.add_user'));
    this.userItem = page
      .locator(generateE2eSelector('chat.direct_message.friend_list.friend_item'))
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
    this.addFriendButton = page.locator(
      `${generateE2eSelector('chat.direct_message.header')} ${generateE2eSelector('button.base')}`,
      { hasText: 'Add Friend' }
    );
    this.pendingFriendStatusButton = page.locator(
      generateE2eSelector('chat.direct_message.header.buttons'),
      { hasText: 'Pending' }
    );
    this.friendRequestFormInput = page.locator(
      generateE2eSelector('chat.direct_message.friend_request_form.input')
    );
    this.friendRequestFormSubmitButton = page.locator(
      `${generateE2eSelector('chat.direct_message.friend_request_form')} ${generateE2eSelector('button.base')}`,
      { hasText: 'Send Friend Request' }
    );
    this.friendStatusListTitle = page.locator(
      generateE2eSelector('chat.direct_message.friend_status_list.header.title')
    );
    this.friendStatusListItem = page.locator(
      generateE2eSelector('chat.direct_message.friend_status_list.list.item.username')
    );
    this.friendStatusListUsername = page.locator(
      generateE2eSelector('chat.direct_message.friend_status_list.list.item.username')
    );
  }

  async createDM(): Promise<void> {
    try {
      await this.buttonCreateGroupSidebar.click();

      const firstUser = this.page.locator('.bg-item-theme').first();
      await firstUser.waitFor({ state: 'visible', timeout: 5000 });

      this.firstUserNameText = (await firstUser.textContent())?.trim().split(/\s+/)[0] ?? '';
      await firstUser.click();
      await firstUser.waitFor({ state: 'visible', timeout: 2000 });

      await this.createGroupButton.click();
    } catch (error) {
      console.error('Error creating DM:', error);
      throw error;
    }
  }

  async isDMCreated(): Promise<boolean> {
    await this.userNamesInDM.first().waitFor({ state: 'visible', timeout: 5000 });
    const allUserNamesInDM = await this.userNamesInDM.allInnerTexts();
    const found = allUserNamesInDM.some(
      name =>
        name.includes(this.firstUserNameText.replace(/^A/, '')) ||
        name.includes(this.firstUserNameText)
    );

    return found;
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
      await this.page.waitForTimeout(200);
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
      await this.page.waitForTimeout(200);
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
    const start = Date.now();
    let newCount = previousCount;
    while (Date.now() - start < 8000) {
      await this.helpers.group.click();
      await this.sumMember.click();
      newCount = await this.memberCount.count();
      if (newCount >= previousCount + 1) return true;
      await this.page.waitForTimeout(250);
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

  async addFriendByUsername(username: string): Promise<void> {
    await this.addFriendButton.click();
    await this.friendRequestFormInput.fill(username);
    await this.friendRequestFormSubmitButton.click();
  }

  async isFriendRequestSent(username: string): Promise<boolean> {
    await this.pendingFriendStatusButton.click();
    if ((await this.friendStatusListTitle.innerText()).includes('PENDING')) {
      const friendStatusList = await this.friendStatusListUsername.allInnerTexts();
      return friendStatusList.some(status => status.includes(username));
    }
    return false;
  }
}
