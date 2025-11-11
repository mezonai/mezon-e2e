import { ROUTES } from '@/selectors';
import { DirectMessageHelper } from '@/utils/directMessageHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { getImageHash } from '@/utils/images';
import { FileSizeTestHelpers, UploadType } from '@/utils/uploadFileHelpers';
import { expect, Locator, Page } from '@playwright/test';
import sleep from '@utils/sleep';
import { ProfilePage } from './ProfilePage';

export class MessagePage {
  private helpers: DirectMessageHelper;
  readonly page: Page;
  readonly user: Locator;
  readonly listDMItems: Locator;
  readonly addUserButton: Locator;
  readonly userItem: Locator;
  readonly friendItems: Locator;
  readonly friendListItems: Locator;
  readonly friendUsernames: Locator;
  readonly createGroupButton: Locator;
  readonly userNameItem: Locator;
  readonly addToGroupButton: Locator;
  readonly sumMember: Locator;
  readonly memberCount: Locator;
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
  readonly pinMessageButton: Locator;
  readonly confirmPinMessageButton: Locator;
  readonly deleteMessageButton: Locator;
  readonly confirmDeleteMessageButton: Locator;
  readonly displayListPinButton: Locator;
  readonly footerAvatar: Locator;
  readonly pinnedMessages: Locator;
  readonly welcomeDM: Locator;
  readonly welcomeDMAvatar: Locator;
  readonly headerDMAvatar: Locator;
  readonly headerUserProfileButton: Locator;
  readonly groupName: Locator;
  readonly dmHeaderCallAction: Locator;
  readonly dmHeaderAddMemberAction: Locator;
  readonly dmHeaderVideoCallAction: Locator;
  readonly editMessageButton: Locator;
  readonly forwardMessageButton: Locator;
  readonly editGroupModal: Locator;
  readonly messageInput: Locator;
  readonly messageBuzzHeader: Locator;
  readonly messageBuzzButtonClose: Locator;
  readonly messageBuzzButtonSend: Locator;
  readonly messageBuzzInputMessage: Locator;
  readonly inboxMessages: Locator;
  readonly directMessageBlockButton: Locator;
  readonly directMessageUnblockButton: Locator;
  readonly modalForwardMessage: Locator;
  readonly searchUserOnForwardMessageModal: Locator;
  readonly cancelForwardMessageButton: Locator;
  readonly searchModal: Locator;
  readonly searchInput: Locator;
  readonly searchTriggerButton: Locator;
  readonly topicInput: Locator;
  readonly topicMessages: Locator;
  readonly hoverEditMessageButton: Locator;
  readonly viewTopicButoon: Locator;
  readonly closeTopicBoxButton: Locator;
  readonly pinBadge: Locator;
  readonly jumpToPinnedMessageButtonFromSystemMessage: Locator;
  readonly jumpToPinnedMessageButtonFromPinnedList: Locator;
  readonly topicDiscussionMessageButton: Locator;
  readonly systemMessages: Locator;
  readonly messageActionModalItems: Locator;
  readonly displayNameOnMessageChannel: Locator;
  readonly displayNameOnMessageTopic: Locator;
  readonly headerInboxButton: Locator;
  readonly topicNumberReplies: Locator;
  readonly chatListContainer: Locator;
  readonly group: Locator;
  

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
    this.listDMItems = page.locator(generateE2eSelector('chat.direct_message.chat_list'));
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
    this.closeFirstDMButton = this.user.locator(
      generateE2eSelector('chat.direct_message.chat_item.close_dm_button')
    );
    this.friendListItems = page.locator(
      generateE2eSelector('chat.direct_message.friend_list.all_friend')
    );
    this.firstUserAddDM = this.page
      .locator(generateE2eSelector('chat.direct_message.friend_list.all_friend'))
      .nth(0);
    this.firstUserNameAddDM = this.page
      .locator(generateE2eSelector('base_profile.display_name'))
      .nth(1);
    this.userNamesInDM = page.locator(
      generateE2eSelector('chat.direct_message.chat_item.username')
    );
    this.group = this.page
      .locator(generateE2eSelector('chat.direct_message.chat_list'))
      .filter({ has: this.page.locator('p', { hasText: 'Members' }) })
      .first();
    this.secondClan = this.page.locator('div[title]').nth(1);
    this.messages = this.page.locator(generateE2eSelector('message.item'));
    this.leaveGroupButton = this.group.locator(
      generateE2eSelector('chat.direct_message.chat_item.close_dm_button')
    );
    this.confirmLeaveGroupButton = this.page.locator(
      generateE2eSelector('chat.direct_message.leave_group.button')
    );
    this.messagesInTopic = page.locator('.thread-scroll .text-theme-message');
    this.memberListInGroup = page.locator(
      generateE2eSelector('chat.direct_message.member_list.member_count')
    );
    this.editGroupButton = page.locator(
      generateE2eSelector('chat.direct_message.edit_group.button')
    );
    this.groupNameInput = page.locator('input[placeholder="Enter group name"]');
    this.saveGroupNameButton = page.locator(generateE2eSelector('button.base'), {
      hasText: 'Save',
    });
    this.leaveGroupButtonInPopup = page.locator(
      generateE2eSelector('chat.direct_message.menu.leave_group.button')
    );
    this.pinMessageButton = page
      .locator(generateE2eSelector('chat.message_action_modal.button.base'))
      .filter({ hasText: 'Pin message' });
    this.confirmPinMessageButton = page.locator(
      generateE2eSelector('chat.message_action_modal.confirm_modal.button.confirm'),
      { hasText: 'Oh yeah. Pin it' }
    );
    this.deleteMessageButton = page
      .locator(generateE2eSelector('chat.message_action_modal.button.base'))
      .filter({ hasText: 'Delete Message' });

    this.editMessageButton = page
      .locator(generateE2eSelector('chat.message_action_modal.button.base'))
      .filter({ hasText: 'Edit Message' });

    this.forwardMessageButton = page
      .locator(generateE2eSelector('chat.message_action_modal.button.base'))
      .filter({ hasText: 'Forward Message' });

    this.confirmDeleteMessageButton = page.locator(
      generateE2eSelector('chat.message_action_modal.confirm_modal.button.confirm'),
      { hasText: 'Delete' }
    );
    this.displayListPinButton = page.locator(
      generateE2eSelector('chat.channel_message.header.button.pin')
    );
    this.footerAvatar = page.locator(
      `${generateE2eSelector('footer_profile.avatar')} ${generateE2eSelector('avatar.image')}`
    );
    this.pinnedMessages = page.locator(generateE2eSelector('common.pin_message'));
    this.welcomeDM = page.locator(generateE2eSelector('chat_welcome'));
    this.welcomeDMAvatar = this.welcomeDM.locator(generateE2eSelector('avatar.image'));
    this.headerDMAvatar = this.page.locator(
      `${generateE2eSelector('chat.direct_message.header.left_container')} ${generateE2eSelector('avatar.image')}`
    );
    this.headerUserProfileButton = this.page.locator(
      `${generateE2eSelector('chat.direct_message.header.right_container.user_profile')}`
    );
    this.groupName = page.locator(generateE2eSelector('chat.direct_message.chat_item.namegroup'));

    this.dmHeaderCallAction = page.locator(
      generateE2eSelector('chat.direct_message.header.right_container.call')
    );
    this.dmHeaderAddMemberAction = page.locator(
      generateE2eSelector('chat.direct_message.header.right_container.add_member')
    );
    this.dmHeaderVideoCallAction = page.locator(
      generateE2eSelector('chat.direct_message.header.right_container.video_call')
    );
    this.editGroupModal = page.locator(generateE2eSelector('chat.direct_message.edit_group'));
    this.messageBuzzHeader = page.locator(
      generateE2eSelector('chat.direct_message.message_buzz.header')
    );
    this.messageBuzzButtonClose = page.locator(
      generateE2eSelector('chat.direct_message.message_buzz.button.close')
    );
    this.messageBuzzButtonSend = page.locator(
      generateE2eSelector('chat.direct_message.message_buzz.button.send')
    );
    this.messageBuzzInputMessage = page.locator(
      generateE2eSelector('chat.direct_message.message_buzz.input.message')
    );
    this.directMessageBlockButton = page.locator(
      generateE2eSelector('chat.direct_message.block.button')
    );
    this.directMessageUnblockButton = page.locator(
      generateE2eSelector('chat.direct_message.unblock.button')
    );
    this.modalForwardMessage = page.locator(generateE2eSelector('modal.forward_message'));
    this.searchUserOnForwardMessageModal = page.locator(
      generateE2eSelector('modal.forward_message.input.search')
    );
    this.cancelForwardMessageButton = page.locator(
      generateE2eSelector('modal.forward_message.button.cancel')
    );
    this.searchModal = page.locator(generateE2eSelector('modal.search'));
    this.searchInput = page.locator(`${generateE2eSelector('modal.search.input')} input`);
    this.searchTriggerButton = page.locator(
      generateE2eSelector('chat.direct_message.button.search')
    );
    this.messageInput = this.page.locator(generateE2eSelector('mention.input'));
    this.inboxMessages = this.page.locator(
      `${generateE2eSelector('chat.channel_message.inbox.mentions')} div[class*="w-full"][class*="text-theme-message"]`
    );
    this.topicInput = this.page.locator(
      `${generateE2eSelector('discussion.box.topic')} ${generateE2eSelector('mention.input')}`
    );
    this.topicMessages = this.page.locator(
      `${generateE2eSelector('discussion.box.topic')} ${generateE2eSelector('message.item')}`
    );
    this.hoverEditMessageButton = page.locator(
      `${generateE2eSelector('chat.hover_message_actions.button.base')}[title="Edit"]`
    );
    this.viewTopicButoon = this.page.locator(generateE2eSelector('chat.topic.button.view_topic'));
    this.closeTopicBoxButton = this.page.locator(
      generateE2eSelector('chat.topic.header.button.close')
    );
    this.pinBadge = page.locator(
      generateE2eSelector('chat.channel_message.header.button.pin.pin_badge')
    );
    this.jumpToPinnedMessageButtonFromSystemMessage = page.locator(
      generateE2eSelector('chat.system_message.pin_message.button.jump_to_message')
    );
    this.jumpToPinnedMessageButtonFromPinnedList = page.locator(
      generateE2eSelector('common.pin_message.button.jump')
    );
    this.topicDiscussionMessageButton = page
      .locator(generateE2eSelector('chat.message_action_modal.button.base'))
      .filter({ hasText: 'Topic Discussion' });
    this.systemMessages = this.page.locator(generateE2eSelector('chat.system_message'));
    this.messageActionModalItems = page.locator(
      generateE2eSelector('chat.message_action_modal.button.base')
    );;
    this.displayNameOnMessageChannel = this.page.locator(
      `${generateE2eSelector('message.item')} ${generateE2eSelector('base_profile.display_name')}`
    );
    this.displayNameOnMessageTopic = this.page.locator(
      `${generateE2eSelector('discussion.box.topic')} ${generateE2eSelector('base_profile.display_name')}`
    );
    this.headerInboxButton = this.page.locator(
      generateE2eSelector('chat.channel_message.header.button.inbox')
    );
    this.topicNumberReplies = this.page.locator(generateE2eSelector('chat.topic.number_replies'));
    this.chatListContainer = page.locator(
      generateE2eSelector('chat.direct_message.chat_list_container')
    );
    
  }

  async getFirstMessage(): Promise<Locator> {
    return this.messages.first();
  }

  async createDM(): Promise<string> {
    try {
      await this.buttonCreateGroupSidebar.click();

      const firstUser = (await this.userItem.first().innerText()).trim();
      await this.userItem.hover();
      await this.userItem.click();
      await this.createGroupButton.click();

      return firstUser;
    } catch (error) {
      console.error('Error creating DM:', error);
      throw error;
    }
  }

  async createDMByName(userName: string): Promise<void> {
    try {
      await this.buttonCreateGroupSidebar.click();
      await expect(this.friendItems.filter({ hasText: userName })).toBeVisible({ timeout: 5000 });
      await this.friendItems.filter({ hasText: userName }).first().hover();
      await this.friendItems.filter({ hasText: userName }).first().click();
      await this.createGroupButton.click();
    } catch (error) {
      console.error('Error creating DM:', error);
      throw error;
    }
  }

  async isDMCreated(): Promise<boolean> {
    await this.userNamesInDM.first().waitFor({ state: 'visible', timeout: 5000 });
    return (await this.userNamesInDM.allInnerTexts()).some(
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
    await this.editGroupButton.click();
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

    const groupName = await this.groupName.innerText();
    if (!groupName) return false;
    const containsFirst = !!this.firstUserNameText && groupName.includes(this.firstUserNameText);
    const containsSecond = !!this.secondUserNameText && groupName.includes(this.secondUserNameText);
    return containsFirst || containsSecond;
  }

  async addMoreMemberToGroup(): Promise<void> {
    await this.group.click();
    await this.addUserButton.click();
    await this.page.waitForTimeout(5000);
    await this.userItem.click();
    this.userNameItemText = (await this.userNameItem.textContent()) ?? '';
    await this.addToGroupButton.click();
    await this.page.waitForTimeout(3000);
  }

  async getMemberCount(): Promise<number> {
    await this.group.click();
    await this.sumMember.click();

    const memberItems = this.memberCount;
    return await memberItems.count();
  }

  async isMemberAdded(previousCount: number): Promise<boolean> {
    const start = Date.now();
    let newCount = previousCount;
    while (Date.now() - start < 8000) {
      await this.group.click();
      await this.sumMember.click();
      newCount = await this.memberCount.count();
      if (newCount >= previousCount + 1) return true;
      await this.page.waitForTimeout(3000);
    }

    const names = (await this.memberListInGroup.allTextContents())
      .flatMap(t => t.split(','))
      .map(s => s.trim())
      .filter(Boolean);
    return !!this.userNameItemText && names.some(n => n.includes(this.userNameItemText));
  }

  async closeDM(username: string): Promise<void> {
    const user = await this.page
      .locator(generateE2eSelector('chat.direct_message.chat_list'))
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
    const count = await this.userNamesInDM.count();
    for (let i = 0; i < count; i++) {
      const text = (await this.userNamesInDM.nth(i).innerText()).trim();
      if (text === username) {
        return false;
      }
    }
    return true;
  }

  async leaveGroupByXBtn(): Promise<string> {
    const rawText = await this.group.innerText();
    const groupName = rawText.split('\n')[0].trim();

    await this.group.hover();
    await this.leaveGroupButton.click({ force: true });
    await this.confirmLeaveGroupButton.click();

    return groupName;
  }

  async leaveGroupByLeaveGroupBtn(): Promise<void> {
    await this.group.dispatchEvent('contextmenu');
  }

  async getFriendItemFromFriendList(friendName: string): Promise<Locator> {
    return this.friendListItems.filter({ hasText: friendName }).first();
  }

  async createDMWithFriendName(friendName: string): Promise<void> {
    const friendItem = this.friendListItems.filter({ hasText: friendName }).first();
    await friendItem.click();
    await this.page.waitForTimeout(500);
  }

  async openUserProfile(): Promise<void> {
    await this.headerUserProfileButton.click();
    await this.page.waitForTimeout(500);
  }

  getFriendItemFromListDM(friendName: string): Locator {
    const dmItem = this.listDMItems;
    return dmItem.filter({ hasText: friendName }).first();
  }

  async isLeavedGroup(groupName: string): Promise<boolean> {
    const count = await this.userNamesInDM.count();
    for (let i = 0; i < count; i++) {
      const text = (await this.userNamesInDM.nth(i).innerText()).trim();
      if (text === groupName) {
        return false;
      }
    }
    return true;
  }

  async sendMessage(message: string): Promise<void> {
    this.message = message;
    await this.firstUserAddDM.click();
    await this.messageInput.click();
    await this.messageInput.fill(message);
    await this.messageInput.press('Enter');
  }

  async getMessageWithProfileName(profileName: string): Promise<Locator> {
    return this.messages.filter({ hasText: profileName }).last();
  }

  async sendMessageWhenInDM(message: string): Promise<void> {
    this.message = message;
    await this.messageInput.click();
    await this.messageInput.fill(message);
    await this.messageInput.press('Enter');
  }

  async isMessageSend(): Promise<boolean> {
    const lastMessage = this.messages.last();
    const text = await lastMessage.innerText();

    return text.includes(this.message);
  }

  async updateNameGroupChatDM(groupName: string): Promise<void> {
    this.groupNameText = groupName;

    await this.group.click();
    await this.editGroupButton.click();
    await this.groupNameInput.click();
    await this.groupNameInput.fill('');
    await this.groupNameInput.fill(groupName);
    await this.saveGroupNameButton.click();
  }

  async isGroupNameDMUpdated(): Promise<boolean> {
    const groupName = (await this.groupName.innerText()).trim();
    return groupName === this.groupNameText;
  }

  async pinLastMessage() {
    const lastMessage = this.messages.last();
    await lastMessage.click({ button: 'right' });
    await this.pinMessageButton.click();
    await this.confirmPinMessageButton.click();
  }

  async pinSpecificMessage(messageItem: Locator) {
    await messageItem.click({ button: 'right' });
    await this.pinMessageButton.click();
    await this.confirmPinMessageButton.click();
  }

  async getLastMessageWithProfileName(profileName: string): Promise<Locator> {
    return this.messages.filter({ hasText: profileName }).last();
  }

  async deleteLastMessage() {
    const lastMessage = this.messages.last();
    await expect(lastMessage).toBeVisible({ timeout: 5000 });
    await lastMessage.click({ button: 'right' });
    await this.page.waitForTimeout(1000);
    await this.deleteMessageButton.click();
    await this.page.waitForTimeout(1000);
    await this.confirmDeleteMessageButton.click();
  }

  async isMessageStillPinned(messageIdentity: string): Promise<boolean> {
    await this.displayListPinButton.click();
    const pinnedMessage = this.pinnedMessages.filter({ hasText: messageIdentity });
    return (await pinnedMessage.count()) > 0;
  }

  async editMessage(messageItem: Locator, newText: string) {
    await messageItem.click({ button: 'right' });
    await this.editMessageButton.click();
    const textarea = this.page.locator('#editorReactMentionChannel');
    await textarea.fill(newText);
    await textarea.press('Enter');
    await sleep(1000);
    return this.messages.filter({ hasText: newText });
  }

  async forwardMessage(messageItem: Locator) {
    await messageItem.click({ button: 'right' });
    await this.forwardMessageButton.click();
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
    await this.assertVisibleLocators(this.dmHeaderCallAction);
  }

  async assertDMHeaderVideoCallVisible(): Promise<void> {
    await this.assertVisibleLocators(this.dmHeaderVideoCallAction);
  }

  async assertDMHeaderAddMemberVisible(): Promise<void> {
    await this.assertVisibleLocators(this.dmHeaderAddMemberAction);
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
    await this.assertNotVisibleLocators(this.dmHeaderCallAction);
  }

  async assertDMHeaderVideoCallNotVisible(): Promise<void> {
    await this.assertNotVisibleLocators(this.dmHeaderVideoCallAction);
  }

  async assertDMHeaderAddMemberNotVisible(): Promise<void> {
    await this.assertNotVisibleLocators(this.dmHeaderAddMemberAction);
  }

  async openGroupFromName(name: string) {
    const messagePage = new MessagePage(this.page);
    const groupLocator = messagePage.userNamesInDM.filter({ hasText: name.slice(0, 15) }).first();
    await expect(groupLocator).toBeVisible({ timeout: 3000 });
    await groupLocator.first().click();
  }

  async updateAvatarForGroup(groupName: string): Promise<void> {
    const fileSizeHelpers = new FileSizeTestHelpers(this.page);

    await this.group.click();
    await this.editGroupButton.click();
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
    await this.groupNameInput.click();
    await this.groupNameInput.fill('');
    await this.groupNameInput.fill(groupName);
    await expect(this.saveGroupNameButton).toBeVisible({ timeout: 3000 });
    await this.saveGroupNameButton.click();
    await expect(this.editGroupModal).toBeHidden({ timeout: 10000 });
  }

  async getAvatarHashOnDMList(groupName: string): Promise<string> {
    const avatarLocator = this.page
      .locator(generateE2eSelector('chat.direct_message.chat_list'), {
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
    const avatarLocator = this.headerDMAvatar;
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
    await this.messages.last().click({ button: 'right' });
    await this.forwardMessageButton.click();
    await expect(this.modalForwardMessage).toBeVisible({ timeout: 5000 });
  }

  async getAvatarHashOnForwardPopup(groupName: string): Promise<string> {
    await expect(this.searchUserOnForwardMessageModal).toBeVisible({ timeout: 5000 });
    await this.searchUserOnForwardMessageModal.fill(groupName);
    await this.page.waitForTimeout(3000);
    const groupItemLocator = this.modalForwardMessage.locator(generateE2eSelector('suggest_item'), {
      hasText: groupName,
    });
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
    await expect(this.searchModal).toBeVisible({
      timeout: 5000,
    });
  }

  async openSearchModalbyClickSearchButton(): Promise<void> {
    await this.searchTriggerButton.click();
    await expect(this.searchModal).toBeVisible({
      timeout: 5000,
    });
  }

  async getAvatarHashOnSearchModal(groupName: string): Promise<string> {
    await expect(this.searchInput).toBeVisible({ timeout: 5000 });
    await this.searchInput.fill(groupName);
    await this.page.waitForTimeout(3000);
    const groupItemLocator = this.searchModal.locator(generateE2eSelector('suggest_item'), {
      hasText: groupName,
    });
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

    const chatList = this.page.locator(generateE2eSelector('chat.direct_message.chat_list'));
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
    await expect(this.searchUserOnForwardMessageModal).toBeVisible({ timeout: 5000 });
    await this.searchUserOnForwardMessageModal.fill(channelName);
    await this.page.waitForTimeout(3000);
    const channelItemLocator = this.modalForwardMessage.locator(
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
    await expect(this.searchInput).toBeVisible({ timeout: 5000 });
    await this.searchInput.fill(channelName);
    await this.page.waitForTimeout(3000);
    const channelItemLocator = this.searchModal.locator(generateE2eSelector('suggest_item'), {
      hasText: channelName,
    });

    try {
      await channelItemLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async closeModalForwardMessage() {
    await this.cancelForwardMessageButton.click();
    await expect(this.searchUserOnForwardMessageModal).toBeHidden({ timeout: 5000 });
  }
}
