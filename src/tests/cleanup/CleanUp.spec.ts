import { AccountCredentials } from '@/config/environment';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { AuthHelper } from '@/utils/authHelper';
import { test } from '@playwright/test';

(() => {
  for (const [accountName, account] of Object.entries(AccountCredentials)) {
    test(`Clean up clans for ${accountName}`, async ({ page }) => {
      await AuthHelper.setupAuthWithEmailPassword(page, account);
      const clanPage = new ClanPage(page);
      const messagePage = new MessagePage(page);
      await clanPage.deleteAllClans({
        // onlyDeleteExpired: true,
      });
      await messagePage.leaveAllGroup();
      await AuthHelper.logout(page);
    });
  }
})();
