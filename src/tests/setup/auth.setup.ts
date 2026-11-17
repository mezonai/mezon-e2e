import { AccountCredentials } from '@/config/environment';
import { LoginPage } from '@/pages/LoginPage';
import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authDir = path.resolve('playwright/.auth');
const MAX_CACHE_AGE_MINUTES = 60;

setup('Authenticate accounts and generate storageState', async ({ browser }) => {
  setup.setTimeout(300 * 1000);

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const authenticateAccount = async (
    accountKey: string,
    credentials: { email: string; password: string }
  ) => {
    const authFile = path.join(authDir, `${accountKey}.json`);

    // Check if recent valid cached storageState exists
    if (fs.existsSync(authFile) && !process.env.FORCE_AUTH) {
      try {
        const stat = fs.statSync(authFile);
        const ageMinutes = (Date.now() - stat.mtimeMs) / (1000 * 60);
        if (ageMinutes < MAX_CACHE_AGE_MINUTES) {
          const content = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
          if (content.cookies?.length > 0 && content.origins?.length > 0) {
            console.log(
              `[auth.setup] Using cached storageState for ${accountKey} (${Math.round(ageMinutes)}m old)`
            );
            return;
          }
        }
      } catch {
        // Re-authenticate if cache read failed
      }
    }

    try {
      console.log(`[auth.setup] Authenticating ${accountKey} (${credentials.email})...`);
      const context = await browser.newContext();
      const page = await context.newPage();
      const loginPage = new LoginPage(page);
      await loginPage.loginWithPassword(credentials.email, credentials.password);
      await context.storageState({ path: authFile });
      await context.close();
      console.log(`[auth.setup] ✓ Saved storageState for ${accountKey}`);
    } catch (err) {
      console.warn(`[auth.setup] ✗ Failed to pre-authenticate ${accountKey}:`, err);
    }
  };

  const accountsToAuth: Array<{ key: string; creds: { email: string; password: string } }> = [
    { key: 'account1', creds: AccountCredentials.account1 },
    { key: 'account2', creds: AccountCredentials.account2 },
    { key: 'account3', creds: AccountCredentials.account3 },
    { key: 'account4', creds: AccountCredentials.account4 },
    { key: 'account5', creds: AccountCredentials.account5 },
    { key: 'account6', creds: AccountCredentials.account6 },
    { key: 'account7', creds: AccountCredentials.account7 },
    { key: 'account8', creds: AccountCredentials.account8 },
    { key: 'account9', creds: AccountCredentials.account9 },
    { key: 'account2-1', creds: AccountCredentials['account2-1'] },
    { key: 'account2-2', creds: AccountCredentials['account2-2'] },
    { key: 'account2-3', creds: AccountCredentials['account2-3'] },
    { key: 'account2-4', creds: AccountCredentials['account2-4'] },
    { key: 'account2-5', creds: AccountCredentials['account2-5'] },
  ];

  // Run in chunks of 3 concurrent authentications to balance speed and dev server load
  const chunkSize = 3;
  for (let i = 0; i < accountsToAuth.length; i += chunkSize) {
    const chunk = accountsToAuth.slice(i, i + chunkSize);
    await Promise.all(chunk.map(a => authenticateAccount(a.key, a.creds)));
  }
});
