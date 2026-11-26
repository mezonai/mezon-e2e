import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

const EVENT_LOCATION_TYPE_SELECTOR = generateE2eSelector(
  'clan_page.modal.create_event.location.type'
);
const CHANNEL_PANEL_ITEM_SELECTOR = generateE2eSelector('clan_page.channel_list.panel.item');

export default class ClanEventSelector {
  constructor(private readonly page: Page) {}

  readonly modal = {
    createEventButton: this.page
      .locator(generateE2eSelector('clan_page.modal.create_event.button_create'))
      .or(this.page.getByRole('button', { name: /^create event$/i }))
      .or(this.page.locator('button').filter({ hasText: /^Create Event$/i }))
      .or(this.page.locator('div, span, a').filter({ hasText: /^Create Event$/i }))
      .first(),
    nextButton: this.page
      .locator(generateE2eSelector('clan_page.modal.create_event.next'))
      .or(this.page.getByRole('button', { name: /^next$/i }))
      .or(this.page.locator('button').filter({ hasText: /^Next$/i }))
      .or(this.page.locator('div, span').filter({ hasText: /^Next$/i }))
      .first(),
  };

  readonly createModal = {
    modal: this.page.locator(generateE2eSelector('clan_page.modal.create_event')),
    modalStart: this.page.locator(generateE2eSelector('clan_page.modal.create_event.start_modal')),
    type: {
      voice: this.page
        .getByRole('radio', { name: /Voice Channel/i })
        .or(
          this.page
            .locator('div, label')
            .filter({ has: this.page.getByRole('heading', { name: 'Voice Channel' }) })
            .filter({ has: this.page.getByRole('radio') })
        )
        .or(this.page.locator(EVENT_LOCATION_TYPE_SELECTOR, { hasText: 'Voice Channel' }))
        .last(),
      location: this.page
        .getByRole('radio', { name: /Somewhere Else/i })
        .or(
          this.page
            .locator('div, label')
            .filter({ has: this.page.getByRole('heading', { name: /Somewhere Else/i }) })
            .filter({ has: this.page.getByRole('radio') })
        )
        .or(this.page.locator(EVENT_LOCATION_TYPE_SELECTOR, { hasText: 'Somewhere else' }))
        .last(),
      private: this.page
        .getByRole('radio', { name: /Create External Event/i })
        .or(
          this.page
            .locator('div, label')
            .filter({ has: this.page.getByRole('heading', { name: /Create External Event/i }) })
            .filter({ has: this.page.getByRole('radio') })
        )
        .or(this.page.locator(EVENT_LOCATION_TYPE_SELECTOR, { hasText: 'Create External Event' }))
        .last(),
    },
    input: {
      eventTopic: this.page
        .locator(generateE2eSelector('clan_page.modal.create_event.event_info.input.event_topic'))
        .or(this.page.getByPlaceholder(/event topic/i))
        .or(this.page.locator('input[placeholder*="topic" i], input[placeholder*="Event" i]')),
      startDateInput: this.page
        .locator(
          `
          ${generateE2eSelector('clan_page.modal.create_event.event_info.input.start_date')}
          div.w-full
          input
        `
        )
        .or(this.page.locator('input[placeholder*="YYYY" i], input[placeholder*="date" i]')),
      startTime: this.page
        .locator(
          `${generateE2eSelector('clan_page.modal.create_event.event_info.input.start_time')} div`
        )
        .or(this.page.locator('input[placeholder*="time" i]')),
      endDate: this.page
        .locator(
          `
          ${generateE2eSelector('clan_page.modal.create_event.event_info.input.end_date')}
          div.w-full
          input
        `
        )
        .or(this.page.locator('input[placeholder*="end date" i]')),
      endTime: this.page
        .locator(
          `${generateE2eSelector('clan_page.modal.create_event.event_info.input.end_time')} div`
        )
        .or(this.page.locator('input[placeholder*="end time" i]')),
      description: this.page
        .locator(
          `${generateE2eSelector('clan_page.modal.create_event.event_info.input.description')} div textarea`
        )
        .or(this.page.getByPlaceholder(/description/i))
        .or(this.page.locator('textarea')),
      locationName: this.page
        .locator(generateE2eSelector('clan_page.modal.create_event.location.input'))
        .or(this.page.getByPlaceholder(/location/i)),
    },
    selectVoiceChannel: this.page
      .locator(
        `${generateE2eSelector('clan_page.modal.create_event.location')} div:has-text("Select Voice channel")`
      )
      .or(
        this.page
          .locator(generateE2eSelector('clan_page.modal.create_event.location'))
          .locator('div[class*="select"], button, [role="combobox"]')
      )
      .or(this.page.getByRole('combobox'))
      .or(this.page.locator('div, button').filter({ hasText: /^Select Channel$/i }))
      .or(this.page.locator('text=/select (voice )?channel/i')),
    selectChannel: this.page
      .locator(
        `${generateE2eSelector('clan_page.modal.create_event.location')} div:has-text("Select channel")`
      )
      .or(
        this.page
          .locator(generateE2eSelector('clan_page.modal.create_event.location'))
          .locator('div[class*="select"], button, [role="combobox"]')
      )
      .or(this.page.getByRole('combobox'))
      .or(this.page.locator('div, button').filter({ hasText: /^Select Channel$/i }))
      .or(this.page.locator('text=/select channel/i')),
    channelItem: this.page
      .locator(generateE2eSelector('clan_page.modal.create_event.location.channel.item'))
      .or(this.page.getByRole('option'))
      .or(
        this.page.locator(
          '[role="listbox"] [role="option"], div.rc-virtual-list-holder-inner > div, div[data-menu-id]'
        )
      ),
    startTimeReview: this.page
      .locator(generateE2eSelector('clan_page.modal.create_event.review.start_time'))
      .or(this.page.locator('[data-e2e*="review.start_time"], [data-e2e*="review-start_time"]')),
    typeClanReview: this.page
      .locator(generateE2eSelector('clan_page.modal.create_event.review.type'))
      .or(this.page.locator('[data-e2e*="review.type"], [data-e2e*="review-type"]')),
    eventTopicReview: this.page
      .locator(generateE2eSelector('clan_page.modal.create_event.review.event_topic'))
      .or(this.page.locator('[data-e2e*="review.event_topic"], [data-e2e*="review-event_topic"]'))
      .or(this.page.locator('h3, h4, p').filter({ hasText: /^E2E event/ })),
    descriptionReview: this.page
      .locator(generateE2eSelector('clan_page.modal.create_event.review.description'))
      .or(this.page.locator('[data-e2e*="review.description"], [data-e2e*="review-description"]'))
      .or(this.page.locator('p').filter({ hasText: /^This is an/ })),
    voiceChannelReview: this.page
      .locator(generateE2eSelector('clan_page.modal.create_event.review.voice_channel'))
      .or(
        this.page.locator('[data-e2e*="review.voice_channel"], [data-e2e*="review-voice_channel"]')
      ),
    textChannelReview: this.page
      .locator(generateE2eSelector('clan_page.modal.create_event.review.text_channel'))
      .or(
        this.page.locator('[data-e2e*="review.text_channel"], [data-e2e*="review-text_channel"]')
      ),
    locationNameReview: this.page
      .locator(generateE2eSelector('clan_page.modal.create_event.review.location_name'))
      .or(
        this.page.locator('[data-e2e*="review.location_name"], [data-e2e*="review-location_name"]')
      ),
    eventManagementItem: this.page
      .locator(generateE2eSelector('clan_page.modal.create_event.event_management.item'))
      .or(
        this.page.locator(
          '[data-e2e*="event_management"], [data-e2e*="event-item"], div[class*="event-card"], div[class*="eventItem"]'
        )
      )
      .or(
        this.page
          .locator('div')
          .filter({ has: this.page.getByRole('button', { name: /interested|share/i }) })
      ),
    numberOfEvent: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.event_management.number_of_event')
    ),
    openEventDetailModalButton: this.page
      .locator(
        generateE2eSelector(
          'clan_page.modal.create_event.event_management.item.button.open_detail_modal'
        )
      )
      .or(
        this.page.locator(
          '[data-e2e*="open_detail_modal"], [data-e2e*="event_management"] [role="button"], div[class*="event-card"] button, div[class*="eventItem"] button'
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
      openPanel: this.page
        .locator(
          generateE2eSelector(
            'clan_page.modal.create_event.event_management.item.button.open_panel'
          )
        )
        .or(
          this.page.locator(
            '[data-e2e*="open_panel"], [data-e2e*="button-open_panel"], div[class*="event"] button:has(svg), button[aria-label*="More"], button[aria-label*="Option"]'
          )
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
    numberOfInterestedInModal: this.page
      .locator(
        generateE2eSelector(
          'clan_page.modal.create_event.event_management.item.modal_detail_item.number_of_interested'
        )
      )
      .first(),
    numberOfInterested: this.page
      .locator(
        generateE2eSelector(
          'clan_page.modal.create_event.event_management.item.number_of_interested'
        )
      )
      .first(),
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
