import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class MessageMediaSelector {
  constructor(private readonly page: Page) {}

  readonly gifs = {
    button: {
      openPopover: this.page.locator(generateE2eSelector('mention.button.gif')),
    },
    popover: {
      trending: this.page.locator(generateE2eSelector('mention.popover.gifs.trending')),
      category: this.page.locator(generateE2eSelector('mention.popover.gifs.category')),
      item: this.page.locator(generateE2eSelector('mention.popover.gifs.item')),
    },
  };

  readonly gallery = {
    container: this.page.locator(generateE2eSelector('clan_page.modal.gallery')),
    tabs: {
      all: this.page.locator(generateE2eSelector('clan_page.modal.gallery.tab.all')),
      images: this.page.locator(generateE2eSelector('clan_page.modal.gallery.tab.image')),
      videos: this.page.locator(generateE2eSelector('clan_page.modal.gallery.tab.video')),
    },
    items: {
      all: this.page.locator(generateE2eSelector('clan_page.modal.gallery.all')),
      images: this.page.locator(generateE2eSelector('clan_page.modal.gallery.image')),
      videos: this.page.locator(generateE2eSelector('clan_page.modal.gallery.video')),
    },
  };
}
