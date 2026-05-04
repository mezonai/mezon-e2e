import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Locator, Page } from '@playwright/test';

export default class ClanSelector {
  constructor(private readonly page: Page) {
    this.page = page;
  }

  readonly buttons = {
    createClan: this.page.locator(generateE2eSelector('clan_page.side_bar.button.add_clan')),
    clanName: this.page.locator(`${generateE2eSelector('clan_page.header.title.clan_name')} p`),
    createChannel: this.page.locator(generateE2eSelector('clan_page.side_bar.button.add_channel')),
    createClanCancel: this.page.locator(
      `${generateE2eSelector('clan_page.modal.create_clan')} ${generateE2eSelector('button.base')}`,
      { hasText: 'Cancel' }
    ),
    createClanConfirm: this.page.locator(
      `${generateE2eSelector('clan_page.modal.create_clan')} ${generateE2eSelector('button.base')}`,
      { hasText: 'Create' }
    ),
    createMyOwnClan: this.page.locator(
      generateE2eSelector('clan_page.modal.create_clan.template.item.create_my_own')
    ),
    createTemplateClan: this.page.locator(
      generateE2eSelector('clan_page.modal.create_clan.template.item.name')
    ),
    invitePeopleFromHeaderMenu: this.page.locator(
      generateE2eSelector('clan_page.header.modal_panel.item'),
      { hasText: 'Invite People' }
    ),
    invitePeople: this.page.locator(
      generateE2eSelector('clan_page.modal.invite_people.user_item.button.invite')
    ),
    closeInviteModal: this.page.locator(generateE2eSelector('button.base'), { hasText: '×' }),
    eventButton: this.page.locator(generateE2eSelector('clan_page.side_bar.button.events')),
    saveChanges: this.page.locator(generateE2eSelector('button.base'), { hasText: 'Save Changes' }),
    exitSettings: this.page.locator(generateE2eSelector('clan_page.settings.button.exit')),
    memberListButton: this.page.locator(generateE2eSelector('clan_page.side_bar.button.members')),
    invitePeopleFromChannel: this.page.locator(
      `${generateE2eSelector('onboarding.chat.guide_sections')} div:has-text("Invite your friends")`
    ),
    channelManagementButton: this.page.locator(
      generateE2eSelector('clan_page.side_bar.button.channels')
    ),
    clanSettings: this.page.locator(generateE2eSelector('clan_page.header.modal_panel.item'), {
      hasText: 'Clan Settings',
    }),
    closeSettingClan: this.page.locator(generateE2eSelector('user_setting.account.exit_setting')),
    leaveClan: this.page.locator(generateE2eSelector('clan_page.header.modal_panel.item'), {
      hasText: 'Leave Clan',
    }),
    cancel: this.page.locator(generateE2eSelector('modal.confirm_modal.button.cancel')),
    confirm: this.page.locator(generateE2eSelector('modal.confirm_modal.button.confirm')),
    reset: this.page.locator(generateE2eSelector('button.base'), { hasText: 'Reset' }),
    markAsRead: this.page.locator(generateE2eSelector('clan_page.header.modal_panel.item'), {
      hasText: 'Mark as Read',
    }),
    badge: this.page.locator(generateE2eSelector('clan_page.badge')),
    preventAnoSettings: this.page.locator(
      `${generateE2eSelector('clan_page.settings.overview.prevent_anonymous')} ${generateE2eSelector('input.base')}`
    ),
  };

  readonly sidebarMemberList = {
    memberItems: this.page.locator(generateE2eSelector('chat.channel_message.member_list.item')),
    profileButton: this.page
      .locator(generateE2eSelector('chat.channel_message.member_list.item.actions'))
      .filter({
        hasText: 'Profile',
      }),
    banButton: this.page
      .locator(generateE2eSelector('chat.channel_message.member_list.item.actions'))
      .filter({
        hasText: 'Ban',
      }),
    kickButton: this.page
      .locator(generateE2eSelector('chat.channel_message.member_list.item.actions'))
      .filter({
        hasText: 'Kick',
      }),
    shareContactButton: this.page
      .locator(generateE2eSelector('chat.channel_message.member_list.item.actions'))
      .filter({
        hasText: 'Share this contact',
      }),
    addFriendButton: this.page
      .locator(generateE2eSelector('chat.channel_message.member_list.item.actions'))
      .filter({
        hasText: 'Add Friend',
      }),
  };

  readonly sidePanel = {
    thread: {
      item: this.page.locator(
        generateE2eSelector('chat.channel_message.header.button.thread.item')
      ),
    },
  };

  readonly memberSettings = {
    userContainer: this.page.locator(generateE2eSelector('clan_page.member_list')),
    memberSince: this.page.locator(generateE2eSelector('clan_page.member_list.member_since')),
    joinMezon: this.page.locator(generateE2eSelector('clan_page.member_list.join_mezon')),
    usersInfo: this.page.locator(generateE2eSelector('clan_page.member_list.user_info')),
    userDisplayName: this.page.locator(
      generateE2eSelector('clan_page.member_list.user_info.display_name')
    ),
    username: this.page.locator(generateE2eSelector('clan_page.member_list.user_info.username')),
    actionsButton: this.page.locator(generateE2eSelector('clan_page.member_list.actions')),
    transferOwnershipModal: {
      container: this.page.locator(
        generateE2eSelector('clan_page.member_list.transfer_owner_modal')
      ),
      confirmTransferInput: this.page.locator(
        generateE2eSelector('clan_page.member_list.transfer_owner_modal.input.confirm_transfer')
      ),
      confirmTransferButton: this.page.locator(generateE2eSelector('button.base'), {
        hasText: 'Transfer Ownership',
      }),
    },
  };

  readonly footerProfile = {
    userName: this.page.locator(generateE2eSelector('footer_profile.name')),
  };

  readonly eventModal = {
    createEventButton: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.button_create')
    ),
    nextButton: this.page.locator(generateE2eSelector('clan_page.modal.create_event.next')),
  };

  readonly permissionModal = {
    isVisible: async (): Promise<boolean> => {
      const permissionModalLocator = this.page.locator(
        generateE2eSelector('clan_page.settings.modal.permission')
      );
      try {
        await permissionModalLocator.waitFor({ state: 'visible', timeout: 1000 });
        return true;
      } catch {
        return false;
      }
    },
    cancel: this.page.locator(generateE2eSelector('clan_page.settings.modal.permission.cancel')),
  };

  public createChannelModal = {
    type: {
      text: this.page.locator(generateE2eSelector('clan_page.modal.create_channel.type'), {
        hasText: 'Text',
      }),
      voice: this.page.locator(generateE2eSelector('clan_page.modal.create_channel.type'), {
        hasText: 'Voice',
      }),
      stream: this.page.locator(generateE2eSelector('clan_page.modal.create_channel.type'), {
        hasText: 'Stream',
      }),
    },
    input: {
      channelName: this.page.locator(
        generateE2eSelector('clan_page.modal.create_channel.input.channel_name')
      ),
    },
    toggle: {
      isPrivate: this.page.locator(
        generateE2eSelector('clan_page.modal.create_channel.toggle.is_private')
      ),
    },
    button: {
      confirm: this.page.locator(
        generateE2eSelector('clan_page.modal.create_channel.button.confirm')
      ),
      cancel: this.page.locator(
        generateE2eSelector('clan_page.modal.create_channel.button.cancel')
      ),
    },
  };

  readonly input = {
    clanName: this.page.locator(generateE2eSelector('clan_page.modal.create_clan.input.clan_name')),
    urlInvite: this.page.locator(generateE2eSelector('clan_page.modal.invite_people.url_invite')),
    delete: this.page.locator(generateE2eSelector('clan_page.settings.modal.delete_clan.input')),
    channelName: this.page.locator(
      `${generateE2eSelector('clan_page.channel_list.settings.overview')} input`
    ),
    mention: this.page.locator(generateE2eSelector('mention.input')),
    selectedFile: this.page.locator(generateE2eSelector('mention.selected_file')),
    messageBanned: this.page.locator(generateE2eSelector('mention.banned')),
    topicBanned: this.page.locator(
      `${generateE2eSelector('discussion.box.topic')} ${generateE2eSelector('mention.banned')}`
    ),
    messageBannedTime: this.page.locator(generateE2eSelector('mention.banned.time')),
    topicBannedTime: this.page.locator(
      `${generateE2eSelector('discussion.box.topic')} ${generateE2eSelector('mention.banned.time')}`
    ),
    topicInput: this.page.locator(
      `${generateE2eSelector('discussion.box.topic')} ${generateE2eSelector('mention.input')}`
    ),
  };

  readonly clanSettings = {
    clanName: this.page.locator(generateE2eSelector('clan_page.settings.overview.input.clan_name')),
    settings_page: this.page.locator(generateE2eSelector('clan_page.settings')),
    buttons: {
      sidebarItem: this.page.locator(generateE2eSelector('clan_page.settings.sidebar.item')),
      roleSettings: this.page.locator(generateE2eSelector('clan_page.settings.sidebar.item'), {
        hasText: 'Roles',
      }),
      integrations: this.page.locator(generateE2eSelector('clan_page.settings.sidebar.item'), {
        hasText: 'Integrations',
      }),
      createRole: this.page.locator(generateE2eSelector('button.base'), { hasText: 'Create Role' }),
      displayRoleOption: this.page.locator(
        generateE2eSelector('clan_page.settings.role.container.role_option.display')
      ),
      permissionsRole: this.page.locator(
        generateE2eSelector('clan_page.settings.role.container.role_option.permissions')
      ),
      roleColor: this.page.locator(
        generateE2eSelector('clan_page.settings.role.container.role_color')
      ),
      deleteClan: this.page.locator(generateE2eSelector('clan_page.settings.sidebar.delete')),
    },
    input: {
      roleName: this.page.locator(
        `${generateE2eSelector('clan_page.settings.role.container.name_input')} input`
      ),
    },
    roleContainer: this.page.locator(generateE2eSelector('clan_page.settings.role.container')),
    rolePermissionsItem: this.page.locator(
      generateE2eSelector('clan_page.settings.role.container.role_option.permissions.item')
    ),
    rolePermissionsSwitch: this.page.locator(
      generateE2eSelector('clan_page.settings.role.container.role_option.permissions.item.switch')
    ),
    sidebarTitle: this.page.locator(generateE2eSelector('clan_page.settings.sidebar.title')),
    roleList: {
      item: this.page.locator(generateE2eSelector('clan_page.settings.role.item')),
      roleName: this.page.locator(generateE2eSelector('clan_page.settings.role.item.role_name')),
      memberCount: this.page.locator(
        generateE2eSelector('clan_page.settings.role.item.member_count')
      ),
      buttons: {
        edit: this.page.locator(generateE2eSelector('clan_page.settings.role.item.button.edit')),
        view: this.page.locator(generateE2eSelector('clan_page.settings.role.item.button.view')),
        delete: this.page.locator(
          generateE2eSelector('clan_page.settings.role.item.button.delete')
        ),
      },
      override: {
        item: this.page.locator(generateE2eSelector('clan_page.settings.role.override.item')),
        button: {
          remove: this.page.locator(
            generateE2eSelector('clan_page.settings.role.override.item.button.remove')
          ),
          tick: this.page.locator(
            generateE2eSelector('clan_page.settings.role.override.item.button.tick')
          ),
        },
      },
    },
  };

  readonly sidebar = {
    DMItem: this.page.locator(generateE2eSelector('clan_page.side_bar.DM_item')),
    clanItem: this.page.locator(generateE2eSelector('clan_page.side_bar.clan_item')),
    clanItems: {
      clanName: this.page.locator(generateE2eSelector('clan_page.side_bar.clan_item.name')),
    },
    channelItem: {
      item: this.page.locator(generateE2eSelector('clan_page.channel_list.item')),
      name: this.page.locator(generateE2eSelector('clan_page.channel_list.item.name')),
      icon: this.page.locator(generateE2eSelector('clan_page.channel_list.item.icon')),
      iconHashtagLock: this.page.locator(
        generateE2eSelector('clan_page.channel_list.item.icon.hashtag_lock')
      ),
      iconHashtag: this.page.locator(
        generateE2eSelector('clan_page.channel_list.item.icon.hashtag')
      ),
      userList: {
        item: this.page.locator(generateE2eSelector('clan_page.channel_list.item.user_list.item')),
      },
      userListCollapsed: {
        item: this.page.locator(
          generateE2eSelector('clan_page.channel_list.item.user_list_collapsed.item')
        ),
        itemCount: this.page.locator(
          generateE2eSelector('clan_page.channel_list.item.user_list_collapsed.item_count')
        ),
      },
      badge: this.page.locator(generateE2eSelector('clan_page.channel_list.item.badge')),
    },
    threadItem: {
      name: this.page.locator(generateE2eSelector('clan_page.channel_list.thread_item.name')),
    },
    panelItem: {
      item: this.page.locator(generateE2eSelector('clan_page.channel_list.panel.item')),
    },
    channelsList: this.page.locator(generateE2eSelector('clan_page.channel_list.item')),
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
    container: this.page.locator(generateE2eSelector('discussion.box.thread')),
    threadNameInput: this.page.locator(
      generateE2eSelector('chat.channel_message.thread_box.input.thread_name')
    ),
    threadPrivateCheckbox: this.page.locator(
      generateE2eSelector('chat.channel_message.thread_box.checkbox.private_thread')
    ),
    threadInputMention: this.page.locator(
      `${generateE2eSelector('discussion.box.thread')} ${generateE2eSelector('mention.input')}`
    ),
    messageItem: this.page.locator(
      `${generateE2eSelector('discussion.box.thread')} ${generateE2eSelector('message.item')}`
    ),
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
      close: this.page.locator(generateE2eSelector('button.base'), { hasText: '×' }),
    },
  };

  readonly secondarySideBar = {
    container: this.page.locator(generateE2eSelector('clan_page.secondary_side_bar')),
    member: {
      item: this.page.locator(generateE2eSelector('clan_page.secondary_side_bar.member')),
      inVoice: this.page.locator(
        generateE2eSelector('clan_page.secondary_side_bar.member.in_voice')
      ),
      customStatus: this.page.locator(
        generateE2eSelector('clan_page.secondary_side_bar.member.user_status')
      ),
      username: this.page.locator(generateE2eSelector('chat.direct_message.chat_item.username')),
      ownerIcon: this.page.locator(generateE2eSelector('icon.owner')),
    },
  };

  readonly screen = {
    voiceRoom: {
      channelName: this.page.locator('clan_page.screen.voice_room.channel_name'),
      joinButton: this.page.locator(
        generateE2eSelector('clan_page.screen.voice_room.button.join_voice')
      ),
      controlBar: this.page.locator(generateE2eSelector('clan_page.screen.voice_room.control_bar')),
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
        discardChanges: this.page.locator(
          generateE2eSelector('clan_page.screen.canvas_editor.button.discard_changes')
        ),
      },
    },
  };

  readonly createEventModal = {
    modal: this.page.locator(generateE2eSelector('clan_page.modal.create_event')),
    modalStart: this.page.locator(generateE2eSelector('clan_page.modal.create_event.start_modal')),
    type: {
      voice: this.page.locator(generateE2eSelector('clan_page.modal.create_event.location.type'), {
        hasText: 'Voice Channel',
      }),
      location: this.page.locator(
        generateE2eSelector('clan_page.modal.create_event.location.type'),
        {
          hasText: 'Somewhere else',
        }
      ),
      private: this.page.locator(
        generateE2eSelector('clan_page.modal.create_event.location.type'),
        {
          hasText: 'Create External Event',
        }
      ),
    },
    input: {
      eventTopic: this.page.locator(
        generateE2eSelector('clan_page.modal.create_event.event_info.input.event_topic')
      ),
      startDateInput: this.page.locator(`
        ${generateE2eSelector('clan_page.modal.create_event.event_info.input.start_date')} 
        div.w-full 
        input
      `),
      startTime: this.page.locator(
        `${generateE2eSelector('clan_page.modal.create_event.event_info.input.start_time')} div`
      ),
      endDate: this.page.locator(
        `${generateE2eSelector('clan_page.modal.create_event.event_info.input.end_date')} 
        div.w-full 
        input`
      ),
      endTime: this.page.locator(
        `${generateE2eSelector('clan_page.modal.create_event.event_info.input.end_time')} div`
      ),
      description: this.page.locator(
        `${generateE2eSelector('clan_page.modal.create_event.event_info.input.description')} div textarea`
      ),
      locationName: this.page.locator(
        generateE2eSelector('clan_page.modal.create_event.location.input')
      ),
    },
    selectVoiceChannel: this.page.locator(
      `${generateE2eSelector('clan_page.modal.create_event.location')} div:has-text("Select Voice channel")`
    ),
    selectChannel: this.page.locator(
      `${generateE2eSelector('clan_page.modal.create_event.location')} div:has-text("Select channel")`
    ),
    channelItem: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.location.channel.item')
    ),
    startTimeReview: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.review.start_time')
    ),
    typeClanReview: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.review.type')
    ),
    eventTopicReview: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.review.event_topic')
    ),
    descriptionReview: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.review.description')
    ),
    voiceChannelReview: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.review.voice_channel')
    ),
    textChannelReview: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.review.text_channel')
    ),
    locationNameReview: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.review.location_name')
    ),
    eventManagementItem: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.event_management.item')
    ),
    openEventDetailModalButton: this.page.locator(
      generateE2eSelector(
        'clan_page.modal.create_event.event_management.item.button.open_detail_modal'
      )
    ),
    button: {
      closeContainerModal: this.page.locator(
        generateE2eSelector('clan_page.modal.create_event.button_close')
      ),
      closeDetailModal: this.page.locator(
        generateE2eSelector(
          'clan_page.modal.create_event.event_management.item.button.close_detail_modal'
        )
      ),
      openPanel: this.page.locator(
        generateE2eSelector('clan_page.modal.create_event.event_management.item.button.open_panel')
      ),
      editEvent: this.page.locator(generateE2eSelector('clan_page.channel_list.panel.item'), {
        hasText: 'Edit Event',
      }),
      cancelEvent: this.page.locator(generateE2eSelector('clan_page.channel_list.panel.item'), {
        hasText: 'Cancel Event',
      }),
      copyEventLink: this.page.locator(generateE2eSelector('clan_page.channel_list.panel.item'), {
        hasText: 'Copy Event Link',
      }),
      confirmCancelEvent: this.page.locator(
        generateE2eSelector(
          'clan_page.modal.create_event.event_management.item.button.confirm_cancel_event'
        )
      ),
      shareEvent: this.page.locator(
        generateE2eSelector('clan_page.modal.create_event.event_management.item.button.share_event')
      ),
      copyLink: this.page.locator(generateE2eSelector('button.copy')),
      closeModalCopyLink: this.page.locator(
        generateE2eSelector(
          'clan_page.modal.create_event.event_management.item.button.close_modal_copy_link'
        )
      ),
    },
  };

  readonly eventDetailModal = {
    modal: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.event_management.item.modal_detail_item')
    ),
    startDateTime: this.page.locator(
      generateE2eSelector(
        'clan_page.modal.create_event.event_management.item.modal_detail_item.start_date_time'
      )
    ),
    topic: this.page.locator(
      generateE2eSelector(
        'clan_page.modal.create_event.event_management.item.modal_detail_item.topic'
      )
    ),
    channelName: this.page.locator(
      generateE2eSelector(
        'clan_page.modal.create_event.event_management.item.modal_detail_item.channel_name'
      )
    ),
    description: this.page.locator(
      generateE2eSelector(
        'clan_page.modal.create_event.event_management.item.modal_detail_item.description'
      )
    ),
  };

  readonly channelManagement = {
    totalChannels: this.page.locator(
      generateE2eSelector('clan_page.channel_management.total_channels')
    ),
    channelItem: this.page.locator(
      generateE2eSelector('clan_page.channel_management.channel_item')
    ),
    messagesCount: this.page.locator(
      generateE2eSelector('clan_page.channel_management.channel_item.messages_count')
    ),
    channelName: this.page.locator(
      generateE2eSelector('clan_page.channel_management.channel_item.channel_name')
    ),
  };

  readonly clanOverviewSettings = {
    system_messages_channel: {
      selection: {
        container: this.page.locator(
          generateE2eSelector('clan_page.settings.overview.system_messages_channel')
        ),
        wrap_item: this.page.locator(
          generateE2eSelector('clan_page.settings.overview.system_messages_channel.selection.item')
        ),
        item: {
          channel_name: this.page.locator(
            generateE2eSelector(
              'clan_page.settings.overview.system_messages_channel.selection.item.channel_name'
            )
          ),
          category_name: this.page.locator(
            generateE2eSelector(
              'clan_page.settings.overview.system_messages_channel.selection.item.category_name'
            )
          ),
        },
        selected: {
          channel_name: this.page.locator(
            generateE2eSelector(
              'clan_page.settings.overview.system_messages_channel.selection.selected.channel_name'
            )
          ),
          category_name: this.page.locator(
            generateE2eSelector(
              'clan_page.settings.overview.system_messages_channel.selection.selected.category_name'
            )
          ),
        },
      },
    },
  };

  readonly kickMemberModal = {
    reasonInput: this.page.locator(generateE2eSelector('clan_page.modal.kick_member.reason_input')),
    button: {
      kick: this.page.locator(generateE2eSelector('clan_page.modal.kick_member.button.kick')),
      cancel: this.page.locator(generateE2eSelector('clan_page.modal.kick_member.button.cancel')),
    },
  };

  readonly onboarding = {
    status: this.page.locator(generateE2eSelector('clan_page.settings.sidebar.onboarding_status')),
    buttons: {
      enableOnboarding: this.page.locator(
        generateE2eSelector('clan_page.settings.onboarding.button.enable_onboarding')
      ),
      back: this.page.locator(generateE2eSelector('clan_page.settings.onboarding.button.back')),
      disableOnboarding: this.page.locator(
        generateE2eSelector('clan_page.settings.onboarding.button.disable_onboarding')
      ),
      openPreviewMode: this.page.locator(
        generateE2eSelector('clan_page.settings.onboarding.button.open_preview_mode')
      ),
      closePreviewMode: this.page.locator(
        generateE2eSelector('clan_page.settings.onboarding.button.close_preview_mode')
      ),
    },
    setupQuestion: {
      item: this.page.locator(
        generateE2eSelector('clan_page.settings.onboarding.button.setup_question')
      ),
      input: {
        question: this.page.locator(
          generateE2eSelector('clan_page.settings.onboarding.input.question')
        ),
        answerTitle: this.page.locator(
          `${generateE2eSelector('mention.input')}[placeholder="Enter an answer..."]`
        ),

        answerDescription: this.page.locator(
          `${generateE2eSelector('mention.input')}[placeholder="Enter a description... (optional)"]`
        ),
      },
      button: {
        confirmAnswer: this.page.locator(generateE2eSelector('button.base'), { hasText: 'Save' }),
        saveQuestion: this.page.locator(
          generateE2eSelector('clan_page.settings.onboarding.button.save_change')
        ),
        addQuestion: this.page.locator(
          generateE2eSelector('clan_page.settings.onboarding.button.add_question')
        ),
        addAnswer: this.page.locator(generateE2eSelector('button.base'), {
          hasText: 'Add an Answer',
        }),
        removeQuestion: this.page.locator(
          generateE2eSelector('clan_page.settings.onboarding.button.remove_question')
        ),
        removeAnswer: this.page.locator(generateE2eSelector('button.base'), { hasText: 'Remove' }),
        questionItem: this.page.locator(
          generateE2eSelector('clan_page.settings.onboarding.question.item')
        ),
        saveAll: this.page.locator(
          generateE2eSelector('clan_page.settings.onboarding.button.save_all')
        ),
      },
    },
    clanGuideSettings: {
      item: this.page.locator(
        generateE2eSelector('clan_page.settings.onboarding.button.clan_guide')
      ),
      buttons: {
        addTask: this.page.locator(
          generateE2eSelector('clan_page.settings.onboarding.button.add_task')
        ),
      },
      input: {
        taskTitle: this.page.locator(
          `${generateE2eSelector('mention.input')}[placeholder="Ex. Post a photo of your pet"]`
        ),
      },
    },
    clanGuidePage: {
      sidebar: this.page.locator(generateE2eSelector('clan_page.side_bar.button.clan_guide')),
      questionLabel: this.page.locator(generateE2eSelector('onboarding.clan_guide_page.label'), {
        hasText: 'Questions',
      }),
      resourceLabel: this.page.locator(generateE2eSelector('onboarding.clan_guide_page.label'), {
        hasText: 'Resources',
      }),
      missionLabel: this.page.locator(generateE2eSelector('onboarding.clan_guide_page.label'), {
        hasText: 'Missions',
      }),
      title: this.page.locator(generateE2eSelector('onboarding.clan_guide_page.title')),
      description: this.page.locator(generateE2eSelector('onboarding.clan_guide_page.description')),
      action: this.page.locator(generateE2eSelector('onboarding.clan_guide_page.action')),
      question: this.page.locator(generateE2eSelector('onboarding.clan_guide_page.question')),
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
    return this.page.locator(generateE2eSelector('clan_page.channel_management.channel_item'), {
      has: this.page.locator(
        generateE2eSelector('clan_page.channel_management.channel_item.channel_name'),
        { hasText: channelName }
      ),
    });
  }

  getMessageCountByNameOnCMTab(channelItem: Locator): Locator {
    return channelItem.locator(
      generateE2eSelector('clan_page.channel_management.channel_item.messages_count')
    );
  }

  getMemberonMemberSettingsbyUsername(username: string) {
    return this.page.locator(
      `${generateE2eSelector('clan_page.member_list.user_info')} ${generateE2eSelector('clan_page.member_list.user_info.username')} span`,
      { hasText: username }
    );
  }
}
