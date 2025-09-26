import { test as setup } from '@playwright/test';
import {
  WEBSITE_CONFIGS,
  persistentAuthConfigs,
  getBrowserConfig,
  isCI,
} from '../config/environment';
import fs from 'fs';
import path from 'path';

// Retry configuration for CI environment
const MAX_RETRIES = isCI() ? 3 : 1;
const RETRY_DELAY = 2000;

// Helper function to sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Ensure auth directory exists
const ensureAuthDir = () => {
  const authDir = path.join(process.cwd(), 'playwright', '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log(`📁 Created auth directory: ${authDir}`);
  }
};

// Setup authentication states for all accounts in persistentAuthConfigs
setup('prepare all mezon auth states', async ({ browser }) => {
  // Ensure the auth directory exists
  ensureAuthDir();

  for (const [accountKey, authConfig] of Object.entries(persistentAuthConfigs)) {
    const accountName = accountKey.replace('account', 'account-test');
    const accountAuthFile = `playwright/.auth/${accountKey}.json`;

    let success = false;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES && !success; attempt++) {
      let context = null;
      let page = null;

      try {
        // Create browser context with CI-specific options
        const contextOptions = isCI()
          ? {
              // CI-specific viewport and settings for better stability
              viewport: { width: 1280, height: 720 },
              ignoreHTTPSErrors: true,
              // Reduce resource usage in CI
              bypassCSP: true,
            }
          : {
              viewport: { width: 1280, height: 720 },
              ignoreHTTPSErrors: true,
            };

        context = await browser.newContext(contextOptions);
        page = await context.newPage();

        // Navigate to the base URL with proper error handling
        await page.goto(WEBSITE_CONFIGS.MEZON.baseURL as string, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        // Set mezon session
        const mezonSession = {
          host: 'dev-mezon.nccsoft.vn',
          port: '7305',
          ssl: true,
        };

        // Set authentication data in localStorage with error handling
        await page.evaluate(
          authData => {
            try {
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
            } catch (error) {
              console.error('Error setting localStorage:', error);
              throw error;
            }
          },
          {
            mezonSession,
            persistAuth: authConfig,
          }
        );

        // Reload page with better error handling and wait conditions
        try {
          await page.reload({
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });
        } catch (reloadError) {
          console.warn(`Reload failed for ${accountName}, trying navigation instead:`, reloadError);
          // Fallback: navigate to the same URL instead of reload
          await page.goto(WEBSITE_CONFIGS.MEZON.baseURL as string, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });
        }

        try {
          await clickOpenMezonButton(page);
        } catch (error) {
          console.warn(`Could not click Open Mezon button for ${accountName}:`, error);
        }

        // Save the authentication state
        await context.storageState({ path: accountAuthFile });

        success = true;
        console.log(`Authentication state saved for ${accountName} to ${accountAuthFile}`);
      } catch (error) {
        lastError = error as Error;
        console.error(
          `❌ Error setting up auth state for ${accountName} (attempt ${attempt}/${MAX_RETRIES}):`,
          error
        );

        if (attempt < MAX_RETRIES) {
          console.log(`⏳ Waiting ${RETRY_DELAY}ms before retry...`);
          await sleep(RETRY_DELAY);
        }
      } finally {
        // Always cleanup resources
        try {
          if (page && !page.isClosed()) {
            await page.close();
          }
        } catch (pageCloseError) {
          console.warn(`Warning: Could not close page for ${accountName}:`, pageCloseError);
        }

        try {
          if (context) {
            await context.close();
          }
        } catch (contextCloseError) {
          console.warn(`Warning: Could not close context for ${accountName}:`, contextCloseError);
        }
      }
    }

    // If all retries failed, log the final error but don't throw (to continue with other accounts)
    if (!success && lastError) {
      console.error(
        `🚨 Failed to setup auth for ${accountName} after ${MAX_RETRIES} attempts. Last error:`,
        lastError
      );
      if (isCI()) {
        // In CI, we might want to continue with other accounts rather than failing completely
        console.error(`⚠️  Continuing with other accounts despite ${accountName} failure...`);
      }
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

    // Wait a bit for the page to stabilize
    await page.waitForTimeout(1000);

    for (const selector of openMezonSelectors) {
      try {
        const button = page.locator(selector);

        // Check if button exists and is visible
        const isVisible = await button.isVisible({ timeout: 3000 });
        if (isVisible) {
          // Ensure button is clickable
          await button.waitFor({ state: 'visible', timeout: 5000 });

          // Scroll to button if needed
          await button.scrollIntoViewIfNeeded();

          // Click with retry logic
          let clicked = false;
          for (let clickAttempt = 1; clickAttempt <= 3 && !clicked; clickAttempt++) {
            try {
              await button.click({ timeout: 5000 });
              clicked = true;
            } catch (clickError) {
              console.warn(`Click attempt ${clickAttempt} failed:`, clickError);
              if (clickAttempt < 3) {
                await page.waitForTimeout(1000);
              }
            }
          }

          if (clicked) {
            try {
            } catch (navError) {
              console.warn('Navigation wait timed out, but continuing:', navError);
            }
            return;
          }
        }
      } catch (selectorError) {
        console.warn(`Selector ${selector} failed:`, selectorError);
      }
    }

    console.warn('No Open Mezon button found with any selector, but continuing...');
  } catch (error) {
    console.error('Error during clickOpenMezonButton process:', error);
    // Don't throw - this is optional functionality
  }
}
