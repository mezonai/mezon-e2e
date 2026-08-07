import ClanSelector from '@/data/selectors/ClanSelector';
import MessageSelector from '@/data/selectors/MessageSelector';
import { expect, Page } from '@playwright/test';

export class MessageMediaHelpers {
  protected readonly page: Page;
  protected readonly selector: MessageSelector;

  constructor(page: Page) {
    this.page = page;
    this.selector = new MessageSelector(page);
  }

  async openGifsPopover() {
    return this.selector.media.gifs.button.openPopover.click();
  }

  async openGifsTrending() {
    return this.selector.media.gifs.popover.trending.click();
  }

  async sendGifsMessage() {
    const firstGif = this.selector.media.gifs.popover.item.last();
    const alt = await firstGif.locator('img').getAttribute('alt');
    await firstGif.click();
    if (alt) {
      await expect(this.selector.messages.locator(`div[id*="${alt}"]`).first()).toBeVisible({
        timeout: 5000,
      });
    }
    return alt;
  }

  async isGifMessageVisible(gifName: string | null): Promise<boolean> {
    const gifMessage = this.selector.messages.locator(`div[id*="${gifName}"]`);
    return gifMessage.first().isVisible();
  }

  async isErrorModalVisible(): Promise<boolean> {
    try {
      await this.selector.errorModal.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async clickCancelModal() {
    const cancelButton = new ClanSelector(this.page).permissionModal.cancel;
    await cancelButton.click();
  }

  async openGalleryModal() {
    return this.selector.headerGalleryButton.click();
  }

  async isGifVisibleOnGalleryTab(gifName: string | null): Promise<boolean> {
    if (!gifName) return false;

    return this.page.locator(`img[src*="${gifName}"]`).first().isVisible();
  }

  async openImagesTabOnGallery() {
    return this.selector.media.gallery.tabs.images.click();
  }
}
