import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';
import MessageActionSelector from './MessageActionSelector';
import MessageInboxSelector from './MessageInboxSelector';
import MessagePollSelector from './MessagePollSelector';
import MessageContactSelector from './MessageContactSelector';
import MessageTimelineSelector from './MessageTimelineSelector';
import MessageMediaSelector from './MessageMediaSelector';
import MessageShortProfileSelector from './MessageShortProfileSelector';

const DM_CHAT_LIST_SELECTOR = generateE2eSelector('chat.direct_message.chat_list');
const DM_GROUP_NAME_SELECTOR = generateE2eSelector('chat.direct_message.chat_item.group_name');
const AVATAR_IMAGE_SELECTOR = generateE2eSelector('avatar.image');
const DM_HEADER_LEFT_SELECTOR = generateE2eSelector('chat.direct_message.header.left_container');
const TOPIC_BOX_SELECTOR = generateE2eSelector('discussion.box.topic');
const MESSAGE_ITEM_SELECTOR = generateE2eSelector('message.item');
const DISPLAY_NAME_SELECTOR = generateE2eSelector('base_profile.display_name');

export default class MessageSelector {
  constructor(private readonly page: Page) {}

  readonly actions = new MessageActionSelector(this.page);
  readonly inbox = new MessageInboxSelector(this.page);
  readonly polls = new MessagePollSelector(this.page);
  readonly contacts = new MessageContactSelector(this.page);
  readonly timelines = new MessageTimelineSelector(this.page);
  readonly media = new MessageMediaSelector(this.page);
  readonly profiles = new MessageShortProfileSelector(this.page);

  buttonCreateGroupSidebar = this.page.locator(
    generateE2eSelector('chat.direct_message.button.button_plus')
  );
  user = this.page
    .locator(DM_CHAT_LIST_SELECTOR)
    .filter({
      has: this.page.locator(generateE2eSelector('chat.direct_message.chat_item.username')),
    })
    .first();
  addUserButton = this.page.locator(generateE2eSelector('chat.direct_message.button.add_user'));
  listDMItems = this.page.locator(DM_CHAT_LIST_SELECTOR);
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
  firstUserNameAddDM = this.page.locator(DISPLAY_NAME_SELECTOR).nth(0);
  userNamesInDM = this.page.locator(generateE2eSelector('chat.direct_message.chat_item.username'));
  groupNamesInDM = this.page.locator(DM_GROUP_NAME_SELECTOR);
  group = this.page
    .locator(DM_CHAT_LIST_SELECTOR)
    .filter({
      has: this.page.locator(DM_GROUP_NAME_SELECTOR),
    })
    .first();
  secondClan = this.page.locator('div[title]').nth(1);
  messages = this.page.locator(MESSAGE_ITEM_SELECTOR);
  inviteCard = {
    button: {
      gotoClan: this.page.locator(generateE2eSelector('invite_card.button.goto_clan')),
    },
  };
  leaveGroupButton = this.group.locator(
    generateE2eSelector('chat.direct_message.chat_item.close_dm_button')
  );
  confirmLeaveGroupButton = this.page.locator(
    generateE2eSelector('chat.direct_message.leave_group.button')
  );
  messagesInTopic = this.page.locator('.thread-scroll .text-theme-message');
  editGroupButton = this.page.locator(generateE2eSelector('chat.direct_message.edit_group.button'));
  groupNameInput = this.page.locator('input[placeholder="Enter group name"]');
  saveGroupNameButton = this.page.locator(generateE2eSelector('button.base'), {
    hasText: 'Save',
  });
  leaveGroupButtonInPopup = this.page.locator(
    generateE2eSelector('chat.direct_message.menu.leave_group.button')
  );
  pinMessageButton = this.actions.pin;
  unpinMessageButton = this.actions.unpin;
  addToInboxButton = this.actions.addToInbox;
  markAsUnreadButton = this.actions.markUnread;
  confirmPinMessageButton = this.actions.confirmPin;
  topicDiscussionButton = this.actions.topicDiscussion;
  copyTextButton = this.actions.copyText;
  deleteMessageButton = this.actions.delete;
  editMessageButton = this.actions.edit;

  forwardMessageButton = this.actions.forward;
  forwardAllMessagesButton = this.actions.forwardAll;
  createThreadButton = this.actions.createThread;
  confirmDeleteMessageButton = this.actions.confirmDelete;
  displayListPinButton = this.page.locator(
    generateE2eSelector('chat.channel_message.header.button.pin')
  );
  footerAvatar = this.page.locator(
    `${generateE2eSelector('footer_profile.avatar')} ${AVATAR_IMAGE_SELECTOR}`
  );
  pinnedMessages = this.page.locator(generateE2eSelector('common.pin_message'));
  welcomeDM = this.page.locator(generateE2eSelector('chat_welcome'));
  welcomeDMAvatar = this.welcomeDM.locator(AVATAR_IMAGE_SELECTOR);
  headerDM = this.page.locator(DM_HEADER_LEFT_SELECTOR);
  headerDMAvatar = this.page.locator(`${DM_HEADER_LEFT_SELECTOR} ${AVATAR_IMAGE_SELECTOR}`);
  invoiceStatusDMHeader = this.page.locator(
    generateE2eSelector('chat.direct_message.header.left_container.in_voice_status')
  );
  invoiceStatusFriendList = this.page.locator(
    generateE2eSelector('chat.direct_message.chat_item.in_voice_status')
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
  directMessageItemOnSidebar = this.page.locator(
    generateE2eSelector('chat.direct_message.side_bar.item')
  );
  modalForwardMessage = this.page.locator(generateE2eSelector('modal.forward_message'));
  searchUserOnForwardMessageModal = this.page.locator(
    generateE2eSelector('modal.forward_message.input.search')
  );
  cancelForwardMessageButton = this.page.locator(
    generateE2eSelector('modal.forward_message.button.cancel')
  );
  sendForwardMessageButton = this.page.locator(
    generateE2eSelector('modal.forward_message.button.send')
  );
  searchModal = this.page.locator(generateE2eSelector('modal.search'));
  searchInput = this.page.locator(`${generateE2eSelector('modal.search.input')} input`);
  searchTriggerButton = this.page.locator(generateE2eSelector('chat.direct_message.button.search'));
  searchMessage = {
    button: {
      select: this.page.locator(generateE2eSelector('chat.search_message.button.select')),
      previous: this.page.locator(generateE2eSelector('button.previous')),
      next: this.page.locator(generateE2eSelector('button.next')),
    },
    input: {
      select: this.page.locator(generateE2eSelector('chat.search_message.input.select')),
    },
    select: {
      item: this.page.locator(generateE2eSelector('chat.search_message.select.item')),
    },
  };
  messageInput = this.page.locator(generateE2eSelector('mention.input'));
  emojiButton = this.page.locator(generateE2eSelector('mention.button.emoji'));
  stickerButton = this.page.locator(generateE2eSelector('mention.button.sticker'));
  inboxMessages = this.page.locator(
    `${generateE2eSelector('chat.channel_message.inbox.mentions')} div[class*="w-full"][class*="text-theme-message"]`
  );
  topicBox = this.page.locator(TOPIC_BOX_SELECTOR);
  topicInput = this.page.locator(`${TOPIC_BOX_SELECTOR} ${generateE2eSelector('mention.input')}`);
  topicMessages = this.page.locator(`${TOPIC_BOX_SELECTOR} ${MESSAGE_ITEM_SELECTOR}`);
  hoverEditMessageButton = this.page.locator(
    `${generateE2eSelector('chat.hover_message_actions.button.base')}[title="Edit"]`
  );
  viewTopicButton = this.page.locator(generateE2eSelector('chat.topic.button.view_topic'));
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
  removePinnedMessageButtonFromPinnedList = this.page.locator(
    generateE2eSelector('common.pin_message.button.remove_pin')
  );
  topicDiscussionMessageButton = this.page
    .locator(generateE2eSelector('chat.message_action_modal.button.base'))
    .filter({ hasText: 'Topic Discussion' });
  systemMessages = this.page.locator(generateE2eSelector('chat.system_message'));
  messageActionModalItems = this.page.locator(
    generateE2eSelector('chat.message_action_modal.button.base')
  );
  displayNameOnMessageChannel = this.page.locator(
    `${MESSAGE_ITEM_SELECTOR} ${DISPLAY_NAME_SELECTOR}`
  );
  displayNameOnMessageTopic = this.page.locator(`${TOPIC_BOX_SELECTOR} ${DISPLAY_NAME_SELECTOR}`);
  headerInboxButton = this.page.locator(
    generateE2eSelector('chat.channel_message.header.button.inbox')
  );
  headerChatButton = this.page.locator(
    generateE2eSelector('chat.channel_message.header.button.chat')
  );
  topicNumberReplies = this.page.locator(generateE2eSelector('chat.topic.number_replies'));
  chatListContainer = this.page.locator(
    generateE2eSelector('chat.direct_message.chat_list_container')
  );
  canvasMessage = this.page.locator(generateE2eSelector('message.hashtag.canvas'));
  secondarySideBar = {
    member: {
      item: this.page.locator(generateE2eSelector('clan_page.secondary_side_bar.member')),
      inVoice: this.page.locator(
        generateE2eSelector('clan_page.secondary_side_bar.member.in_voice')
      ),
    },
  };
  avatar = this.page.locator(AVATAR_IMAGE_SELECTOR);
  displayName = this.page.locator(DISPLAY_NAME_SELECTOR);
  hoverMessageModal = this.page.locator(generateE2eSelector('chat.hover_message_actions'));
  errorModal = this.page.locator(generateE2eSelector('clan_page.settings.modal.permission'));
  headerGalleryButton = this.page.locator(
    generateE2eSelector('chat.channel_message.header.button.gallery')
  );
  sharedFiles = {
    item: this.page.locator(generateE2eSelector('chat.channel_message.header.button.file.item')),
    fileName: this.page.locator(
      generateE2eSelector('chat.channel_message.header.button.file.item.file_name')
    ),
    byTime: this.page.locator(
      generateE2eSelector('chat.channel_message.header.button.file.item.by_time')
    ),
  };
  waveToSayHiButton = this.page.locator(generateE2eSelector('chat.button.wave_to_say_hi'));

  readonly anonymous = {
    anonymousIcon: this.page.locator(generateE2eSelector('chat.anonymous')),
    anonymousMessage: this.page.locator(generateE2eSelector('base_profile.anonymous')),
    anonymousAvatar: this.page.locator(generateE2eSelector('base_profile.anonymous.avatar')),
    anonymousName: this.page.locator(DISPLAY_NAME_SELECTOR, {
      hasText: 'Anonymous',
    }),
  };

  readonly shortProfile = {
    avatar: this.profiles.avatar,
    displayName: this.profiles.displayName,
    username: this.profiles.username,
    input: this.profiles.input,
    button: this.profiles.button,
    popoverRole: this.profiles.rolePopover,
    itemRole: this.profiles.role.name,
    itemRoleColor: this.profiles.role.color,
  };

  readonly repliedMessage = {
    item: this.page.locator(generateE2eSelector('replied_message.item')),
    username: this.page.locator(generateE2eSelector('replied_message.username')),
  };

  readonly gifsMessage = {
    button: this.media.gifs.button,
    popover: {
      gifTrending: this.media.gifs.popover.trending,
      gifCategory: this.media.gifs.popover.category,
      gifItem: this.media.gifs.popover.item,
    },
  };

  readonly galleryModal = this.media.gallery;

  readonly topicInboxPopover = this.inbox.topics;

  readonly messageInboxPopover = this.inbox.messages;

  readonly forYouInboxPopover = this.inbox.forYou;

  readonly shareContact = this.contacts;

  mentionUser = this.page.locator(generateE2eSelector('chat.channel_message.mention_user'));

  readonly timeline = this.timelines;

  readonly poll = this.polls;

  readonly unpinMessage = {
    button: {
      cancel: this.page.locator(generateE2eSelector('modal.unpin_message.button.cancel')),
      unpin: this.page.locator(generateE2eSelector('modal.unpin_message.button.unpin')),
    },
  };

  readonly forYouMessage = this.inbox.forYou.item;
}
