import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

const EVENT_LOCATION_TYPE_SELECTOR = generateE2eSelector(
  'clan_page.modal.create_event.location.type'
);
const CHANNEL_PANEL_ITEM_SELECTOR = generateE2eSelector('clan_page.channel_list.panel.item');

export default class ClanEventSelector {
  constructor(private readonly page: Page) {}

  readonly modal = {
    createEventButton: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.button_create')
    ),
    nextButton: this.page.locator(generateE2eSelector('clan_page.modal.create_event.next')),
  };

  readonly createModal = {
    modal: this.page.locator(generateE2eSelector('clan_page.modal.create_event')),
    modalStart: this.page.locator(generateE2eSelector('clan_page.modal.create_event.start_modal')),
    type: {
      voice: this.page.locator(EVENT_LOCATION_TYPE_SELECTOR, {
        hasText: 'Voice Channel',
      }),
      location: this.page.locator(EVENT_LOCATION_TYPE_SELECTOR, { hasText: 'Somewhere else' }),
      private: this.page.locator(EVENT_LOCATION_TYPE_SELECTOR, {
        hasText: 'Create External Event',
      }),
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
      endDate: this.page.locator(`
        ${generateE2eSelector('clan_page.modal.create_event.event_info.input.end_date')}
        div.w-full
        input
      `),
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
    numberOfEvent: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.event_management.number_of_event')
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
      editEvent: this.page.locator(CHANNEL_PANEL_ITEM_SELECTOR, {
        hasText: 'Edit Event',
      }),
      updateEvent: this.page.locator(
        generateE2eSelector('clan_page.modal.create_event.button_edit')
      ),
      cancelEvent: this.page.locator(CHANNEL_PANEL_ITEM_SELECTOR, {
        hasText: 'Cancel Event',
      }),
      copyEventLink: this.page.locator(CHANNEL_PANEL_ITEM_SELECTOR, {
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

  readonly detailModal = {
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
    numberOfInterestedInModal: this.page.locator(
      generateE2eSelector(
        'clan_page.modal.create_event.event_management.item.modal_detail_item.number_of_interested'
      )
    ),
    numberOfInterested: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.event_management.item.number_of_interested')
    ),
    tab: {
      eventInfo: this.page.locator(
        generateE2eSelector(
          'clan_page.modal.create_event.event_management.item.modal_detail_item.tab.event_info'
        )
      ),
      numberOfInterested: this.page.locator(
        generateE2eSelector(
          'clan_page.modal.create_event.event_management.item.modal_detail_item.tab.number_of_interested'
        )
      ),
    },
    userInterested: {
      displayName: this.page.locator(
        generateE2eSelector(
          'clan_page.modal.create_event.event_management.item.modal_detail_item.user_interested.item.display_name'
        )
      ),
    },
    button: {
      interested: this.page.locator(
        generateE2eSelector('clan_page.modal.create_event.event_management.item.button.interested'),
        { hasText: 'Interested' }
      ),
      uninterested: this.page.locator(
        generateE2eSelector('clan_page.modal.create_event.event_management.item.button.interested'),
        { hasText: 'Uninterested' }
      ),
    },
  };
}
