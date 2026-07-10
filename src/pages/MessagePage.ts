import MessageSelector from '@/data/selectors/MessageSelector';
import { ROUTES } from '@/selectors';
import { DirectMessageHelper } from '@/utils/directMessageHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { getImageHash } from '@/utils/images';
import { FileSizeTestHelpers, UploadType } from '@/utils/uploadFileHelpers';
import { expect, Locator, Page } from '@playwright/test';
import sleep from '@utils/sleep';
import { BasePage } from './BasePage';

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

      const userItem = this.selector.userItem.first();

      await userItem.waitFor({
        state: 'visible',
      });

      const firstUser =
        (await userItem.locator('span:not([data-e2e])').textContent())?.trim() ?? '';

      await userItem.click();

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

  async openSelectFriendsModal(): Promise<void> {
    await this.selector.buttonCreateGroupSidebar.click();
  }

  async pickFriends(count: number): Promise<void> {
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

  async submitCreate(): Promise<void> {
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

  async addMemberToCurrentConversation(): Promise<void> {
    await this.selector.addUserButton.click();
    await this.page.waitForTimeout(3000);
    await this.selector.userItem.click();
    this.userNameItemText = (await this.selector.userNameItem.textContent()) ?? '';
    await this.selector.createGroupButton.click();
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
        has: this.page
          .locator(generateE2eSelector('chat.direct_message.chat_item.username'))
          .filter({ hasText: username }),
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
    const textarea = this.page.locator('div[class*="mention-input-editor"]').first();
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
    const groupLocator = messagePage.selector.groupNamesInDM
      .filter({ hasText: name.slice(0, 20) })
      .first();
    await expect(groupLocator).toBeVisible({ timeout: 10000 });
    await groupLocator.first().click();
  }

  async updateAvatarForGroup(groupName: string): Promise<void> {
    const fileSizeHelpers = new FileSizeTestHelpers(this.page);

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
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.press('Control+K');
    await this.page.waitForTimeout(1000);
    await expect(this.selector.searchModal).toBeVisible({
      timeout: 5000,
    });
  }

  async closeSearchModal(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.selector.searchModal).toBeHidden({
      timeout: 5000,
    });
  }

  async verifyBadgeOnSearchModal(username: string, shouldHaveBadge = true): Promise<void> {
    await this.openSearchModalbyPressCtrlK();
    await expect(this.selector.searchInput).toBeVisible({ timeout: 5000 });
    await this.selector.searchInput.fill(username);
    await this.page.waitForTimeout(3000);
    const suggestItem = this.selector.searchModal.locator(generateE2eSelector('suggest_item'), {
      hasText: username,
    });
    await expect(suggestItem.first()).toBeVisible({ timeout: 5000 });
    const badge = suggestItem.first().locator(generateE2eSelector('suggest_item.count_badge'));
    if (shouldHaveBadge) {
      await expect(badge).toBeVisible({ timeout: 3000 });
    } else {
      await expect(badge).toBeHidden({ timeout: 3000 });
    }
    await this.closeSearchModal();
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
    const chatList = this.selector.listDMItems;

    try {
      await chatList.first().waitFor({ state: 'visible', timeout: 5000 });
    } catch (e) {
      console.log('Account clean, no group/chat to leave.');
      return;
    }

    while (true) {
      const group = chatList
        .filter({
          has: this.page.locator(generateE2eSelector('chat.direct_message.chat_item.group_name')),
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

      await leaveGroupButton.first().click({ force: true });
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
        has: this.page.locator(generateE2eSelector('chat.direct_message.chat_item.group_name'), {
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

  async forwardMessageToChannel(channelName: string) {
    await expect(this.selector.searchUserOnForwardMessageModal).toBeVisible({ timeout: 5000 });
    await this.selector.searchUserOnForwardMessageModal.fill(channelName);
    await this.page.waitForTimeout(3000);
    const channelItemLocator = this.selector.modalForwardMessage.locator(
      generateE2eSelector('suggest_item'),
      {
        hasText: channelName,
      }
    );
    await channelItemLocator.waitFor({ state: 'visible', timeout: 5000 });
    await channelItemLocator.first().click();
    await this.selector.sendForwardMessageButton.click();
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
    return this.selector.chatListContainer.last();
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

  async getMessageSenderUsername(messageItem: Locator) {
    const usernameLocator = await messageItem
      .locator(generateE2eSelector('base_profile.display_name'))
      .first();
    await expect(usernameLocator).toBeVisible({ timeout: 5000 });
    return usernameLocator;
  }

  async removeFriendFromShortProfile() {
    const unfriendIconButton = this.page.locator(
      generateE2eSelector('short_profile.action.button.remove_friend')
    );
    await expect(unfriendIconButton).toBeVisible({ timeout: 3000 });
    await unfriendIconButton.click();
    const unfriendButton = this.page
      .locator(generateE2eSelector('clan_page.channel_list.panel.item'))
      .filter({ hasText: 'Remove Friend' })
      .first();
    await expect(unfriendButton).toBeVisible({ timeout: 3000 });
    await unfriendButton.click();
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
  async getUserLocator(username: string) {
    return this.selector.userNamesInDM.filter({ hasText: username }).first();
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

  async getFriendItemList(username: string) {
    return this.selector.friendItems.filter({ hasText: username });
  }

  async pickFriendByName(username: string) {
    return this.selector.friendItems.filter({ hasText: username }).first().click();
  }

  async addUserToGroup(username: string) {
    await this.selector.addUserButton.click();
    await this.selector.userItem.filter({ hasText: username }).first().click();
    await this.selector.createGroupButton.click();
  }

  async showMemberGroup() {
    await this.selector.sumMember.click();
  }

  async verifyUserInMemberGroup(username: string) {
    await expect(
      this.selector.secondarySideBar.member.item.filter({ hasText: username })
    ).toBeVisible({ timeout: 3000 });
  }
  async getLastUserSendMessage() {
    return this.selector.displayNameOnMessageChannel.last();
  }

  async getShortProfileDisplayName() {
    return this.selector.shortProfile.displayName.innerText();
  }

  async getShortProfileUsername() {
    return this.selector.shortProfile.username.innerText();
  }

  async getShortProfileInputSendMessage() {
    return this.selector.shortProfile.input.sendMessage.getAttribute('placeholder');
  }

  async verifyShortProfileUsernameWithInputChat() {
    const displayName = await this.getShortProfileDisplayName();
    const inputChat = await this.getShortProfileInputSendMessage();
    expect(inputChat).toContain(displayName);
  }

  async mentionByText(text: string) {
    await this.selector.messageInput.fill(`@${text}`);
    await this.page.waitForTimeout(1000);
    await this.selector.messageInput.press('Enter');
    await this.page.waitForTimeout(1000);
    await this.selector.messageInput.press('Enter');
    await this.page.waitForTimeout(2000);
  }

  async verifyShortProfileIsUnknownUser() {
    expect(this.selector.shortProfile.displayName).toBeHidden({ timeout: 2000 });
    expect(this.selector.shortProfile.username).toBeHidden({ timeout: 2000 });
    await expect(this.selector.anonymous.anonymousAvatar).toBeVisible({ timeout: 2000 });
  }

  async openAnonymous() {
    await this.page.keyboard.down('Control');
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.down('Shift');
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.down('Enter');
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.up('Control');
    await this.page.keyboard.up('Shift');
    await this.page.keyboard.up('Enter');

    await this.page.waitForTimeout(3000);
  }

  async verifyAnonymousIsVisible() {
    await this.selector.anonymous.anonymousIcon.waitFor({ state: 'visible', timeout: 5000 });
  }

  async sendMessageWithAnonymous(message: string): Promise<void> {
    try {
      await this.selector.messageInput.click();
      await this.selector.messageInput.fill(message);
      await this.selector.messageInput.press('Enter');
      // await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(2000);

      this.message = message;
    } catch (error) {
      console.error('Error sending anonymous message:', error);
      throw error;
    }
  }

  async isAnonymousIconVisible(): Promise<boolean> {
    try {
      await this.selector.anonymous.anonymousIcon.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async isAnonymousMessageSent(): Promise<boolean> {
    try {
      const messageLocator = this.page.locator(`text="${this.message}"`);
      await messageLocator.waitFor({ state: 'visible', timeout: 5000 });

      await this.selector.anonymous.anonymousMessage.waitFor({ state: 'visible', timeout: 5000 });

      await this.selector.anonymous.anonymousName.waitFor({ state: 'visible', timeout: 5000 });

      return true;
    } catch (error) {
      console.error('Error verifying anonymous message:', error);
      return false;
    }
  }

  async unpinLastMessage() {
    const lastMessage = this.selector.messages.last();
    await expect(lastMessage).toBeVisible({ timeout: 5000 });
    await lastMessage.click({ button: 'right' });
    await this.page.waitForTimeout(1000);
    await this.selector.unpinMessageButton.click();
    await this.page.waitForTimeout(1000);
  }

  async verifyMessageIsUnpinned(message: string): Promise<boolean> {
    await this.selector.displayListPinButton.click();
    const pinnedMessage = this.selector.pinnedMessages.filter({ hasText: message });
    return (await pinnedMessage.count()) === 0;
  }

  async markMessageAsUnread(username: string) {
    const lastMessage = this.selector.messages.filter({ hasText: username }).last();
    await expect(lastMessage).toBeVisible({ timeout: 5000 });
    await lastMessage.click({ button: 'right' });
    await this.page.waitForTimeout(1000);
    await this.selector.markAsUnreadButton.click();
    await this.page.waitForTimeout(1000);
  }

  async getHeaderDM() {
    return this.selector.headerDM.first();
  }

  async openTimelineTab() {
    await this.selector.timeline.buttons.openTab.click();
  }

  async fillTitleAndDescription(data: { title: string; description: string }) {
    await this.selector.timeline.buttons.create.click();
    await this.page.waitForTimeout(1000);
    await this.selector.timeline.inputModals.eventTitle.fill(data.title);
    await this.selector.timeline.inputModals.eventDescription.fill(data.description);
    const date = await this.selector.timeline.inputModals.eventDate.inputValue();
    await this.page.waitForTimeout(2000);
    return date;
  }

  async clickSave() {
    await this.selector.timeline.buttons.saveModal.click();
  }

  async openTimelineModal() {
    await this.selector.timeline.buttons.create.click();
    await this.page.waitForTimeout(1000);
  }

  getMonthShort(month: number) {
    return new Date(0, month - 1).toLocaleString('en-US', { month: 'short' }).toUpperCase();
  }

  async verifyEventIsVisibleOnTab(data: { title: string; description: string }, date: string) {
    const [year, month, day] = date.split('-');
    const dateLocator = this.selector.timeline.eventTimeDetail.day.first();
    const monthLocator = this.selector.timeline.eventTimeDetail.month.first();
    const yearLocator = this.selector.timeline.eventTimeDetail.year.first();
    const formatMonth = this.getMonthShort(Number(month));
    const titleLocator = this.selector.timeline.triggerTab.eventDetailName.first();
    const descriptionLocator = this.selector.timeline.triggerTab.eventDetailDescription.first();

    await expect(dateLocator).toContainText(day, { timeout: 1000 });
    await expect(monthLocator).toContainText(formatMonth, { timeout: 1000 });
    await expect(yearLocator).toContainText(year, { timeout: 1000 });
    await expect(titleLocator).toContainText(data.title, { timeout: 1000 });
    await expect(descriptionLocator).toContainText(data.description, { timeout: 1000 });

    return titleLocator;
  }

  async openTimelineEventDetail(eventLocator: Locator) {
    await eventLocator.click();
    await this.page.waitForTimeout(1000);
  }

  async updatetimeline() {
    const unique = Date.now().toString(36);
    const data = {
      title: `Timeline-title-${unique}`.slice(0, 20),
      description: `Timeline-description-${unique}`.slice(0, 20),
    };
    const editTitleButton = this.selector.timeline.buttons.editTitle;
    const addDescriptionButton = this.selector.timeline.buttons.addDescription;
    const inputTitle = this.selector.timeline.input.title;
    const inputDescription = this.selector.timeline.input.description;
    await editTitleButton.click();
    await expect(inputTitle).toBeVisible({ timeout: 3000 });
    await inputTitle.fill(data.title);
    await this.page.waitForTimeout(1000);
    await addDescriptionButton.click();
    await expect(inputDescription).toBeVisible({ timeout: 3000 });
    await inputDescription.fill(data.description);
    await this.page.waitForTimeout(1000);

    await this.selector.timeline.buttons.save.click();
    await this.page.waitForTimeout(1000);
    await this.selector.timeline.buttons.back.click();
    return data;
  }

  async openCalendar() {
    await this.selector.timeline.buttons.openCalender.click();
    await this.page.waitForTimeout(1000);
  }

  async getSelectedYear(): Promise<string> {
    const year = await this.selector.timeline.buttons.selectedYear.first().textContent();
    return year?.trim() || '';
  }

  private extractYearFromDate(date: string): string {
    const parsed = new Date(date);
    return parsed.getFullYear().toString();
  }

  async verifyEventInCalendar(
    data: { title: string; description: string },
    date: string,
    selectedYear: string
  ) {
    const eventYear = this.extractYearFromDate(date);

    if (eventYear !== selectedYear) {
      throw new Error(`Year mismatch: event=${eventYear}, selected=${selectedYear}`);
    }

    const titleLocator = this.selector.timeline.card.title.filter({
      hasText: data.title,
    });

    const descriptionLocator = this.selector.timeline.card.description.filter({
      hasText: data.description,
    });

    await titleLocator.first().waitFor({ state: 'visible', timeout: 5000 });
    await descriptionLocator.first().waitFor({ state: 'visible', timeout: 5000 });
  }

  async isCallButtonVisibleOnGroupHeader(): Promise<boolean> {
    try {
      await this.selector.dmHeaderCallAction.first().waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async isVideoCallButtonVisibleOnGroupHeader(): Promise<boolean> {
    try {
      await this.selector.dmHeaderVideoCallAction
        .first()
        .waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async uploadAttachmentToTimelineEvent() {
    const fileSizeHelpers = new FileSizeTestHelpers(this.page);
    const file = await fileSizeHelpers.createFileWithSize(
      'timeline_attachment',
      5 * 1024 * 1024,
      'jpg'
    );
    const result = await fileSizeHelpers.uploadByTypeAndVerify(file, UploadType.TIMELINE, true);
    expect(result.success).toBe(true);

    await this.page.waitForTimeout(3000);
  }

  async openCreatePoll() {
    await this.selector.poll.button.openModal.click();
    await this.selector.poll.button.option.filter({ hasText: 'Create Poll' }).first().click();
    await expect(this.selector.poll.modal.input.question).toBeVisible();
  }

  async clickPollOptionByIndex(index: number) {
    const option = this.selector.poll.button.option.nth(index);
    await expect(option).toBeVisible();
    await option.click();
  }

  async createPoll(question: string, answers: string[], allowMulti = false) {
    await this.selector.poll.modal.input.question.fill(question);
    for (let i = 0; i < answers.length; i++) {
      if (i > 0) {
        await this.selector.poll.modal.button.addAnswer.click();
      }

      await this.selector.poll.modal.input.answer.nth(i).fill(answers[i]);
    }

    if (allowMulti) {
      await this.selector.poll.modal.input.allowMultiAnswer.click();
    }
    await this.selector.poll.modal.button.post.click();
  }

  async verifyPollCard(question: string, answers: string[]) {
    const pollCard = this.selector.poll.card;

    await expect(pollCard.question).toHaveText(question);

    for (let i = 0; i < answers.length; i++) {
      await expect(pollCard.answer.nth(i)).toHaveText(answers[i]);
    }

    await expect(pollCard.totalVotes).toBeVisible();
    await expect(pollCard.button.vote).toBeVisible();
  }

  async votePollByIndex(answerIndex: number) {
    const answer = this.selector.poll.card.answer.nth(answerIndex);
    await expect(answer).toBeVisible();
    await answer.click();

    await this.selector.poll.card.button.vote.click();
  }

  async verifyUserVoted(index: number) {
    const answer = this.selector.poll.card.answer.nth(index);
    const voted = answer.locator(this.selector.poll.card.voted);
    await expect(voted).toBeVisible({ timeout: 3000 });
    const removeVoteBtn = this.selector.poll.card.button.removeVote;
    await expect(removeVoteBtn).toBeVisible();
  }

  async removeVote() {
    await this.selector.poll.card.button.removeVote.click();
  }

  async endPoll() {
    await this.selector.poll.card.question.first().click({ button: 'right' });
    await this.selector.poll.button.endPoll.click();
    await this.page.waitForTimeout(1000);
  }

  async verifyEndPollOptionVisible() {
    await this.selector.poll.card.question.first().click({ button: 'right' });
    const endPollButton = this.selector.poll.button.endPoll;
    return await endPollButton.isVisible({ timeout: 1000 });
  }

  async verifyPollEnded() {
    await expect(this.selector.poll.card.ended).toBeVisible();
  }

  async clickShareContactButtonOnShortProfile() {
    const shareContactButton = this.page.locator(
      generateE2eSelector('short_profile.action.button.share_contact')
    );
    await expect(shareContactButton).toBeVisible({ timeout: 3000 });
    await shareContactButton.click();
  }
}
