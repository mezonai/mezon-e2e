import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import ClanDiscoverSelector from '../../data/selectors/ClanDiscoverSelector';

export default class ClanDiscoverPage extends BasePage {
  readonly selectors: ClanDiscoverSelector;

  constructor(page: Page) {
    super(page);
    this.selectors = new ClanDiscoverSelector(page);
  }

  async gotoDiscover(url: string = 'https://mezon.ai/clans/') {
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(this.selectors.exploreSection).toBeVisible({ timeout: 15000 });
  }

  async searchClans(query: string) {
    await this.selectors.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async clearSearchViaButton() {
    await expect(this.selectors.emptyState.clearSearchButton).toBeVisible({ timeout: 10000 });
    await this.selectors.emptyState.clearSearchButton.click();
    await expect(this.selectors.searchInput).toHaveValue('');
  }

  async toggleCategoryFilter(category: string) {
    const chip = this.selectors.getCategoryChip(category);
    await expect(chip).toBeVisible({ timeout: 10000 });
    await chip.click();
  }

  async verifyCategoryChipPressed(category: string, pressed: boolean) {
    const chip = this.selectors.getCategoryChip(category);
    await expect(chip).toHaveAttribute('aria-pressed', pressed ? 'true' : 'false', {
      timeout: 10000,
    });
  }

  async verifyEmptyStateVisible() {
    await expect(this.selectors.emptyState.container).toBeVisible({ timeout: 10000 });
    await expect(this.selectors.emptyState.clearSearchButton).toBeVisible({ timeout: 10000 });
  }

  async verifyClanListLoaded() {
    await expect(this.selectors.clanRowLinks.first()).toBeVisible({ timeout: 15000 });
  }

  async goToNextPage() {
    await expect(this.selectors.pagination.container).toBeVisible({ timeout: 10000 });
    await expect(this.selectors.pagination.nextButton).toBeEnabled({ timeout: 10000 });
    await this.selectors.pagination.nextButton.click();
  }

  async goToPreviousPage() {
    await expect(this.selectors.pagination.container).toBeVisible({ timeout: 10000 });
    await expect(this.selectors.pagination.previousButton).toBeEnabled({ timeout: 10000 });
    await this.selectors.pagination.previousButton.click();
  }

  async openClanDetailByIndex(index: number = 0) {
    const clanLink = this.selectors.clanRowLinks.nth(index);
    await expect(clanLink).toBeVisible({ timeout: 10000 });
    await clanLink.click();
    await expect(this.selectors.clanDetail.title).toBeVisible({ timeout: 15000 });
  }

  async openShareModal() {
    await expect(this.selectors.clanDetail.shareButton).toBeVisible({ timeout: 10000 });
    await this.selectors.clanDetail.shareButton.click();
    await expect(this.selectors.modals.dialog).toBeVisible({ timeout: 10000 });
  }

  async openJoinModal() {
    await expect(this.selectors.clanDetail.joinButton).toBeVisible({ timeout: 10000 });
    await this.selectors.clanDetail.joinButton.click();
    await expect(this.selectors.modals.dialog).toBeVisible({ timeout: 10000 });
  }

  async closeActiveModal() {
    await expect(this.selectors.modals.dialog).toBeVisible();
    await this.selectors.modals.closeButton.click();
    await expect(this.selectors.modals.dialog).toBeHidden({ timeout: 10000 });
  }
}
