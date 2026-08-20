import MessageSelector from '@/data/selectors/MessageSelector';
import { ROUTES } from '@/selectors';
import { DirectMessageHelper } from '@/utils/directMessageHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { getImageHash } from '@/utils/images';
import { FileSizeTestHelpers, UploadType } from '@/utils/uploadFileHelpers';
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

const CLOSE_DM_BUTTON_SELECTOR = generateE2eSelector(
  'chat.direct_message.chat_item.close_dm_button'
);
const MISSING_AVATAR_SOURCE_ERROR = 'Avatar src is null or undefined';

export class MessagePage extends BasePage {
  private helpers: DirectMessageHelper;
  private selector: MessageSelector;

  firstUserNameText: string = '';
  secondUserNameText: string = '';
  message: string = '';
  messageCreateTopic: string = '';
  messageInTopic: string = '';
  groupNameText: string = '';

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
      await expect(this.selector.messageInput).toBeVisible({ timeout: 5000 });

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
      await expect(this.selector.messageInput).toBeVisible({ timeout: 5000 });
    } catch (error) {
      console.error('Error creating DM:', error);
      throw error;
    }
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
    await expect
      .poll(() => this.selector.friendItems.count(), {
        message: `Wait until at least ${count} friends are available`,
        timeout: 10000,
      })
      .toBeGreaterThanOrEqual(count);

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
    try {
      await expect
        .poll(() => this.helpers.countGroups(), { timeout: 8000 })
        .toBeGreaterThanOrEqual(prevGroupCount + 1);
      return true;
    } catch {
      // Fall back to the rendered group name when the sidebar count updates slowly.
    }

    const groupName = await this.selector.groupName.innerText();
    if (!groupName) return false;
    const containsFirst = !!this.firstUserNameText && groupName.includes(this.firstUserNameText);
    const containsSecond = !!this.secondUserNameText && groupName.includes(this.secondUserNameText);
    return containsFirst || containsSecond;
  }

  async addMoreMemberToGroup(): Promise<void> {
    await this.selector.group.click();
    await this.selector.addUserButton.click();
    await expect(this.selector.userItem.first()).toBeVisible({ timeout: 5000 });
    await this.selector.userItem.click();
    await this.selector.addToGroupButton.click();
    await expect(this.selector.userItem.first()).toBeHidden({ timeout: 5000 });
  }

  async addMemberToCurrentConversation(): Promise<void> {
    await this.selector.addUserButton.click();
    await expect(this.selector.userItem.first()).toBeVisible({ timeout: 5000 });
    await this.selector.userItem.click();
    await this.selector.createGroupButton.click();
    await expect(this.selector.userItem.first()).toBeHidden({ timeout: 5000 });
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
    const closeBtn = user.locator(CLOSE_DM_BUTTON_SELECTOR);
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

  async getFriendItemFromFriendList(friendName: string): Promise<Locator> {
    return this.selector.friendListItems.filter({ hasText: friendName }).first();
  }

  async createDMWithFriendName(friendName: string): Promise<void> {
    const friendItem = this.selector.friendListItems.filter({ hasText: friendName }).first();
    await friendItem.click();
    await expect(this.selector.messageInput).toBeVisible({ timeout: 5000 });
  }

  async openUserProfile(): Promise<void> {
    await this.selector.headerUserProfileButton.click();
    await this.page.waitForTimeout(1000);
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
    await expect(this.selector.messages.filter({ hasText: message }).last()).toBeVisible({
      timeout: 5000,
    });
  }

  async getMessageWithProfileName(profileName: string): Promise<Locator> {
    return this.selector.messages.filter({ hasText: profileName }).last();
  }

  async sendMessageWhenInDM(message: string): Promise<void> {
    this.message = message;
    await this.selector.messageInput.click();
    await this.selector.messageInput.fill(message);
    await this.selector.messageInput.press('Enter');
    await expect(this.selector.messages.filter({ hasText: message }).last()).toBeVisible({
      timeout: 5000,
    });
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
    await expect(this.selector.groupName).toHaveText(groupName, { timeout: 5000 });
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
    await expect(this.selector.deleteMessageButton).toBeVisible({ timeout: 3000 });
    await this.selector.deleteMessageButton.click();
    await expect(this.selector.confirmDeleteMessageButton).toBeVisible({ timeout: 3000 });
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
    const editedMessage = this.selector.messages.filter({ hasText: newText });
    await expect(editedMessage.last()).toBeVisible({ timeout: 5000 });
    return editedMessage;
  }

  async forwardMessage(messageItem: Locator) {
    await messageItem.click({ button: 'right' });
    await this.selector.forwardMessageButton.click();
  }

  private async assertVisibleLocators(locator: Locator | Locator[]): Promise<void> {
    const locators = Array.isArray(locator) ? locator : [locator];
    const [head, ...tail] = locators;
    if (!head) return;
    await expect(head).toBeVisible();
    await expect(head).toHaveCount(1);
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
    await expect(head).not.toBeVisible();
    await expect(head).toHaveCount(0);
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
      throw new Error(MISSING_AVATAR_SOURCE_ERROR);
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
      throw new Error(MISSING_AVATAR_SOURCE_ERROR);
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
      throw new Error(MISSING_AVATAR_SOURCE_ERROR);
    }

    return (await getImageHash(avatarSrc)) ?? '';
  }

  async openSearchModalbyPressCtrlK(): Promise<void> {
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.press('Control+k');
    await this.page.waitForTimeout(1000);
    await expect(this.selector.searchModal).toBeVisible({
      timeout: 5000,
    });
  }

  async shareScreenIconInDM(): Promise<boolean> {
    const invoiceStatusInFriendList = this.selector.invoiceStatusFriendList;
    const friendListStatusVisible = await invoiceStatusInFriendList
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (friendListStatusVisible) {
      await expect(invoiceStatusInFriendList).toBeVisible();
    }

    return friendListStatusVisible;
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
      await expect(badge).toBeVisible({ timeout: 5000 });
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

  async verifyChannelSearchFromUserSuggestions(expectedUsers: string[]): Promise<void> {
    await this.verifyChannelSearchSuggestions('>', 'From user', [
      ...expectedUsers,
      'Everyone',
      '@here',
    ]);
  }

  async verifyChannelSearchMentionSuggestions(expectedUsers: string[]): Promise<void> {
    await this.verifyChannelSearchSuggestions('~', 'Mentions', [
      ...expectedUsers,
      'Everyone',
      '@here',
    ]);
  }

  async verifyChannelSearchHasSuggestions(): Promise<void> {
    await this.verifyChannelSearchSuggestions('&', 'Has', ['video', 'link', 'image']);
  }

  private async verifyChannelSearchSuggestions(
    trigger: '>' | '~' | '&',
    heading: 'From user' | 'Mentions' | 'Has',
    expectedItems: string[]
  ): Promise<void> {
    await expect(this.selector.searchMessage.input.select).toBeVisible({ timeout: 5000 });
    await this.selector.searchMessage.input.select.click();
    await this.selector.searchMessage.input.select.fill('');
    await this.selector.searchMessage.input.select.pressSequentially(trigger);

    await expect(this.page.getByRole('heading', { name: heading })).toBeVisible({
      timeout: 5000,
    });
    await expect(this.page.getByText('Search for:', { exact: true })).toBeVisible({
      timeout: 5000,
    });

    const suggestionItems = this.selector.searchMessage.select.item;
    for (const item of expectedItems) {
      await expect(suggestionItems.filter({ hasText: item })).toBeVisible({ timeout: 5000 });
    }
  }

  async sendMessageInCurrentChannel(message: string): Promise<void> {
    await this.selector.messageInput.fill(message);
    await this.selector.messageInput.press('Enter');
    await expect(this.selector.messages.filter({ hasText: message }).last()).toBeVisible({
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
      throw new Error(MISSING_AVATAR_SOURCE_ERROR);
    }
    return (await getImageHash(avatarSrc)) ?? '';
  }

  async leaveAllGroup() {
    const chatList = this.selector.listDMItems;

    try {
      await chatList.first().waitFor({ state: 'visible', timeout: 5000 });
    } catch {
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
      const leaveGroupButton = group.locator(CLOSE_DM_BUTTON_SELECTOR);

      await leaveGroupButton.first().click({ force: true });
      const confirmLeaveGroupButton = this.page.locator(
        generateE2eSelector('chat.direct_message.leave_group.button')
      );
      await confirmLeaveGroupButton.click();

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
    const leaveGroupButton = group.locator(CLOSE_DM_BUTTON_SELECTOR);

    await leaveGroupButton.click({ force: true });
    const confirmLeaveGroupButton = this.page.locator(
      generateE2eSelector('chat.direct_message.leave_group.button')
    );
    await confirmLeaveGroupButton.click();

    await expect(confirmLeaveGroupButton).toBeHidden({ timeout: 3000 });
  }

  async isChannelPresentOnForwardModal(channelName: string) {
    await expect(this.selector.searchUserOnForwardMessageModal).toBeVisible({ timeout: 5000 });
    await this.selector.searchUserOnForwardMessageModal.fill(channelName);
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
    return this.selector.viewTopicButton.last();
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
    return this.selector.profiles.displayName.innerText();
  }

  async getShortProfileInputSendMessage() {
    return this.selector.profiles.input.sendMessage.getAttribute('placeholder');
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
    await expect(this.selector.profiles.displayName).toBeHidden({ timeout: 2000 });
    await expect(this.selector.profiles.username).toBeHidden({ timeout: 2000 });
    await expect(this.selector.anonymous.anonymousAvatar).toBeVisible({ timeout: 2000 });
  }

  async openAnonymous() {
    await this.page.keyboard.press('Control+Shift+Enter');
    await expect(this.selector.anonymous.anonymousIcon).toBeVisible({ timeout: 5000 });
  }

  async verifyAnonymousIsVisible() {
    await this.selector.anonymous.anonymousIcon.waitFor({ state: 'visible', timeout: 5000 });
  }

  async sendMessageWithAnonymous(message: string): Promise<void> {
    try {
      await this.selector.messageInput.click();
      await this.selector.messageInput.fill(message);
      await this.selector.messageInput.press('Enter');
      await this.page.waitForTimeout(2000);
      await expect(this.selector.messages.filter({ hasText: message }).last()).toBeVisible({
        timeout: 5000,
      });

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
    await expect(this.selector.unpinMessageButton).toBeVisible({ timeout: 3000 });
    await this.selector.unpinMessageButton.click();
    await expect(this.selector.unpinMessageButton).toBeHidden({ timeout: 3000 });
  }

  async unpinMessageFromPinnedList(message: string): Promise<void> {
    await this.selector.displayListPinButton.click();

    const pinnedMessage = this.selector.pinnedMessages.filter({ hasText: message });
    await expect(pinnedMessage).toBeVisible({ timeout: 5000 });
    await pinnedMessage.hover();

    await expect(this.selector.removePinnedMessageButtonFromPinnedList).toBeVisible({
      timeout: 5000,
    });
    await this.selector.removePinnedMessageButtonFromPinnedList.click();

    await expect(this.selector.unpinMessage.button.unpin).toBeVisible({ timeout: 5000 });
    await this.selector.unpinMessage.button.unpin.click();
    await expect(this.selector.unpinMessage.button.unpin).toBeHidden({ timeout: 5000 });
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
    await expect(this.selector.markAsUnreadButton).toBeVisible({ timeout: 3000 });
    await this.selector.markAsUnreadButton.click();
    await expect(this.selector.markAsUnreadButton).toBeHidden({ timeout: 3000 });
  }

  async getHeaderDM() {
    return this.selector.headerDM.first();
  }

  async openTimelineTab() {
    await this.selector.timelines.buttons.openTab.click();
    await expect(this.selector.timelines.buttons.create).toBeVisible({ timeout: 5000 });
  }

  async fillTitleAndDescription(data: { title: string; description: string }) {
    await this.selector.timelines.buttons.create.click();
    await expect(this.selector.timelines.modalInput.eventTitle).toBeVisible({ timeout: 3000 });
    await this.selector.timelines.modalInput.eventTitle.fill(data.title);
    await this.selector.timelines.modalInput.eventDescription.fill(data.description);
    return this.selector.timelines.modalInput.eventDate.inputValue();
  }

  async clickSave() {
    await this.selector.timelines.buttons.saveModal.click();
  }

  getMonthShort(month: number) {
    return new Date(0, month - 1).toLocaleString('en-US', { month: 'short' }).toUpperCase();
  }

  async verifyEventIsVisibleOnTab(data: { title: string; description: string }, date: string) {
    const [year, month, day] = date.split('-');
    const dateLocator = this.selector.timelines.eventTime.day.first();
    const monthLocator = this.selector.timelines.eventTime.month.first();
    const yearLocator = this.selector.timelines.eventTime.year.first();
    const formatMonth = this.getMonthShort(Number(month));
    const titleLocator = this.selector.timelines.eventDetail.name.first();
    const descriptionLocator = this.selector.timelines.eventDetail.description.first();

    await expect(dateLocator).toContainText(day, { timeout: 1000 });
    await expect(monthLocator).toContainText(formatMonth, { timeout: 1000 });
    await expect(yearLocator).toContainText(year, { timeout: 1000 });
    await expect(titleLocator).toContainText(data.title, { timeout: 1000 });
    await expect(descriptionLocator).toContainText(data.description, { timeout: 1000 });

    return titleLocator;
  }

  async openTimelineEventDetail(eventLocator: Locator) {
    await eventLocator.click();
    await expect(this.selector.timelines.buttons.editTitle).toBeVisible({ timeout: 3000 });
  }

  async updatetimeline() {
    const unique = Date.now().toString(36);
    const data = {
      title: `Timeline-title-${unique}`.slice(0, 20),
      description: `Timeline-description-${unique}`.slice(0, 20),
    };
    const editTitleButton = this.selector.timelines.buttons.editTitle;
    const addDescriptionButton = this.selector.timelines.buttons.addDescription;
    const inputTitle = this.selector.timelines.input.title;
    const inputDescription = this.selector.timelines.input.description;
    await editTitleButton.click();
    await expect(inputTitle).toBeVisible({ timeout: 3000 });
    await inputTitle.fill(data.title);
    await expect(inputTitle).toHaveValue(data.title);
    await addDescriptionButton.click();
    await expect(inputDescription).toBeVisible({ timeout: 3000 });
    await inputDescription.fill(data.description);
    await expect(inputDescription).toHaveValue(data.description);

    await this.selector.timelines.buttons.save.click();
    await expect(inputTitle).toBeHidden({ timeout: 3000 });
    await this.selector.timelines.buttons.back.click();
    return data;
  }

  async openCalendar() {
    await this.selector.timelines.buttons.openCalendar.click();
    await expect(this.selector.timelines.buttons.selectedYear.first()).toBeVisible({
      timeout: 3000,
    });
  }

  async getSelectedYear(): Promise<string> {
    const year = await this.selector.timelines.buttons.selectedYear.first().textContent();
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

    const titleLocator = this.selector.timelines.card.title.filter({
      hasText: data.title,
    });

    const descriptionLocator = this.selector.timelines.card.description.filter({
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
  }

  async openCreatePoll() {
    await this.selector.polls.button.openModal.click();
    await this.selector.polls.button.option.filter({ hasText: 'Create Poll' }).first().click();
    await expect(this.selector.polls.modal.input.question).toBeVisible();
  }

  async createPoll(question: string, answers: string[], allowMulti = false) {
    await this.selector.polls.modal.input.question.fill(question);
    for (let i = 0; i < answers.length; i++) {
      if (i > 0) {
        await this.selector.polls.modal.button.addAnswer.click();
      }

      await this.selector.polls.modal.input.answer.nth(i).fill(answers[i]);
    }

    if (allowMulti) {
      await this.selector.polls.modal.input.allowMultiAnswer.click();
    }
    await this.selector.polls.modal.button.post.click();
  }

  async verifyPollCard(question: string, answers: string[]) {
    const pollCard = this.selector.polls.card;

    await expect(pollCard.question).toHaveText(question);

    for (let i = 0; i < answers.length; i++) {
      await expect(pollCard.answer.nth(i)).toHaveText(answers[i]);
    }

    await expect(pollCard.totalVotes).toBeVisible();
    await expect(pollCard.button.vote).toBeVisible();
  }

  async votePollByIndex(answerIndex: number) {
    const answer = this.selector.polls.card.answer.nth(answerIndex);
    await expect(answer).toBeVisible();
    await answer.click();

    await this.selector.polls.card.button.vote.click();
  }

  async verifyUserVoted(index: number) {
    const answer = this.selector.polls.card.answer.nth(index);
    const voted = answer.locator(this.selector.polls.card.voted);
    await expect(voted).toBeVisible({ timeout: 3000 });
    const removeVoteBtn = this.selector.polls.card.button.removeVote;
    await expect(removeVoteBtn).toBeVisible();
  }

  async endPoll() {
    await this.selector.polls.card.question.first().click({ button: 'right' });
    await this.selector.polls.button.endPoll.click();
    await expect(this.selector.polls.card.ended).toBeVisible({ timeout: 5000 });
  }

  async verifyEndPollOptionVisible() {
    await this.selector.polls.card.question.first().click({ button: 'right' });
    const endPollButton = this.selector.polls.button.endPoll;
    return await endPollButton.isVisible({ timeout: 1000 });
  }

  async verifyPollEnded() {
    await expect(this.selector.polls.card.ended).toBeVisible();
  }

  async openSharedFiles(): Promise<void> {
    await this.selector.headerGalleryButton.click();
    const filesTab = this.page.locator('[data-e2e="chat-channel_message-header-button-file"]');
    await expect(filesTab).toBeVisible({ timeout: 5000 });
    await filesTab.click();
    await expect(this.selector.sharedFiles.item.first()).toBeVisible({ timeout: 5000 });
  }

  async verifySharedFileExists(fileName: string, sharedBy?: string): Promise<void> {
    const fileItem = this.selector.sharedFiles.item
      .filter({ has: this.selector.sharedFiles.fileName.filter({ hasText: fileName }) })
      .last();

    await expect(fileItem).toBeVisible({ timeout: 5000 });
    await expect(fileItem.locator(this.selector.sharedFiles.fileName)).toHaveText(fileName);

    const sharedDetails = fileItem.locator(this.selector.sharedFiles.byTime);
    await expect(sharedDetails).toBeVisible();
    if (sharedBy) {
      await expect(sharedDetails).toContainText(`Shared by ${sharedBy}`);
    }
  }

  async clickShareContactButtonOnShortProfile() {
    const shareContactButton = this.page.locator(
      generateE2eSelector('short_profile.action.button.share_contact')
    );
    await expect(shareContactButton).toBeVisible({ timeout: 3000 });
    await shareContactButton.click();
  }
}
