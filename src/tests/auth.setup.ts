import { test as setup } from '@playwright/test';
import { WEBSITE_CONFIGS, persistentAuthConfigs } from '../config/environment';

// Setup authentication states for all accounts in persistentAuthConfigs
setup('prepare all mezon auth states', async ({ browser }) => {
  for (const [accountKey, authConfig] of Object.entries(persistentAuthConfigs)) {
    const accountName = accountKey.replace('account', 'account-test');
    const accountAuthFile = `playwright/.auth/${accountKey}.json`;

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(WEBSITE_CONFIGS.MEZON.baseURL as string);

      // Set mezon session
      const mezonSession = {
        host: 'dev-mezon.nccsoft.vn',
        port: '7305',
        ssl: true,
      };

      // Set authentication data in localStorage
      await page.evaluate(
        authData => {
          // Set mezon session
          localStorage.setItem('mezon_session', JSON.stringify(authData.mezonSession));

          localStorage.setItem('i18nextLng', 'en');

          // Set persist auth data
          localStorage.setItem(
            'persist:auth',
            JSON.stringify({
              loadingStatus: authData.persistAuth.loadingStatus,
              session: authData.persistAuth.session,
              isLogin: authData.persistAuth.isLogin,
              isRegistering: authData.persistAuth.isRegistering,
              loadingStatusEmail: authData.persistAuth.loadingStatusEmail,
              redirectUrl: authData.persistAuth.redirectUrl,
              activeAccount: authData.persistAuth.activeAccount,
              _persist: authData.persistAuth._persist,
            })
          );
        },
        {
          mezonSession,
          persistAuth: authConfig,
        }
      );

      await page.reload();

      try {
        await clickOpenMezonButton(page);
      } catch (error) {
        console.warn(`Could not click Open Mezon button for ${accountName}:`, error);
      }

      // Save the authentication state
      await context.storageState({ path: accountAuthFile });

      console.log(`Authentication state saved for ${accountName} to ${accountAuthFile}`);
    } catch (error) {
      console.error(`Error setting up auth state for ${accountName}:`, error);
    }
  }
});

async function clickOpenMezonButton(page: any) {
  try {
    const openMezonSelectors = [
      'button:has-text("Open Mezon")',
      'button:has-text("Open mezon")',
      '[data-testid="open-mezon"]',
      '.open-mezon-btn',
      'a:has-text("Open Mezon")',
      'a:has-text("Open mezon")',
    ];

    for (const selector of openMezonSelectors) {
      try {
        const button = page.locator(selector);
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          await page.waitForLoadState('networkidle');
          return;
        }
      } catch (e) {
        console.error('Error clicking Open Mezon button:', e);
      }
    }
  } catch (error) {
    console.error('Error during clickOpenMezonButton process:', error);
  }
}
