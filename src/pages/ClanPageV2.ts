import { ChannelStatus, ChannelType, ClanStatus, ThreadStatus } from '@/types/clan-page.types';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { expect, Locator, Page } from '@playwright/test';
import { EventType } from './../types/clan-page.types';
import { DirectMessageHelper } from './../utils/directMessageHelper';
import { BasePage } from './BasePage';
import { CategoryPage } from './CategoryPage';
import { CategorySettingPage } from './CategorySettingPage';

export class ClanPageV2 extends BasePage {
  constructor(page: Page) {
    super(page);
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
  };

  readonly sidebarMemberList = {
    memberItems: this.page.locator(generateE2eSelector('chat.channel_message.member_list.item')),
    profileButton: this.page.locator(
      generateE2eSelector('chat.channel_message.member_list.item.actions.view_profile')
    ),
  };

  readonly memberSettings = {
    usersInfo: this.page.locator(generateE2eSelector('clan_page.member_list.user_info')),
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

  public createEventModal = {
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
          hasText: 'Create Private Event',
        }
      ),
    },
    input: {
      eventTopic: this.page.locator(
        generateE2eSelector('clan_page.modal.create_event.event_info.input.event_topic')
      ),
      startDateInput: this.page.locator(`
        ${generateE2eSelector('clan_page.modal.create_event.event_info.input.start_date')} 
        div.react-datepicker-wrapper 
        div.react-datepicker__input-container 
        input
      `),
      startTime: this.page.locator(
        `${generateE2eSelector('clan_page.modal.create_event.event_info.input.start_time')} select`
      ),
      endDate: this.page.locator(
        `${generateE2eSelector('clan_page.modal.create_event.event_info.input.end_date')} 
        div.react-datepicker-wrapper 
        div.react-datepicker__input-container 
        input`
      ),
      endTime: this.page.locator(
        `${generateE2eSelector('clan_page.modal.create_event.event_info.input.end_time')} select`
      ),
      description: this.page.locator(
        `${generateE2eSelector('clan_page.modal.create_event.event_info.input.description')} div textarea`
      ),
      locationName: this.page.locator(
        generateE2eSelector('clan_page.modal.create_event.location.input')
      ),
    },
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
    },
  };

  public eventDetailModal = {
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

  private input = {
    clanName: this.page.locator(generateE2eSelector('clan_page.modal.create_clan.input.clan_name')),
    urlInvite: this.page.locator(generateE2eSelector('clan_page.modal.invite_people.url_invite')),
    delete: this.page.locator(generateE2eSelector('clan_page.settings.modal.delete_clan.input')),
    channelName: this.page.locator(
      `${generateE2eSelector('clan_page.channel_list.settings.overview')} input`
    ),
  };

  private settings = {
    clanName: this.page.locator(generateE2eSelector('clan_page.settings.overview.input.clan_name')),
  };

  readonly sidebar = {
    clanItem: this.page.locator(generateE2eSelector('clan_page.side_bar.clan_item')),
    clanItems: {
      clanName: this.page.locator(generateE2eSelector('clan_page.side_bar.clan_item.name')),
    },
    channelItem: {
      name: this.page.locator(generateE2eSelector('clan_page.channel_list.item.name')),
      icon: this.page.locator(generateE2eSelector('clan_page.channel_list.item.icon')),
    },
    threadItem: {
      name: this.page.locator(generateE2eSelector('clan_page.channel_list.thread_item.name')),
    },
    panelItem: {
      item: this.page.locator(generateE2eSelector('clan_page.channel_list.panel.item')),
    },
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
    },
  };

  readonly threadBox = {
    threadNameInput: this.page.locator(
      generateE2eSelector('chat.channel_message.thread_box.input.thread_name')
    ),
    threadPrivateCheckbox: this.page.locator(
      generateE2eSelector('chat.channel_message.thread_box.checkbox.private_thread')
    ),
    threadInputMention: this.page.locator(
      `${generateE2eSelector('discussion.box.thread')} ${generateE2eSelector('mention.input')}`
    ),
  };

  readonly modal = {
    limitCreation: {
      title: this.page.locator(generateE2eSelector('clan_page.modal.limit_creation.title')),
    },
  };

  private modalInvite = {
    userInvite: this.page.locator(generateE2eSelector('clan_page.modal.invite_people.user_item')),
    container: this.page.locator(generateE2eSelector('clan_page.modal.invite_people.container')),
  };

  async createNewClan(clanName: string): Promise<boolean> {
    try {
      await this.input.clanName.fill(clanName);
      await this.page.waitForTimeout(2000);
      await this.buttons.createClanConfirm.click();
      await this.page.waitForTimeout(5000);
      return true;
    } catch (error) {
      console.error(`Error creating clan: ${error}`);
      return false;
    }
  }

  async isClanPresent(clanName: string): Promise<boolean> {
    const clanLocator = this.page.locator(generateE2eSelector('clan_page.header.title.clan_name'), {
      hasText: clanName,
    });

    try {
      await clanLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async clickCreateClanButton(): Promise<boolean> {
    if (this.buttons.createClan) {
      await this.buttons.createClan.click();
      return true;
    }

    return false;
  }

  async deleteClan(removeAll?: boolean): Promise<boolean> {
    try {
      const categoryPage = new CategoryPage(this.page);
      const categorySettingPage = new CategorySettingPage(this.page);

      await categoryPage.text.clanName.click();
      await categoryPage.buttons.clanSettings.click();
      const clanName = await this.settings.clanName.inputValue();
      if (removeAll && !this.shouldDeleteClan(clanName || '')) {
        return false;
      }
      await categorySettingPage.buttons.deleteSidebar.click();
      await categorySettingPage.input.delete.fill(clanName || '');
      await categorySettingPage.buttons.confirmDelete.click();
      await this.page.waitForLoadState('domcontentloaded');
      if (await this.permissionModal.isVisible()) {
        await this.permissionModal.cancel.click();
      }
      return true;
    } catch (error) {
      console.error(`Error deleting clan: ${error}`);
      return false;
    }
  }

  /**
   * Check if a clan should be deleted based on its timestamp
   * @param clanName The name of the clan in format: prefix_randomString_timestamp
   * @returns true if the clan's timestamp has passed the current time
   */
  private shouldDeleteClan(clanName: string): boolean {
    try {
      const parts = clanName.split('_');
      if (parts.length < 3) {
        return true;
      }

      const timestampStr = parts[parts.length - 1];

      const clanTimestamp = parseInt(timestampStr);
      if (isNaN(clanTimestamp)) {
        return false;
      }

      const currentTime = Date.now();

      return currentTime > clanTimestamp;
    } catch (error) {
      return false;
    }
  }

  async openClanSettings(): Promise<boolean> {
    try {
      const categoryPage = new CategoryPage(this.page);

      await categoryPage.text.clanName.click();
      await categoryPage.buttons.clanSettings.click();
      return true;
    } catch (error) {
      console.error(`Error deleting clan: ${error}`);
      return false;
    }
  }

  async createEvent(): Promise<void> {
    this.buttons.eventButton.click();
    this.eventModal.createEventButton.click();
    this.eventModal.nextButton.click();
  }

  async openChannelSettings(channelName: string): Promise<void> {
    const channelLocator = this.sidebar.channelItem.name.filter({ hasText: channelName });
    await channelLocator.click({ button: 'right' });
    await this.sidebar.panelItem.item.filter({ hasText: 'Edit Channel' }).click();
    await this.page.waitForTimeout(500);
  }

  async openMemberListSetting(): Promise<void> {
    await this.buttons.memberListButton.click();
    await this.page.waitForTimeout(500);
  }

  async createNewChannel(
    typeChannel: ChannelType,
    channelName: string,
    status?: ChannelStatus
  ): Promise<boolean> {
    try {
      await this.buttons.createChannel.click();

      switch (typeChannel) {
        case ChannelType.TEXT:
          await this.createChannelModal.type.text.click();
          break;
        case ChannelType.VOICE:
          await this.createChannelModal.type.voice.click();
          break;
        case ChannelType.STREAM:
          await this.createChannelModal.type.stream.click();
          break;
      }
      await this.createChannelModal.input.channelName.fill(channelName);
      if (status === ChannelStatus.PRIVATE && typeChannel === ChannelType.TEXT) {
        await this.createChannelModal.toggle.isPrivate.click();
      }
      await this.createChannelModal.button.confirm.click();

      return true;
    } catch (error) {
      console.error(`Error creating channel: ${error}`);
      return false;
    }
  }

  async isNewChannelPresent(channelName: string): Promise<boolean> {
    const channelLocator = this.page.locator(
      generateE2eSelector('clan_page.channel_list.item.name'),
      { hasText: channelName }
    );

    try {
      await channelLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async createThread(threadName: string, status?: ThreadStatus): Promise<void> {
    await this.header.button.thread.click();
    await this.header.button.createThread.click();
    await this.threadBox.threadNameInput.fill(threadName);
    if (status === ThreadStatus.PRIVATE) {
      await this.threadBox.threadPrivateCheckbox.click();
    }
    await this.threadBox.threadInputMention.fill(threadName);
    await this.threadBox.threadInputMention.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async openMemberList(): Promise<void> {
    await this.header.button.member.nth(0).click();
    await this.page.waitForTimeout(500);
  }

  async getMemberFromMemberList(memberName: string): Promise<Locator> {
    const memberLocator = this.sidebarMemberList.memberItems.filter({ hasText: memberName });
    await memberLocator.waitFor({ state: 'visible', timeout: 5000 });
    return memberLocator;
  }

  async getProfileFromMemberList(memberName: string): Promise<void> {
    const memberItem = await this.getMemberFromMemberList(memberName);
    await memberItem.click({ button: 'right' });
    await this.sidebarMemberList.profileButton.click();
    await this.page.waitForTimeout(1000);
  }

  async isNewThreadPresent(threadName: string): Promise<boolean> {
    const threadLocator = this.sidebar.threadItem.name.filter({
      hasText: threadName,
    });

    try {
      await threadLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getAllClan(): Promise<number> {
    const clanElements = this.sidebar.clanItem;
    return await clanElements.count();
  }

  async isLimitCreationModalPresent(): Promise<boolean> {
    const limitCreationModalLocator = this.modal.limitCreation.title;
    try {
      await limitCreationModalLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async clickButtonInvitePeopleFromMenu(): Promise<boolean> {
    try {
      await this.buttons.clanName.click();
      await this.buttons.invitePeopleFromHeaderMenu.click();
      return true;
    } catch (error) {
      console.error(`Error clicking invite people:`, error);
      return false;
    }
  }

  async sendInviteOnModal(): Promise<{
    success: boolean;
    username?: string;
    urlInvite?: string;
  }> {
    try {
      await expect(this.modalInvite.userInvite.first()).toBeVisible();

      const userInviteItem = this.modalInvite.userInvite.first();
      const usernameElement = userInviteItem.locator('p');
      await expect(usernameElement).toBeVisible();

      const username = (await usernameElement.innerText()).trim();

      await expect(this.input.urlInvite).toHaveValue(/http/);
      const urlInvite = (await this.input.urlInvite.inputValue()).trim();

      if (!username || !urlInvite) {
        throw new Error('Missing invite info or URL');
      }

      await this.buttons.invitePeople.first().click();

      await this.buttons.closeInviteModal.click();

      await this.modalInvite.container.waitFor({ state: 'hidden', timeout: 5000 });

      return { success: true, username, urlInvite };
    } catch (error) {
      console.error('Error sending invite:', error);
      return { success: false };
    }
  }

  async openDirectMessageWithUser(username: string): Promise<void> {
    const directMessageHelpers = new DirectMessageHelper(this.page);

    await expect(
      directMessageHelpers.userNamesInDM.getByText(username, { exact: true })
    ).toBeVisible();

    await directMessageHelpers.userNamesInDM.getByText(username, { exact: true }).click();
  }

  async getLastMessageInChat(): Promise<string> {
    const messageHelpers = new MessageTestHelpers(this.page);
    const lastMessage = await messageHelpers.messages.last();

    await expect(lastMessage).toBeVisible();

    return (await lastMessage.innerText()).trim();
  }

  async editChannelName(channelName: string, newChannelName: string): Promise<void> {
    await this.openChannelSettings(channelName);
    const input = this.page.locator(
      `${generateE2eSelector('clan_page.channel_list.settings.overview')} input[value="${channelName}"]`
    );

    await input.fill(newChannelName);
    await this.buttons.saveChanges.click();
    await this.buttons.exitSettings.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickButtonInvitePeopleFromChannel(): Promise<boolean> {
    try {
      await this.buttons.invitePeopleFromChannel.click();
      return true;
    } catch (error) {
      console.error(`Error clicking invite people:`, error);
      return false;
    }
  }

  async addDataOnLocationTab(
    eventType: EventType,
    voiceChannelName?: string,
    status?: ClanStatus,
    textChannelName?: string
  ): Promise<boolean> {
    try {
      await this.buttons.eventButton.click();
      await this.createEventModal.modalStart.waitFor({ state: 'visible', timeout: 5000 });

      await this.eventModal.createEventButton.click();

      switch (eventType) {
        case EventType.LOCATION:
          await this.createEventModal.type.location.click();
          break;
        case EventType.VOICE:
          await this.createEventModal.type.voice.click();
          break;
        case EventType.PRIVATE:
          await this.createEventModal.type.private.click();
          break;
      }
      if (voiceChannelName) {
        if (eventType === EventType.VOICE) {
          await this.createEventModal.selectChannel.first().click();
          const channelItem = this.createEventModal.channelItem.filter({
            hasText: voiceChannelName,
          });
          await channelItem.click();
        } else if (eventType === EventType.LOCATION) {
          await this.createEventModal.input.locationName.fill(voiceChannelName);
        }
      }

      if (status === ClanStatus.PRIVATE) {
        await this.createEventModal.selectChannel.last().click({ force: true });
        const channelItem = this.createEventModal.channelItem.filter({ hasText: textChannelName });
        await channelItem.click();
      }

      await this.eventModal.nextButton.click();

      return true;
    } catch (error) {
      console.error(`Error creating channel: ${error}`);
      return false;
    }
  }

  async formatDateTimeFromInputs(startDate: string, startTime: string, locale = 'en-US') {
    const [day, month, year] = startDate.split('/');
    const [hour, minute] = startTime.split(':');

    const rawDate = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
    );

    const dateFormatter = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });

    const timeFormatter = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    });

    const datePart = dateFormatter.format(rawDate);
    const timePart = timeFormatter.format(rawDate);

    return { formattedDate: datePart, formattedTime: timePart };
  }

  async addDataOnEventInfoTab(): Promise<{
    eventTopic: string;
    description?: string;
    startDate: string;
    startTime: string;
  }> {
    try {
      const eventTopic = `E2E event ${Date.now()}`;
      const description = `This is an event created during E2E tests ${Date.now()}`;
      const startDate = await this.createEventModal.input.startDateInput.inputValue();
      const startTime = await this.createEventModal.input.startTime.inputValue();

      const { formattedDate, formattedTime } = await this.formatDateTimeFromInputs(
        startDate,
        startTime
      );
      await this.createEventModal.input.eventTopic.fill(eventTopic);
      await this.createEventModal.input.description.fill(description);

      await this.eventModal.nextButton.click();

      return {
        eventTopic,
        description,
        startDate: formattedDate,
        startTime: formattedTime,
      };
    } catch (error) {
      console.error(`Error adding data on event info tab: ${error}`);
      return { eventTopic: '', description: '', startDate: '', startTime: '' };
    }
  }

  async verifyDataOnReviewTab(data: {
    eventTopic: string;
    description?: string;
    startDate: string;
    startTime: string;
    voiceChannelName?: string;
    eventType?: EventType;
    clanStatus?: ClanStatus;
    textChannelName?: string;
  }): Promise<boolean> {
    try {
      const { eventTopic, description, startDate, startTime, voiceChannelName, textChannelName } =
        data;

      const eventTopicLocator = this.createEventModal.eventTopicReview;
      await expect(eventTopicLocator).toHaveText(eventTopic);

      if (description) {
        const descriptionLocator = this.createEventModal.descriptionReview;
        await expect(descriptionLocator).toHaveText(description);
      }

      const startDateTime = `${startDate} - ${startTime}`;
      const startDateTimeLocator = this.createEventModal.startTimeReview;
      await expect(startDateTimeLocator).toHaveText(startDateTime);
      const typeClanLocator = this.createEventModal.typeClanReview;
      if (data.eventType === EventType.VOICE || data.eventType === EventType.LOCATION) {
        if (data.clanStatus === ClanStatus.PUBLIC) {
          await expect(typeClanLocator).toHaveText('Clan Event');
        } else if (data.clanStatus === ClanStatus.PRIVATE) {
          await expect(typeClanLocator).toHaveText('Channel Event');
        }
      } else if (data.eventType === EventType.PRIVATE) {
        await expect(typeClanLocator).toHaveText('Private Event');
      }

      if (voiceChannelName) {
        if (data.eventType === EventType.VOICE) {
          const voiceChannelLocator = this.createEventModal.voiceChannelReview;
          await expect(voiceChannelLocator).toHaveText(voiceChannelName);
        } else if (data.eventType === EventType.LOCATION) {
          const locationNameLocator = this.createEventModal.locationNameReview;
          await expect(locationNameLocator).toHaveText(voiceChannelName);
        }
      }

      if (data.clanStatus === ClanStatus.PRIVATE && textChannelName) {
        const textChannelLocator = this.createEventModal.textChannelReview;
        await expect(textChannelLocator).toHaveText(textChannelName);
      }
      return true;
    } catch (error) {
      console.error(`Error verifying data on review tab: ${error}`);
      return false;
    }
  }

  async waitForModalToBeHidden(): Promise<void> {
    await this.createEventModal.modal.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async getLastEventData(eventType: EventType) {
    await this.buttons.eventButton.click();
    await this.createEventModal.modalStart.waitFor({ state: 'visible', timeout: 5000 });

    const lastEvent = this.createEventModal.eventManagementItem.last();
    await lastEvent.waitFor({ state: 'visible', timeout: 5000 });

    const startTime = await lastEvent.locator(this.createEventModal.startTimeReview).textContent();
    const type = await lastEvent.locator(this.createEventModal.typeClanReview).textContent();
    const topic = await lastEvent.locator(this.createEventModal.eventTopicReview).textContent();
    const description = await lastEvent
      .locator(this.createEventModal.descriptionReview)
      .textContent();
    const voiceChannel =
      eventType === EventType.VOICE
        ? ((
            await lastEvent
              .locator(this.createEventModal.voiceChannelReview)
              .textContent()
              .catch(() => null)
          )?.trim() ?? '')
        : eventType === EventType.LOCATION
          ? ((
              await lastEvent
                .locator(this.createEventModal.locationNameReview)
                .textContent()
                .catch(() => null)
            )?.trim() ?? '')
          : '';

    const textChannelLocator = lastEvent.locator(this.createEventModal.textChannelReview);
    const hasTextChannel = (await textChannelLocator.count()) > 0;

    const textChannel = hasTextChannel ? (await textChannelLocator.textContent())?.trim() : '';

    return {
      startTime: startTime?.trim(),
      type: type?.trim(),
      topic: topic?.trim(),
      description: description?.trim(),
      voiceChannel: voiceChannel?.trim(),
      textChannel,
    };
  }

  async verifyLastEventData(expected: {
    eventTopic: string;
    description?: string;
    voiceChannelName?: string;
    textChannelName?: string;
    startTime?: string;
    clanStatus?: ClanStatus;
    eventType: EventType;
  }): Promise<boolean> {
    const lastEvent = await this.getLastEventData(expected.eventType);

    await expect(lastEvent.topic).toBe(expected.eventTopic);

    if (expected.description) {
      await expect(lastEvent.description).toBe(expected.description);
    }

    if (expected.voiceChannelName) {
      await expect(lastEvent.voiceChannel).toBe(expected.voiceChannelName);
    }

    if (expected.textChannelName && expected.clanStatus === ClanStatus.PRIVATE) {
      await expect(lastEvent.textChannel).toBe(expected.textChannelName);
    }

    if (expected.startTime) {
      await expect(lastEvent.startTime).toBe(expected.startTime);
    }

    const typeClanLocator = lastEvent.type;
    if (expected.eventType === EventType.VOICE || expected.eventType === EventType.LOCATION) {
      if (expected.clanStatus === ClanStatus.PUBLIC) {
        await expect(typeClanLocator).toBe('Clan Event');
      } else if (expected.clanStatus === ClanStatus.PRIVATE) {
        await expect(typeClanLocator).toBe('Channel Event');
      }
    } else if (expected.eventType === EventType.PRIVATE) {
      await expect(typeClanLocator).toBe('Private Event');
    }

    return true;
  }
  async verifyInEventDetailModal(expected: {
    eventTopic: string;
    description?: string;
    channelName?: string;
    startTime: string;
  }): Promise<boolean> {
    await this.createEventModal.openEventDetailModalButton.last().click();
    await this.eventDetailModal.modal.waitFor({ state: 'visible', timeout: 5000 });

    const topic = this.eventDetailModal.topic;
    await expect(topic).toHaveText(expected.eventTopic);

    if (expected.description) {
      const description = this.eventDetailModal.description;
      await expect(description).toHaveText(expected.description);
    }

    if (expected.channelName) {
      const channelName = this.eventDetailModal.channelName;
      await expect(channelName).toHaveText(expected.channelName);
    }

    const startDateTime = this.eventDetailModal.startDateTime;
    await expect(startDateTime).toHaveText(expected.startTime);
    return true;
  }
}
