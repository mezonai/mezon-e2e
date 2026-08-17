import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Locator, Page } from '@playwright/test';
import ClanMemberSelector from './ClanMemberSelector';
import ClanChannelSelector from './ClanChannelSelector';
import ClanEventSelector from './ClanEventSelector';
import ClanOnboardingSelector from './ClanOnboardingSelector';
import ClanSettingSelector from './ClanSettingSelector';

const CREATE_CLAN_MODAL_SELECTOR = generateE2eSelector('clan_page.modal.create_clan');
const BASE_BUTTON_SELECTOR = generateE2eSelector('button.base');
const CLAN_HEADER_MENU_ITEM_SELECTOR = generateE2eSelector('clan_page.header.modal_panel.item');
const MENTION_INPUT_SELECTOR = generateE2eSelector('mention.input');
const TOPIC_BOX_SELECTOR = generateE2eSelector('discussion.box.topic');
const THREAD_BOX_SELECTOR = generateE2eSelector('discussion.box.thread');

export default class ClanSelector {
  constructor(private readonly page: Page) {}

  readonly banner = this.page.locator(generateE2eSelector('clan_page.banner'));

  readonly member = new ClanMemberSelector(this.page);
  readonly channel = new ClanChannelSelector(this.page);
  readonly event = new ClanEventSelector(this.page);
  readonly onboarding = new ClanOnboardingSelector(this.page);
  readonly settings = new ClanSettingSelector(this.page);

  readonly buttons = {
    createClan: this.page.locator(generateE2eSelector('clan_page.side_bar.button.add_clan')),
    clanName: this.page.locator(`${generateE2eSelector('clan_page.header.title.clan_name')} p`),
    createChannel: this.page.locator(generateE2eSelector('clan_page.side_bar.button.add_channel')),
    createClanCancel: this.page.locator(`${CREATE_CLAN_MODAL_SELECTOR} ${BASE_BUTTON_SELECTOR}`, {
      hasText: 'Cancel',
    }),
    createClanConfirm: this.page.locator(`${CREATE_CLAN_MODAL_SELECTOR} ${BASE_BUTTON_SELECTOR}`, {
      hasText: 'Create',
    }),
    createMyOwnClan: this.page.locator(
      generateE2eSelector('clan_page.modal.create_clan.template.item.create_my_own')
    ),
    createTemplateClan: this.page.locator(
      generateE2eSelector('clan_page.modal.create_clan.template.item.name')
    ),
    invitePeopleFromHeaderMenu: this.page.locator(CLAN_HEADER_MENU_ITEM_SELECTOR, {
      hasText: 'Invite People',
    }),
    invitePeople: this.page.locator(
      generateE2eSelector('clan_page.modal.invite_people.user_item.button.invite')
    ),
    closeInviteModal: this.page.locator(BASE_BUTTON_SELECTOR, { hasText: '×' }),
    eventButton: this.page.locator(generateE2eSelector('clan_page.side_bar.button.events')),
    saveChanges: this.page.locator(BASE_BUTTON_SELECTOR, { hasText: 'Save Changes' }),
    exitSettings: this.page.locator(generateE2eSelector('clan_page.settings.button.exit')),
    memberListButton: this.page.locator(generateE2eSelector('clan_page.side_bar.button.members')),
    invitePeopleFromChannel: this.page.locator(
      `${generateE2eSelector('onboarding.chat.guide_sections')} div:has-text("Invite your friends")`
    ),
    channelManagementButton: this.page.locator(
      generateE2eSelector('clan_page.side_bar.button.channels')
    ),
    clanSettings: this.page.locator(CLAN_HEADER_MENU_ITEM_SELECTOR, {
      hasText: 'Clan Settings',
    }),
    closeSettingClan: this.page.locator(generateE2eSelector('user_setting.account.exit_setting')),
    leaveClan: this.page.locator(CLAN_HEADER_MENU_ITEM_SELECTOR, {
      hasText: 'Leave Clan',
    }),
    cancel: this.page.locator(generateE2eSelector('modal.confirm_modal.button.cancel')),
    confirm: this.page.locator(generateE2eSelector('modal.confirm_modal.button.confirm')),
    reset: this.page.locator(BASE_BUTTON_SELECTOR, { hasText: 'Reset' }),
    markAsRead: this.page.locator(CLAN_HEADER_MENU_ITEM_SELECTOR, {
      hasText: 'Mark as Read',
    }),
    badge: this.page.locator(generateE2eSelector('clan_page.badge')),
    preventAnoSettings: this.page.locator(
      `${generateE2eSelector('clan_page.settings.overview.prevent_anonymous')} ${generateE2eSelector('input.base')}`
    ),
    deleteCategory: this.page.locator(
      generateE2eSelector('clan_page.modal.delete_category.button.delete')
    ),
  };

  readonly sidebarMemberList = this.member.contextMenu;

  readonly sidePanel = {
    thread: {
      item: this.page.locator(
        generateE2eSelector('chat.channel_message.header.button.thread.item')
      ),
    },
  };

  readonly memberSettings = this.member.settings;

  readonly footerProfile = {
    userName: this.page.locator(generateE2eSelector('footer_profile.name')),
  };

  readonly eventModal = this.event.modal;

  readonly permissionModal = this.settings.permissionModal;

  readonly createChannelModal = this.channel.createModal;

  readonly input = {
    clanName: this.page.locator(generateE2eSelector('clan_page.modal.create_clan.input.clan_name')),
    urlInvite: this.page.locator(generateE2eSelector('clan_page.modal.invite_people.url_invite')),
    delete: this.page.locator(generateE2eSelector('clan_page.settings.modal.delete_clan.input')),
    channelName: this.page.locator(
      `${generateE2eSelector('clan_page.channel_list.settings.overview')} input`
    ),
    mention: this.page.locator(MENTION_INPUT_SELECTOR),
    permissionDenied: this.page.locator(
      generateE2eSelector('chat.message_box.input.no_permission')
    ),
    selectedFile: this.page.locator(generateE2eSelector('mention.selected_file')),
    messageBanned: this.page.locator(generateE2eSelector('mention.banned')),
    topicBanned: this.page.locator(
      `${TOPIC_BOX_SELECTOR} ${generateE2eSelector('mention.banned')}`
    ),
    messageBannedTime: this.page.locator(generateE2eSelector('mention.banned.time')),
    topicBannedTime: this.page.locator(
      `${TOPIC_BOX_SELECTOR} ${generateE2eSelector('mention.banned.time')}`
    ),
    topicInput: this.page.locator(`${TOPIC_BOX_SELECTOR} ${MENTION_INPUT_SELECTOR}`),
  };

  readonly clanSettings = this.settings.general;

  readonly sidebar = {
    DMItem: this.page.locator(generateE2eSelector('clan_page.side_bar.DM_item')),
    clanItem: this.page.locator(generateE2eSelector('clan_page.side_bar.clan_item')),
    clanItems: {
      clanName: this.page.locator(generateE2eSelector('clan_page.side_bar.clan_item.name')),
    },
    ...this.channel.sidebar,
  };

  readonly header = {
    button: {
      thread: this.page.locator(generateE2eSelector('chat.channel_message.header.button.thread')),
      createThread: this.page.locator(
        generateE2eSelector(
          'chat.channel_message.header.button.thread.modal.thread_management.button.create_thread'
        )
      ),
      member: this.page.locator(generateE2eSelector('chat.channel_message.header.button.member')),
      pin: this.page.locator(generateE2eSelector('chat.channel_message.header.button.pin')),
      canvas: this.page.locator(generateE2eSelector('chat.channel_message.header.button.canvas')),
    },
    badge: this.page.locator(generateE2eSelector('chat.channel_message.header.badge')),
  };

  readonly threadBox = {
    container: this.page.locator(THREAD_BOX_SELECTOR),
    threadNameInput: this.page.locator(
      generateE2eSelector('chat.channel_message.thread_box.input.thread_name')
    ),
    threadPrivateCheckbox: this.page.locator(
      generateE2eSelector('chat.channel_message.thread_box.checkbox.private_thread')
    ),
    threadInputMention: this.page.locator(`${THREAD_BOX_SELECTOR} ${MENTION_INPUT_SELECTOR}`),
    messageItem: this.page.locator(`${THREAD_BOX_SELECTOR} ${generateE2eSelector('message.item')}`),
    reopenMessageItem: this.page.locator(`${generateE2eSelector('message.item')}`),
    button: {
      closeCreateThreadModal: this.page.locator(
        generateE2eSelector('discussion.header.button.close')
      ),
    },
  };

  readonly modal = {
    limitCreation: {
      title: this.page.locator(generateE2eSelector('clan_page.modal.limit_creation.title')),
    },
    voiceManagement: {
      item: this.page.locator(generateE2eSelector('modal.voice_management')),
      button: {
        copyLink: this.page.locator(
          `${generateE2eSelector('modal.voice_management')} ${generateE2eSelector('button.copy')}`
        ),
        controlItem: this.page.locator(
          generateE2eSelector('modal.voice_management.button.control_item')
        ),
        endCall: this.page.locator(generateE2eSelector('icon.end_call')),
      },
    },
    canvasManagement: {
      modal: this.page.locator(
        generateE2eSelector('chat.channel_message.header.button.canvas.modal.canvas_management')
      ),
      item: this.page.locator(
        generateE2eSelector('chat.channel_message.header.button.canvas.item')
      ),
      button: {
        createCanvas: this.page.locator(
          generateE2eSelector(
            'chat.channel_message.header.button.canvas.modal.canvas_management.button.create_canvas'
          )
        ),
        copyCanvasLink: this.page.locator(generateE2eSelector('button.copy')),
        deleteCanvas: this.page.locator(
          generateE2eSelector('chat.channel_message.header.button.canvas.item.button.delete')
        ),
        confirmDelete: this.page.locator(
          generateE2eSelector('modal.confirm_modal.button.confirm'),
          { hasText: 'Delete' }
        ),
      },
    },
    aboutMe: this.page.locator(generateE2eSelector('full_profile.about_me')),
    memberSince: this.page.locator(generateE2eSelector('full_profile.member_since')),
  };

  readonly modalInvite = {
    userInvite: this.page.locator(generateE2eSelector('clan_page.modal.invite_people.user_item')),
    container: this.page.locator(generateE2eSelector('clan_page.modal.invite_people.container')),
    searchInput: this.page.locator(
      generateE2eSelector('clan_page.modal.invite_people.search_input')
    ),
    button: {
      close: this.page.locator(BASE_BUTTON_SELECTOR, { hasText: '×' }),
    },
  };

  readonly secondarySideBar = this.member.secondarySidebar;

  readonly screen = {
    voiceRoom: {
      channelName: this.page.locator(
        generateE2eSelector('clan_page.screen.voice_room.channel_name')
      ),
      joinButton: this.page.locator(
        generateE2eSelector('clan_page.screen.voice_room.button.join_voice')
      ),
      controlBar: this.page.locator(generateE2eSelector('clan_page.screen.voice_room.control_bar')),
      shareScreenButton: this.page.locator('#btn-meet-screen'),
      screenShareIcon: this.page.locator(
        generateE2eSelector('clan_page.channel_list.item.user_list.item.screen_share')
      ),
    },
    canvasEditor: {
      input: {
        title: this.page.locator(generateE2eSelector('clan_page.screen.canvas_editor.input.title')),
        content: this.page.locator(
          generateE2eSelector('clan_page.screen.canvas_editor.input.content')
        ),
      },
      button: {
        save: this.page.locator(generateE2eSelector('clan_page.screen.canvas_editor.button.save')),
      },
    },
  };

  readonly createEventModal = this.event.createModal;

  readonly eventDetailModal = this.event.detailModal;

  readonly channelManagement = this.channel.management;

  readonly clanOverviewSettings = this.settings.overview;

  readonly kickMemberModal = {
    reasonInput: this.page.locator(generateE2eSelector('clan_page.modal.kick_member.reason_input')),
    button: {
      kick: this.page.locator(generateE2eSelector('clan_page.modal.kick_member.button.kick')),
      cancel: this.page.locator(generateE2eSelector('clan_page.modal.kick_member.button.cancel')),
    },
  };

  /**
   * Find a clan item by its title attribute
   * @param clanName The exact title of the clan to find
   * @returns Locator for the clan item with matching title
   */
  async findClanByTitle(clanName: string): Promise<Locator> {
    return this.page.locator(
      `${generateE2eSelector('clan_page.side_bar.clan_item')}[title="${clanName}"]`
    );
  }

  getChannelItemByNameOnCMTab(channelName: string): Locator {
    return this.channel.getManagementItem(channelName);
  }

  getMessageCountByNameOnCMTab(channelItem: Locator): Locator {
    return this.channel.getManagementMessageCount(channelItem);
  }
}
