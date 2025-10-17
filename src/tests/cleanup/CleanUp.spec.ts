import { AccountCredentials } from '@/config/environment';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { AuthHelper } from '@/utils/authHelper';
import { test } from '@playwright/test';

(() => {
  for (const [accountName, account] of Object.entries(AccountCredentials)) {
    test(`Clean up clans for ${accountName}`, async ({ page }) => {
      await AuthHelper.setupAuthWithEmailPassword(page, account);
      const clanPage = new ClanPage(page);
      await clanPage.deleteAllClans({
        onlyDeleteExpired: true,
      });
      await AuthHelper.logout(page);
    });
  }
})();
