import MessageSelector from '@/data/selectors/MessageSelector';
import { ROUTES } from '@/selectors';
import { DirectMessageHelper } from '@/utils/directMessageHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { getImageHash } from '@/utils/images';
import { FileSizeTestHelpers, UploadType } from '@/utils/uploadFileHelpers';
import { expect, Locator, Page } from '@playwright/test';
import sleep from '@utils/sleep';
import { BasePage } from './BasePage';
import { ProfilePage } from './ProfilePage';

export class MessagePage extends BasePage {
  private helpers: DirectMessageHelper;
  private selector: MessageSelector;

  firstUserNameText: string = '';
  secondUserNameText: string = '';
  message: string = '';
  messageCreateTopic: string = '';
  messageInTopic: string = '';
  groupNameText: string = '';
  userNameItemText: string = '';

  constructor(page: Page) {
    super(page);
    this.helpers = new DirectMessageHelper(page);
    this.selector = new MessageSelector(page);
  }

  async getFirstMessage(): Promise<Locator> {
    return this.selector.messages.first();
  }

  async createDM(): Promise<string> {
    try {
      await this.selector.buttonCreateGroupSidebar.click();

      const firstUser = (await this.selector.userItem.first().innerText()).trim();
      await this.selector.userItem.hover();
      await this.selector.userItem.click();
      await this.selector.createGroupButton.click();

      return firstUser;
    } catch (error) {
      console.error('Error creating DM:', error);
      throw error;
    }
  }

  async createDMByName(userName: string): Promise<void> {
    try {
      await this.selector.buttonCreateGroupSidebar.click();
      await expect(this.selector.friendItems.filter({ hasText: userName })).toBeVisible({
        timeout: 5000,
      });
      await this.selector.friendItems.filter({ hasText: userName }).first().hover();
      await this.selector.friendItems.filter({ hasText: userName }).first().click();
      await this.selector.createGroupButton.click();
    } catch (error) {
      console.error('Error creating DM:', error);
      throw error;
    }
  }

  async isDMCreated(): Promise<boolean> {
    await this.selector.userNamesInDM.first().waitFor({ state: 'visible', timeout: 5000 });
    return (await this.selector.userNamesInDM.allInnerTexts()).some(
      name =>
        name.includes(this.firstUserNameText.replace(/^A/, '')) ||
        name.includes(this.firstUserNameText)
    );
  }

  async gotoDMPage(): Promise<void> {
    await this.page.goto(ROUTES.DIRECT_FRIENDS);
  }

  async createGroup(): Promise<void> {
    await this.openSelectFriendsModal();
    await this.pickFriends(2);
    await this.submitCreate();
  }

  async clickEditButton(): Promise<void> {
    await this.selector.editGroupButton.click();
  }

  private async openSelectFriendsModal(): Promise<void> {
    await this.selector.buttonCreateGroupSidebar.click();
  }

  private async pickFriends(count: number): Promise<void> {
    const start = Date.now();
    while ((await this.selector.friendItems.count()) < count) {
      if (Date.now() - start > 10000) {
        throw new Error(
          `Not enough friends to create group: need ${count}, have ${await this.selector.friendItems.count()}`
        );
      }
      await this.page.waitForTimeout(3000);
    }

    const first = this.selector.friendItems.nth(0);
    const second = this.selector.friendItems.nth(1);

    await first.click();
    await second.click();

    const u0 = ((await this.selector.friendUsernames.nth(0).textContent()) || '').trim();
    const u1 = ((await this.selector.friendUsernames.nth(1).textContent()) || '').trim();
    this.firstUserNameText = u0;
    this.secondUserNameText = u1;
  }

  private async submitCreate(): Promise<void> {
    await this.selector.createGroupButton.click();
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

    const groupName = await this.selector.groupName.innerText();
    if (!groupName) return false;
    const containsFirst = !!this.firstUserNameText && groupName.includes(this.firstUserNameText);
    const containsSecond = !!this.secondUserNameText && groupName.includes(this.secondUserNameText);
    return containsFirst || containsSecond;
  }

  async addMoreMemberToGroup(): Promise<void> {
    await this.selector.group.click();
    await this.selector.addUserButton.click();
    await this.page.waitForTimeout(5000);
    await this.selector.userItem.click();
    this.userNameItemText = (await this.selector.userNameItem.textContent()) ?? '';
    await this.selector.addToGroupButton.click();
    await this.page.waitForTimeout(3000);
  }

  async getMemberCount(): Promise<number> {
    await this.selector.group.click();
    await this.selector.sumMember.click();

    const memberItems = this.selector.memberCount;
    return await memberItems.count();
  }

  async isMemberAdded(previousCount: number): Promise<boolean> {
    const start = Date.now();
    let newCount = previousCount;
    while (Date.now() - start < 8000) {
      await this.selector.group.click();
      await this.selector.sumMember.click();
      newCount = await this.selector.memberCount.count();
      if (newCount >= previousCount + 1) return true;
      await this.page.waitForTimeout(3000);
    }

    const names = (await this.selector.memberListInGroup.allTextContents())
      .flatMap(t => t.split(','))
      .map(s => s.trim())
      .filter(Boolean);
    return !!this.userNameItemText && names.some(n => n.includes(this.userNameItemText));
  }

  async closeDM(username: string): Promise<void> {
    const user = await this.selector.listDMItems
      .filter({
        hasNot: this.page.locator('p', { hasText: 'Members' }),
        has: this.page.locator('span', {
          hasText: username,
        }),
      })
      .first();

    await expect(user).toBeVisible({ timeout: 5000 });
    await user.hover();
    const closeBtn = user.locator(
      generateE2eSelector('chat.direct_message.chat_item.close_dm_button')
    );
    await expect(closeBtn).toBeVisible({ timeout: 3000 });
    await closeBtn.click({ force: true });
  }

  async isDMClosed(username: string): Promise<boolean> {
    const count = await this.selector.userNamesInDM.count();
    for (let i = 0; i < count; i++) {
      const text = (await this.selector.userNamesInDM.nth(i).innerText()).trim();
      if (text === username) {
        return false;
      }
    }
    return true;
  }

  async leaveGroupByXBtn(): Promise<string> {
    const rawText = await this.selector.group.innerText();
    const groupName = rawText.split('\n')[0].trim();

    await this.selector.group.hover();
    await this.selector.leaveGroupButton.click({ force: true });
    await this.selector.confirmLeaveGroupButton.click();

    return groupName;
  }

  async leaveGroupByLeaveGroupBtn(): Promise<void> {
    await this.selector.group.dispatchEvent('contextmenu');
  }

  async getFriendItemFromFriendList(friendName: string): Promise<Locator> {
    return this.selector.friendListItems.filter({ hasText: friendName }).first();
  }

  async createDMWithFriendName(friendName: string): Promise<void> {
    const friendItem = this.selector.friendListItems.filter({ hasText: friendName }).first();
    await friendItem.click();
    await this.page.waitForTimeout(500);
  }

  async openUserProfile(): Promise<void> {
    await this.selector.headerUserProfileButton.click();
    await this.page.waitForTimeout(500);
  }

  getFriendItemFromListDM(friendName: string): Locator {
    const dmItem = this.selector.listDMItems;
    return dmItem.filter({ hasText: friendName }).first();
  }

  async isLeavedGroup(groupName: string): Promise<boolean> {
    const count = await this.selector.userNamesInDM.count();
    for (let i = 0; i < count; i++) {
      const text = (await this.selector.userNamesInDM.nth(i).innerText()).trim();
      if (text === groupName) {
        return false;
      }
    }
    return true;
  }

  async sendMessage(message: string): Promise<void> {
    this.message = message;
    await this.selector.firstUserAddDM.click();
    await this.selector.messageInput.click();
    await this.selector.messageInput.fill(message);
    await this.selector.messageInput.press('Enter');
  }

  async getMessageWithProfileName(profileName: string): Promise<Locator> {
    return this.selector.messages.filter({ hasText: profileName }).last();
  }

  async sendMessageWhenInDM(message: string): Promise<void> {
    this.message = message;
    await this.selector.messageInput.click();
    await this.selector.messageInput.fill(message);
    await this.selector.messageInput.press('Enter');
  }

  async isMessageSend(): Promise<boolean> {
    const lastMessage = this.selector.messages.last();
    const text = await lastMessage.innerText();

    return text.includes(this.message);
  }

  async updateNameGroupChatDM(groupName: string): Promise<void> {
    this.groupNameText = groupName;

    await this.selector.group.click();
    await this.selector.editGroupButton.click();
    await this.selector.groupNameInput.click();
    await this.selector.groupNameInput.fill('');
    await this.selector.groupNameInput.fill(groupName);
    await this.selector.saveGroupNameButton.click();
  }

  async isGroupNameDMUpdated(): Promise<boolean> {
    const groupName = (await this.selector.groupName.innerText()).trim();
    return groupName === this.groupNameText;
  }

  async pinLastMessage() {
    const lastMessage = this.selector.messages.last();
    await lastMessage.click({ button: 'right' });
    await this.selector.pinMessageButton.click();
    await this.selector.confirmPinMessageButton.click();
  }

  async pinSpecificMessage(messageItem: Locator) {
    await messageItem.click({ button: 'right' });
    await this.selector.pinMessageButton.click();
    await this.selector.confirmPinMessageButton.click();
  }

  async getLastMessageWithProfileName(profileName: string): Promise<Locator> {
    return this.selector.messages.filter({ hasText: profileName }).last();
  }

  async deleteLastMessage() {
    const lastMessage = this.selector.messages.last();
    await expect(lastMessage).toBeVisible({ timeout: 5000 });
    await lastMessage.click({ button: 'right' });
    await this.page.waitForTimeout(1000);
    await this.selector.deleteMessageButton.click();
    await this.page.waitForTimeout(1000);
    await this.selector.confirmDeleteMessageButton.click();
  }

  async isMessageStillPinned(messageIdentity: string): Promise<boolean> {
    await this.selector.displayListPinButton.click();
    const pinnedMessage = this.selector.pinnedMessages.filter({ hasText: messageIdentity });
    return (await pinnedMessage.count()) > 0;
  }

  async editMessage(messageItem: Locator, newText: string) {
    await messageItem.click({ button: 'right' });
    await this.selector.editMessageButton.click();
    const textarea = this.page.locator('#editorReactMentionChannel');
    await textarea.fill(newText);
    await textarea.press('Enter');
    await sleep(1000);
    return this.selector.messages.filter({ hasText: newText });
  }

  async forwardMessage(messageItem: Locator) {
    await messageItem.click({ button: 'right' });
    await this.selector.forwardMessageButton.click();
  }

  private async assertVisibleLocators(locator: Locator | Locator[]): Promise<void> {
    const locators = Array.isArray(locator) ? locator : [locator];
    const [head, ...tail] = locators;
    if (!head) return;
    expect(head).toBeVisible();
    expect(head).toHaveCount(1);
    return this.assertVisibleLocators(tail);
  }

  async assertDMHeaderCallVisible(): Promise<void> {
    await this.assertVisibleLocators(this.selector.dmHeaderCallAction);
  }

  async assertDMHeaderVideoCallVisible(): Promise<void> {
    await this.assertVisibleLocators(this.selector.dmHeaderVideoCallAction);
  }

  async assertDMHeaderAddMemberVisible(): Promise<void> {
    await this.assertVisibleLocators(this.selector.dmHeaderAddMemberAction);
  }

  private async assertNotVisibleLocators(locator: Locator | Locator[]): Promise<void> {
    const locators = Array.isArray(locator) ? locator : [locator];
    const [head, ...tail] = locators;
    if (!head) return;
    expect(head).not.toBeVisible();
    expect(head).toHaveCount(0);
    return this.assertNotVisibleLocators(tail);
  }

  async assertDMHeaderCallNotVisible(): Promise<void> {
    await this.assertNotVisibleLocators(this.selector.dmHeaderCallAction);
  }

  async assertDMHeaderVideoCallNotVisible(): Promise<void> {
    await this.assertNotVisibleLocators(this.selector.dmHeaderVideoCallAction);
  }

  async assertDMHeaderAddMemberNotVisible(): Promise<void> {
    await this.assertNotVisibleLocators(this.selector.dmHeaderAddMemberAction);
  }

  async openGroupFromName(name: string) {
    const messagePage = new MessagePage(this.page);
    const groupLocator = messagePage.selector.userNamesInDM
      .filter({ hasText: name.slice(0, 15) })
      .first();
    await expect(groupLocator).toBeVisible({ timeout: 3000 });
    await groupLocator.first().click();
  }

  async updateAvatarForGroup(groupName: string): Promise<void> {
    const fileSizeHelpers = new FileSizeTestHelpers(this.page);

    await this.selector.group.click();
    await this.selector.editGroupButton.click();
    const groupAvt = await fileSizeHelpers.createFileWithSize(
      'direct_message_icon',
      5 * 1024 * 1024,
      'jpg'
    );

    const result = await fileSizeHelpers.uploadByTypeAndVerify(
      groupAvt,
      UploadType.GROUP_AVATAR,
      true
    );
    expect(result.success).toBe(true);
    await this.selector.groupNameInput.click();
    await this.selector.groupNameInput.fill('');
    await this.selector.groupNameInput.fill(groupName);
    await expect(this.selector.saveGroupNameButton).toBeVisible({ timeout: 3000 });
    await this.selector.saveGroupNameButton.click();
    await expect(this.selector.editGroupModal).toBeHidden({ timeout: 10000 });
  }

  async getAvatarHashOnDMList(groupName: string): Promise<string> {
    const avatarLocator = this.selector.listDMItems
      .filter({
        hasText: groupName.slice(0, 15),
      })
      .locator(generateE2eSelector('avatar.image'))
      .first();

    await expect
      .poll(
        async () => {
          return await avatarLocator.getAttribute('src');
        },
        { timeout: 8000 }
      )
      .toMatch(/^https?:\/\//);

    const avatarSrc = await avatarLocator.getAttribute('src');

    if (!avatarSrc) {
      throw new Error('Avatar src is null or undefined');
    }
    return (await getImageHash(avatarSrc)) ?? '';
  }

  async getAvatarHashOnHeaderChat(): Promise<string> {
    const avatarLocator = this.selector.headerDMAvatar;
    await expect
      .poll(
        async () => {
          return await avatarLocator.getAttribute('src');
        },
        { timeout: 8000 }
      )
      .toMatch(/^https?:\/\//);
    const avatarSrc = await avatarLocator.getAttribute('src');

    if (!avatarSrc) {
      throw new Error('Avatar src is null or undefined');
    }
    return (await getImageHash(avatarSrc)) ?? '';
  }

  async openForwardMessageModal(): Promise<void> {
    await this.selector.messages.last().click({ button: 'right' });
    await this.selector.forwardMessageButton.click();
    await expect(this.selector.modalForwardMessage).toBeVisible({ timeout: 5000 });
  }

  async getAvatarHashOnForwardPopup(groupName: string): Promise<string> {
    await expect(this.selector.searchUserOnForwardMessageModal).toBeVisible({ timeout: 5000 });
    await this.selector.searchUserOnForwardMessageModal.fill(groupName);
    await this.page.waitForTimeout(3000);
    const groupItemLocator = this.selector.modalForwardMessage.locator(
      generateE2eSelector('suggest_item'),
      {
        hasText: groupName,
      }
    );
    await expect(groupItemLocator).toBeVisible({ timeout: 5000 });

    const avatarLocator = groupItemLocator.locator('img').first();
    await expect
      .poll(async () => await avatarLocator.getAttribute('src'), {
        timeout: 8000,
      })
      .toMatch(/^https?:\/\//);

    const avatarSrc = await avatarLocator.getAttribute('src');

    if (!avatarSrc) {
      throw new Error('Avatar src is null or undefined');
    }

    return (await getImageHash(avatarSrc)) ?? '';
  }

  async openSearchModalbyPressCtrlK(): Promise<void> {
    await this.page.keyboard.press('Control+K');
    await expect(this.selector.searchModal).toBeVisible({
      timeout: 5000,
    });
  }

  async openSearchModalbyClickSearchButton(): Promise<void> {
    await this.selector.searchTriggerButton.click();
    await expect(this.selector.searchModal).toBeVisible({
      timeout: 5000,
    });
  }

  async getAvatarHashOnSearchModal(groupName: string): Promise<string> {
    await expect(this.selector.searchInput).toBeVisible({ timeout: 5000 });
    await this.selector.searchInput.fill(groupName);
    await this.page.waitForTimeout(3000);
    const groupItemLocator = this.selector.searchModal.locator(
      generateE2eSelector('suggest_item'),
      {
        hasText: groupName,
      }
    );
    await expect(groupItemLocator).toBeVisible({ timeout: 5000 });
    const avatarLocator = groupItemLocator.locator('img').first();
    await expect
      .poll(async () => await avatarLocator.getAttribute('src'), {
        timeout: 8000,
      })
      .toMatch(/^https?:\/\//);
    const avatarSrc = await avatarLocator.getAttribute('src');

    if (!avatarSrc) {
      throw new Error('Avatar src is null or undefined');
    }
    return (await getImageHash(avatarSrc)) ?? '';
  }

  async leaveAllGroup() {
    const profilePage = new ProfilePage(this.page);
    await profilePage.navigate(ROUTES.DIRECT_FRIENDS);

    const chatList = this.selector.listDMItems;
    await expect(chatList.first()).toBeVisible({ timeout: 10000 });

    while (true) {
      const group = chatList
        .filter({
          has: this.page.locator('p', { hasText: 'Members' }),
        })
        .first();

      const groupCount = await group.count();
      if (groupCount === 0) {
        console.log('✅ No more groups to leave.');
        break;
      }

      await group.hover();
      const leaveGroupButton = group.locator(
        generateE2eSelector('chat.direct_message.chat_item.close_dm_button')
      );

      await leaveGroupButton.click({ force: true });
      const confirmLeaveGroupButton = this.page.locator(
        generateE2eSelector('chat.direct_message.leave_group.button')
      );
      await confirmLeaveGroupButton.click();

      await this.page.waitForTimeout(400);
      await expect(confirmLeaveGroupButton).toBeHidden({ timeout: 3000 });
    }
  }

  async leaveGroupByName(groupName: string) {
    const group = await this.page
      .locator(generateE2eSelector('chat.direct_message.chat_list'))
      .filter({
        has: this.page.locator('p', { hasText: 'Members' }),
      })
      .filter({
        has: this.page.locator('span', {
          hasText: groupName,
        }),
      })
      .first();
    await expect(group).toBeVisible({ timeout: 3000 });
    await group.hover();
    const leaveGroupButton = group.locator(
      generateE2eSelector('chat.direct_message.chat_item.close_dm_button')
    );

    await leaveGroupButton.click({ force: true });
    const confirmLeaveGroupButton = this.page.locator(
      generateE2eSelector('chat.direct_message.leave_group.button')
    );
    await confirmLeaveGroupButton.click();

    await this.page.waitForTimeout(400);
    await expect(confirmLeaveGroupButton).toBeHidden({ timeout: 3000 });
  }

  async isChannelPresentOnForwardModal(channelName: string) {
    await expect(this.selector.searchUserOnForwardMessageModal).toBeVisible({ timeout: 5000 });
    await this.selector.searchUserOnForwardMessageModal.fill(channelName);
    await this.page.waitForTimeout(3000);
    const channelItemLocator = this.selector.modalForwardMessage.locator(
      generateE2eSelector('suggest_item'),
      {
        hasText: channelName,
      }
    );

    try {
      await channelItemLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async isChannelPresentOnSearchModal(channelName: string) {
    await expect(this.selector.searchInput).toBeVisible({ timeout: 5000 });
    await this.selector.searchInput.fill(channelName);
    await this.page.waitForTimeout(3000);
    const channelItemLocator = this.selector.searchModal.locator(
      generateE2eSelector('suggest_item'),
      {
        hasText: channelName,
      }
    );

    try {
      await channelItemLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async closeModalForwardMessage() {
    await this.selector.cancelForwardMessageButton.click();
    await expect(this.selector.searchUserOnForwardMessageModal).toBeHidden({ timeout: 5000 });
  }

  async getMessageBuzzHeader() {
    return this.selector.messageBuzzHeader;
  }

  async clickMessageBuzzCloseButton() {
    await this.selector.messageBuzzButtonClose.click();
  }

  async fillMessageBuzzInputMessage(message: string) {
    await this.selector.messageBuzzInputMessage.fill(message);
  }

  async clickMessageBuzzSendButton() {
    await this.selector.messageBuzzButtonSend.click();
  }

  async getListDMItems() {
    return this.selector.listDMItems;
  }

  async getChatListContainer() {
    return this.selector.chatListContainer;
  }

  async getWelcomeDM() {
    return this.selector.welcomeDM;
  }

  async getDirectMessageBlockButton() {
    return this.selector.directMessageBlockButton;
  }

  async getDirectMessageUnblockButton() {
    return this.selector.directMessageUnblockButton;
  }

  async getMessageByText(text: string): Promise<Locator> {
    return this.selector.messages.filter({ hasText: text }).first();
  }

  async getLastViewTopicButton() {
    return this.selector.viewTopicButoon.last();
  }

  async getTopicInput() {
    return this.selector.topicInput;
  }

  async getGroupName() {
    return this.selector.groupName;
  }

  async getUserNamesInDMByGroupName(groupName: string) {
    return this.selector.userNamesInDM.filter({ hasText: groupName });
  }

  async getLastMessage() {
    return this.selector.messages.last();
  }

  async getFirstUserNameAddDM() {
    return this.selector.firstUserNameAddDM;
  }

  async getFooterAvatar() {
    return this.selector.footerAvatar;
  }

  async getHeaderDMAvatar() {
    return this.selector.headerDMAvatar;
  }

  async removeUserFromGroup(username: string) {
    const showMemberButton = this.selector.sumMember;
    await expect(showMemberButton).toBeVisible({ timeout: 3000 });
    await showMemberButton.click();

    const userLocator = this.selector.secondarySideBar.member.item.filter({
      has: this.page.locator('span').filter({ hasText: username }),
    });

    await expect(userLocator).toBeVisible({ timeout: 3000 });
    await userLocator.click({ button: 'right' });

    const popup = this.page.locator('div.contexify.z-50.rounded-lg.border-theme-primary');
    await expect(popup).toBeVisible({ timeout: 5000 });

    const removeUserButton = popup.locator(
      generateE2eSelector('chat.direct_message.menu.leave_group.button')
    );

    await expect(removeUserButton).toBeVisible({ timeout: 3000 });
    await removeUserButton.click();

    await expect(userLocator).toBeHidden({ timeout: 3000 });
  }
}
