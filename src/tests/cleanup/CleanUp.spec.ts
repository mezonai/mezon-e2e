import { AccountCredentials } from '@/config/environment';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { AuthHelper } from '@/utils/authHelper';
import { test } from '@playwright/test';

(() => {
  for (const [accountName, account] of Object.entries(AccountCredentials)) {
    test(`Clean up clans for ${accountName}`, async ({ page }) => {
      await AuthHelper.setupAuthWithEmailPassword(page, account);
      const clanPage = new ClanPageV2(page);
      await clanPage.deleteAllClans({
        onlyDeleteExpired: true,
      });
      await AuthHelper.logout(page);
    });
  }
})();
