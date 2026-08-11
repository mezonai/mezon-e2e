import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

const EVENT_DETAIL_SELECTOR = generateE2eSelector('timeline.events.trigger.event_detail');

export default class MessageTimelineSelector {
  constructor(private readonly page: Page) {}

  readonly buttons = {
    openTab: this.page.locator(generateE2eSelector('chat.channel_message.header.button.timeline')),
    create: this.page.locator(generateE2eSelector('timeline.buttons.create_new')),
    uploadImage: this.page.locator(generateE2eSelector('timeline.modal.input.attachment')),
    triggerEventDetail: this.page.locator(EVENT_DETAIL_SELECTOR),
    addDescription: this.page.locator(generateE2eSelector('timeline.buttons.add_description')),
    saveModal: this.page.locator(generateE2eSelector('timeline.modal.button.save')),
    editTitle: this.page.locator(generateE2eSelector('timeline.buttons.edit_title')),
    save: this.page.locator(generateE2eSelector('timeline.buttons.save')),
    back: this.page.locator(generateE2eSelector('timeline.buttons.back')),
    addMedia: this.page.locator(generateE2eSelector('timeline.buttons.add_media')),
    openCalendar: this.page.locator(generateE2eSelector('timeline.buttons.calendar')),
    selectedYear: this.page.locator(generateE2eSelector('timeline.buttons.selected_year')),
  };

  readonly input = {
    title: this.page.locator(generateE2eSelector('timeline.input.title')),
    description: this.page.locator(generateE2eSelector('timeline.input.description')),
  };

  readonly modalInput = {
    eventTitle: this.page.locator(generateE2eSelector('timeline.modal.input.title')),
    eventDate: this.page.locator(`${generateE2eSelector('timeline.modal.input.date')} input`),
    eventDescription: this.page.locator(generateE2eSelector('timeline.modal.input.description')),
  };

  readonly eventTime = {
    item: this.page.locator(generateE2eSelector('timeline.events.time')),
    month: this.page.locator(generateE2eSelector('timeline.events.time.month')),
    day: this.page.locator(generateE2eSelector('timeline.events.time.day')),
    year: this.page.locator(generateE2eSelector('timeline.events.time.year')),
  };

  readonly eventDetail = {
    name: this.page.locator(`${EVENT_DETAIL_SELECTOR} h4`),
    description: this.page.locator(`${EVENT_DETAIL_SELECTOR} p`),
  };

  readonly card = {
    title: this.page.locator(generateE2eSelector('timeline.events.card.title')),
    description: this.page.locator(generateE2eSelector('timeline.events.card.description')),
    createdTime: this.page.locator(generateE2eSelector('timeline.events.card.created_time')),
  };
}
