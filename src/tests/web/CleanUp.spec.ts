import { test } from '@playwright/test';
import { AuthHelper } from '@/utils/authHelper';
import { AccountCredentials, GLOBAL_CONFIG } from '@/config/environment';
import { ROUTES } from '@/selectors';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { ClanPageV2 } from '@/pages/ClanPageV2';

(() => {
  for (const [accountName, account] of Object.entries(AccountCredentials)) {
    test(`Clean up clans for ${accountName}`, async ({ page }) => {
      await AuthHelper.setupAuthWithEmailPassword(page, account);
      await page.goto(joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS), {
        waitUntil: 'domcontentloaded',
      });

      await page.waitForTimeout(3000);
      const clanPage = new ClanPageV2(page);

      const clanItems = await clanPage.sidebar.clanItems;
      const clanItemsCount = await clanItems.clanName.count();

      if (clanItemsCount === 0) {
        await AuthHelper.logout(page);
        return;
      }

      for (let i = clanItemsCount - 1; i >= 0; i--) {
        try {
          const currentClanItems = await clanPage.sidebar.clanItems;
          const currentCount = await currentClanItems.clanName.count();

          if (i >= currentCount) {
            continue;
          }

          const clanItem = currentClanItems.clanName.nth(i);

          await clanItem.click();
          await clanPage.deleteClan(true, clanItem);
        } catch (error) {
          console.error(`❌ Failed to delete clan at index ${i}: ${error}`);
          continue;
        }
      }

      await AuthHelper.logout(page);
    });
  }
})();
