import { Page } from '@playwright/test';

export default class ClanDiscoverSelector {
  constructor(private readonly page: Page) {}

  readonly searchInput = this.page.locator('#discover-search, input[type="search"]');

  readonly categoryChips = this.page.locator('button[aria-pressed]');

  getCategoryChip(category: string) {
    const clean = category.replace(/^#/, '');
    return this.page.locator(`button[aria-pressed]:has-text("#${clean}")`).first();
  }

  readonly selectedCategoryChips = this.page.locator('button[aria-pressed="true"]');

  readonly exploreSection = this.page.locator('#explore-communities');

  readonly exploreHeading = this.page.locator('#explore-heading');

  readonly clanRows = this.page.locator('#explore-communities ol > li');

  readonly clanRowLinks = this.page.locator('#explore-communities ol > li a');

  readonly verifiedOnlyCheckbox = this.page
    .locator('#explore-communities input[type="checkbox"]')
    .first();

  readonly sortSelect = this.page.locator('#explore-communities select').first();

  readonly emptyState = {
    container: this.page.locator('section#explore-communities .text-center'),
    clearSearchButton: this.page.getByRole('button', { name: /Clear search/i }),
    clearFiltersButton: this.page.getByRole('button', { name: /Clear filters/i }),
  };

  readonly pagination = {
    container: this.page.locator('nav[aria-label="Pagination"]'),
    previousButton: this.page.locator(
      'nav[aria-label="Pagination"] button[aria-label="Previous page"]'
    ),
    nextButton: this.page.locator('nav[aria-label="Pagination"] button[aria-label="Next page"]'),
    currentPageButton: this.page.locator(
      'nav[aria-label="Pagination"] button[aria-current="page"]'
    ),
    pageButtons: this.page.locator('nav[aria-label="Pagination"] ol button'),
  };

  readonly clanDetail = {
    title: this.page.locator('.discover-detail-stage h1, main h1').first(),
    breadcrumbDiscover: this.page.locator('nav a:has-text("Discover")'),
    joinButton: this.page.getByRole('button', { name: /Join Clan/i }).first(),
    shareButton: this.page.getByRole('button', { name: /Share Clan/i }).first(),
  };

  readonly modals = {
    dialog: this.page.getByRole('dialog'),
    dialogTitle: this.page.getByRole('dialog').locator('h2'),
    closeButton: this.page.getByRole('dialog').locator('button:has(svg)').first(),
    joinNowButton: this.page.getByRole('dialog').getByRole('button', { name: /Join Now/i }),
    copyLinkButton: this.page.getByRole('dialog').getByRole('button', { name: /Copy/i }),
    copiedButton: this.page.getByRole('dialog').getByRole('button', { name: /Copied!/i }),
    inviteUrlInput: this.page.getByRole('dialog').locator('input[readonly]'),
  };
}
