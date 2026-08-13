import { AccountCredentials, GLOBAL_CONFIG } from '@/config/environment';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AuthHelper } from '@/utils/authHelper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { test } from '@playwright/test';

export function registerCleanupTests(shardIndex: number, shardCount: number): void {
  const sortedAccounts = Object.entries(AccountCredentials).sort(
    ([firstAccountName], [secondAccountName]) =>
      firstAccountName.localeCompare(secondAccountName, undefined, { numeric: true })
  );
  const accountsPerShard = Math.ceil(sortedAccounts.length / shardCount);
  const shardStartIndex = shardIndex * accountsPerShard;
  const accounts = sortedAccounts.slice(shardStartIndex, shardStartIndex + accountsPerShard);

  for (const [accountName, account] of accounts) {
    test(`Clean up clans for ${accountName}`, async ({ page }) => {
      const credentials = await AuthHelper.setupAuthWithEmailPassword(page, account);
      await AuthHelper.prepareBeforeTest(
        page,
        joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS),
        credentials
      );

      const clanPage = new ClanPage(page);
      const messagePage = new MessagePage(page);
      await clanPage.deleteAllClans({});
      await messagePage.leaveAllGroup();
      await AuthHelper.logout(page);
    });
  }
}
