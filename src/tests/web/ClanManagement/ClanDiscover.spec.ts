import { test, expect } from '@playwright/test';
import ClanDiscoverPage from '../../../pages/Clan/ClanDiscoverPage';

test.describe('Discover Clan Management', () => {
  let discoverPage: ClanDiscoverPage;

  test.beforeEach(async ({ page }) => {
    discoverPage = new ClanDiscoverPage(page);
    await discoverPage.gotoDiscover();
  });

  test('Case 32: Discover: search and filter by category', async () => {
    await expect(discoverPage.selectors.categoryChips.first()).toBeVisible({ timeout: 10000 });

    await discoverPage.toggleCategoryFilter('Gaming');
    await discoverPage.verifyCategoryChipPressed('Gaming', true);

    await expect(discoverPage.selectors.exploreHeading).toContainText('Gaming', { timeout: 10000 });
    await expect(discoverPage.selectors.exploreSection).toBeVisible();
  });

  test('Case 33: Discover: remove individual filter and reset all', async () => {
    await discoverPage.toggleCategoryFilter('Gaming');
    await discoverPage.verifyCategoryChipPressed('Gaming', true);
    await expect(discoverPage.selectors.exploreHeading).toContainText('Gaming', { timeout: 10000 });

    await discoverPage.toggleCategoryFilter('Gaming');
    await discoverPage.verifyCategoryChipPressed('Gaming', false);

    await expect(discoverPage.selectors.exploreHeading).toHaveText(
      /Explore Communities|Find your people/i,
      {
        timeout: 10000,
      }
    );
    await discoverPage.verifyClanListLoaded();
  });

  test('Case 34: Discover: empty state and clear search', async () => {
    const nonexistentTerm = 'nonexistent_clan_query_xyz_99999';
    await discoverPage.searchClans(nonexistentTerm);

    await discoverPage.verifyEmptyStateVisible();
    await discoverPage.clearSearchViaButton();
    await discoverPage.verifyClanListLoaded();
  });

  test('Case 35: Discover: clan list pagination', async () => {
    const pager = discoverPage.selectors.pagination;
    const isPaginationVisible = await pager.container
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (!isPaginationVisible) {
      test.skip(
        true,
        'Environment does not have enough public clans to render pagination navigation'
      );
      return;
    }

    await expect(pager.container).toBeVisible({ timeout: 10000 });

    await expect(pager.previousButton).toBeDisabled();

    await discoverPage.goToNextPage();

    await expect(pager.previousButton).toBeEnabled({ timeout: 10000 });
    await expect(pager.currentPageButton).toContainText('02');

    await discoverPage.goToPreviousPage();

    await expect(pager.previousButton).toBeDisabled({ timeout: 10000 });
    await expect(pager.currentPageButton).toContainText('01');
  });

  test('Case 36: Discover: clan detail, join and share', async () => {
    await discoverPage.verifyClanListLoaded();
    await discoverPage.openClanDetailByIndex(0);

    await expect(discoverPage.selectors.clanDetail.title).toBeVisible({ timeout: 10000 });
    await expect(discoverPage.selectors.clanDetail.breadcrumbDiscover).toBeVisible();
    await expect(discoverPage.selectors.clanDetail.shareButton).toBeVisible();
    await expect(discoverPage.selectors.clanDetail.joinButton).toBeVisible();

    await discoverPage.openShareModal();
    await expect(discoverPage.selectors.modals.dialog).toBeVisible();
    await expect(discoverPage.selectors.modals.copyLinkButton).toBeVisible();
    await discoverPage.closeActiveModal();

    await discoverPage.openJoinModal();
    await expect(discoverPage.selectors.modals.dialog).toBeVisible();
    await expect(discoverPage.selectors.modals.joinNowButton).toBeVisible();
    await discoverPage.closeActiveModal();
  });
});
