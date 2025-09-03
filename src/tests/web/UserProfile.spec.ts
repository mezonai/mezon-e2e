import { expect, test } from '@playwright/test';
import { WEBSITE_CONFIGS } from '../../config/environment';

const CLAN_CHAT_URL = `${WEBSITE_CONFIGS.MEZON.baseURL}chat/clans/1786228934740807680/channels/1786228934753390593`;

test.describe('User Profile - Clan Profiles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CLAN_CHAT_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-e2e="user_setting-profile-button_setting"]', {
      state: 'visible',
      timeout: 10000,
    });
    await page.locator('[data-e2e="user_setting-profile-button_setting"]').click();
    const profileTab = page.locator('[data-e2e="user_setting-profile-tab_profile"]');
    await profileTab.waitFor({ state: 'visible', timeout: 10000 });
    await profileTab.click();
    const clanProfileTab = page.locator('[data-e2e="user_setting-profile-clan_profile-button"]');
    await clanProfileTab.waitFor({ state: 'visible', timeout: 10000 });
    await clanProfileTab.click();
  });

  test('Change avatar clan - button visible', async ({ page }) => {
    const changeAvatarButton = page.locator(
      '[data-e2e="user_setting-profile-clan_profile-button_change_avatar"]'
    );
    await expect(changeAvatarButton).toBeVisible({ timeout: 10000 });
  });

  test('Change clan nickname', async ({ page }) => {
    await test.step('Enter new nickname', async () => {
      const nicknameInput = page
        .locator('[data-e2e="user_setting-profile-clan_profile-input_nickname"]')
        .first();
      await expect(nicknameInput).toBeVisible({ timeout: 10000 });
      await nicknameInput.click();
      const isMac = process.platform === 'darwin';
      const target = `kien.trinhduy-${Date.now()}`;
      let ok = false;
      for (let i = 0; i < 3; i++) {
        await nicknameInput.press(isMac ? 'Meta+A' : 'Control+A');
        await nicknameInput.press('Backspace');
        await page.waitForTimeout(50);
        await nicknameInput.type(target, { delay: 40 });
        await page.waitForTimeout(150);
        const v = await nicknameInput.inputValue();
        if (v === target) {
          ok = true;
          break;
        }
      }
      if (!ok) {
        await nicknameInput.evaluate((el: HTMLInputElement, value: string) => {
          el.value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, target);
      }
      await nicknameInput.evaluate((el: HTMLInputElement) => {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.blur();
      });
      await page.waitForTimeout(800);
      await expect(nicknameInput).toHaveValue(target, { timeout: 3000 });
    });

    await test.step('Save nickname changes', async () => {
      const saveChangesBtn = page.locator(
        '[data-e2e="user_setting-profile-clan_profile-button_save_changes"]'
      );
      await saveChangesBtn.scrollIntoViewIfNeeded();
      await expect(saveChangesBtn).toBeVisible({ timeout: 10000 });
      await expect(saveChangesBtn).toBeEnabled({ timeout: 10000 });
      await saveChangesBtn.click();
    });
  });

  test.skip('Remove avatar clan', async () => {});
});
