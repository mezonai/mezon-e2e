import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class MessageSelector {
  constructor(private readonly page: Page) {
    this.page = page;
  }

  buttonCreateGroupSidebar = this.page.locator(
    generateE2eSelector('chat.direct_message.button.button_plus')
  );
  user = this.page
    .locator(generateE2eSelector('chat.direct_message.chat_list'))
    .filter({ hasNot: this.page.locator('p', { hasText: 'Members' }) })
    .first();
  addUserButton = this.page.locator(generateE2eSelector('chat.direct_message.button.add_user'));
  listDMItems = this.page.locator(generateE2eSelector('chat.direct_message.chat_list'));
  userItem = this.page
    .locator(generateE2eSelector('chat.direct_message.friend_list.friend_item'))
    .first();
  friendItems = this.page.locator(
    generateE2eSelector('chat.direct_message.friend_list.friend_item')
  );
  friendUsernames = this.page.locator(
    generateE2eSelector('chat.direct_message.friend_list.username_friend_item')
  );
  createGroupButton = this.page.locator(
    generateE2eSelector('chat.direct_message.button.create_group')
  );
  userNameItem = this.userItem.locator(
    generateE2eSelector('chat.direct_message.friend_list.username_friend_item')
  );
  addToGroupButton = this.page.locator(generateE2eSelector('chat.direct_message.button.add_user'));
  sumMember = this.page.locator(generateE2eSelector('chat.direct_message.member_list.button'));
  memberCount = this.page.locator(
    generateE2eSelector('chat.direct_message.member_list.member_count')
  );
  closeFirstDMButton = this.user.locator(
    generateE2eSelector('chat.direct_message.chat_item.close_dm_button')
  );
  friendListItems = this.page.locator(
    generateE2eSelector('chat.direct_message.friend_list.all_friend')
  );
  firstUserAddDM = this.page
    .locator(generateE2eSelector('chat.direct_message.friend_list.all_friend'))
    .nth(0);
  firstUserNameAddDM = this.page.locator(generateE2eSelector('base_profile.display_name')).nth(1);
  userNamesInDM = this.page.locator(generateE2eSelector('chat.direct_message.chat_item.username'));
  group = this.page
    .locator(generateE2eSelector('chat.direct_message.chat_list'))
    .filter({ has: this.page.locator('p', { hasText: 'Members' }) })
    .first();
  secondClan = this.page.locator('div[title]').nth(1);
  messages = this.page.locator(generateE2eSelector('message.item'));
  leaveGroupButton = this.group.locator(
    generateE2eSelector('chat.direct_message.chat_item.close_dm_button')
  );
  confirmLeaveGroupButton = this.page.locator(
    generateE2eSelector('chat.direct_message.leave_group.button')
  );
  messagesInTopic = this.page.locator('.thread-scroll .text-theme-message');
  memberListInGroup = this.page.locator(
    generateE2eSelector('chat.direct_message.member_list.member_count')
  );
  editGroupButton = this.page.locator(generateE2eSelector('chat.direct_message.edit_group.button'));
  groupNameInput = this.page.locator('input[placeholder="Enter group name"]');
  saveGroupNameButton = this.page.locator(generateE2eSelector('button.base'), {
    hasText: 'Save',
  });
  leaveGroupButtonInPopup = this.page.locator(
    generateE2eSelector('chat.direct_message.menu.leave_group.button')
  );
  pinMessageButton = this.page
    .locator(generateE2eSelector('chat.message_action_modal.button.base'))
    .filter({ hasText: 'Pin message' });
  confirmPinMessageButton = this.page.locator(
    generateE2eSelector('chat.message_action_modal.confirm_modal.button.confirm'),
    { hasText: 'Oh yeah. Pin it' }
  );

  topicDiscussionButton = this.page
    .locator(generateE2eSelector('chat.message_action_modal.button.base'))
    .filter({ hasText: 'Topic Discussion' });

  copyTextButton = this.page
    .locator(generateE2eSelector('chat.message_action_modal.button.base'))
    .filter({ hasText: 'Copy Text' });

  deleteMessageButton = this.page
    .locator(generateE2eSelector('chat.message_action_modal.button.base'))
    .filter({ hasText: 'Delete Message' });

  editMessageButton = this.page
    .locator(generateE2eSelector('chat.message_action_modal.button.base'))
    .filter({ hasText: 'Edit Message' });

  forwardMessageButton = this.page
    .locator(generateE2eSelector('chat.message_action_modal.button.base'))
    .filter({ hasText: 'Forward Message' });

  createThreadButton = this.page
    .locator(generateE2eSelector('chat.message_action_modal.button.base'))
    .filter({ hasText: 'Create Thread' });

  confirmDeleteMessageButton = this.page.locator(
    generateE2eSelector('chat.message_action_modal.confirm_modal.button.confirm'),
    { hasText: 'Delete' }
  );
  displayListPinButton = this.page.locator(
    generateE2eSelector('chat.channel_message.header.button.pin')
  );
  footerAvatar = this.page.locator(
    `${generateE2eSelector('footer_profile.avatar')} ${generateE2eSelector('avatar.image')}`
  );
  pinnedMessages = this.page.locator(generateE2eSelector('common.pin_message'));
  welcomeDM = this.page.locator(generateE2eSelector('chat_welcome'));
  welcomeDMAvatar = this.welcomeDM.locator(generateE2eSelector('avatar.image'));
  headerDMAvatar = this.page.locator(
    `${generateE2eSelector('chat.direct_message.header.left_container')} ${generateE2eSelector('avatar.image')}`
  );
  headerUserProfileButton = this.page.locator(
    `${generateE2eSelector('chat.direct_message.header.right_container.user_profile')}`
  );
  groupName = this.page.locator(generateE2eSelector('chat.direct_message.chat_item.namegroup'));

  dmHeaderCallAction = this.page.locator(
    generateE2eSelector('chat.direct_message.header.right_container.call')
  );
  dmHeaderAddMemberAction = this.page.locator(
    generateE2eSelector('chat.direct_message.header.right_container.add_member')
  );
  dmHeaderVideoCallAction = this.page.locator(
    generateE2eSelector('chat.direct_message.header.right_container.video_call')
  );
  editGroupModal = this.page.locator(generateE2eSelector('chat.direct_message.edit_group'));
  messageBuzzHeader = this.page.locator(
    generateE2eSelector('chat.direct_message.message_buzz.header')
  );
  messageBuzzButtonClose = this.page.locator(
    generateE2eSelector('chat.direct_message.message_buzz.button.close')
  );
  messageBuzzButtonSend = this.page.locator(
    generateE2eSelector('chat.direct_message.message_buzz.button.send')
  );
  messageBuzzInputMessage = this.page.locator(
    generateE2eSelector('chat.direct_message.message_buzz.input.message')
  );
  directMessageBlockButton = this.page.locator(
    generateE2eSelector('chat.direct_message.block.button')
  );
  directMessageUnblockButton = this.page.locator(
    generateE2eSelector('chat.direct_message.unblock.button')
  );
  modalForwardMessage = this.page.locator(generateE2eSelector('modal.forward_message'));
  searchUserOnForwardMessageModal = this.page.locator(
    generateE2eSelector('modal.forward_message.input.search')
  );
  cancelForwardMessageButton = this.page.locator(
    generateE2eSelector('modal.forward_message.button.cancel')
  );
  searchModal = this.page.locator(generateE2eSelector('modal.search'));
  searchInput = this.page.locator(`${generateE2eSelector('modal.search.input')} input`);
  searchTriggerButton = this.page.locator(generateE2eSelector('chat.direct_message.button.search'));
  messageInput = this.page.locator(generateE2eSelector('mention.input'));
  inboxMessages = this.page.locator(
    `${generateE2eSelector('chat.channel_message.inbox.mentions')} div[class*="w-full"][class*="text-theme-message"]`
  );
  topicInput = this.page.locator(
    `${generateE2eSelector('discussion.box.topic')} ${generateE2eSelector('mention.input')}`
  );
  topicMessages = this.page.locator(
    `${generateE2eSelector('discussion.box.topic')} ${generateE2eSelector('message.item')}`
  );
  hoverEditMessageButton = this.page.locator(
    `${generateE2eSelector('chat.hover_message_actions.button.base')}[title="Edit"]`
  );
  viewTopicButoon = this.page.locator(generateE2eSelector('chat.topic.button.view_topic'));
  closeTopicBoxButton = this.page.locator(generateE2eSelector('chat.topic.header.button.close'));
  pinBadge = this.page.locator(
    generateE2eSelector('chat.channel_message.header.button.pin.pin_badge')
  );
  jumpToPinnedMessageButtonFromSystemMessage = this.page.locator(
    generateE2eSelector('chat.system_message.pin_message.button.jump_to_message')
  );
  jumpToPinnedMessageButtonFromPinnedList = this.page.locator(
    generateE2eSelector('common.pin_message.button.jump')
  );
  topicDiscussionMessageButton = this.page
    .locator(generateE2eSelector('chat.message_action_modal.button.base'))
    .filter({ hasText: 'Topic Discussion' });
  systemMessages = this.page.locator(generateE2eSelector('chat.system_message'));
  messageActionModalItems = this.page.locator(
    generateE2eSelector('chat.message_action_modal.button.base')
  );
  displayNameOnMessageChannel = this.page.locator(
    `${generateE2eSelector('message.item')} ${generateE2eSelector('base_profile.display_name')}`
  );
  displayNameOnMessageTopic = this.page.locator(
    `${generateE2eSelector('discussion.box.topic')} ${generateE2eSelector('base_profile.display_name')}`
  );
  headerInboxButton = this.page.locator(
    generateE2eSelector('chat.channel_message.header.button.inbox')
  );
  topicNumberReplies = this.page.locator(generateE2eSelector('chat.topic.number_replies'));
  chatListContainer = this.page.locator(
    generateE2eSelector('chat.direct_message.chat_list_container')
  );
  secondarySideBar = {
    member: {
      item: this.page.locator(generateE2eSelector('clan_page.secondary_side_bar.member')),
      inVoice: this.page.locator(
        generateE2eSelector('clan_page.secondary_side_bar.member.in_voice')
      ),
    },
  };
}
