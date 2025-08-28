import { test, expect } from '@playwright/test';
import { ProfilesPage } from '../../pages/ProfilesPage';
import { WEBSITE_CONFIGS } from '../../config/environment';

const CLAN_CHAT_URL = `${WEBSITE_CONFIGS.MEZON.baseURL}chat/clans/1786228934740807680/channels/1786228934753390593`;

test.describe('User Profile - Clan Profiles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CLAN_CHAT_URL);
    await page.waitForLoadState('domcontentloaded');
    const settingsButton = page.locator('[data-e2e="user_setting-profile-button_setting"]').first();
    await settingsButton.waitFor({ state: 'visible', timeout: 10000 });
    await settingsButton.scrollIntoViewIfNeeded();
    await expect(settingsButton).toBeVisible();
    await expect(settingsButton).toBeEnabled();
    try {
      await settingsButton.click({ timeout: 10000 });
    } catch {
      await page.waitForTimeout(500);
      await settingsButton.click({ force: true, timeout: 5000 });
    }

    const profileTab = page.locator('[data-e2e="user_setting-profile-tab_profile"]').first();
    await profileTab.waitFor({ state: 'visible', timeout: 15000 });
    await profileTab.scrollIntoViewIfNeeded();
    await profileTab.click();

    const clanProfileTab = page
      .locator('[data-e2e="user_setting-profile-clan_profile-button"]')
      .first();
    await clanProfileTab.waitFor({ state: 'visible', timeout: 15000 });
    await clanProfileTab.scrollIntoViewIfNeeded();
    await clanProfileTab.click();
  });

  test('Change avatar clan - button visible', async ({ page }) => {
    const profiles = new ProfilesPage(page);
    await profiles.clickChangeAvatar();
  });

  test('Change clan nickname', async ({ page }) => {
    const profiles = new ProfilesPage(page);
    const target = `kien.trinhduy-${Date.now()}`;
    await profiles.changeNickname(target);
    await profiles.saveChanges();
  });

  test('Remove avatar clan', async ({ page }) => {
    const profiles = new ProfilesPage(page);
    await profiles.removeAvatarAndSave();
  });
});
