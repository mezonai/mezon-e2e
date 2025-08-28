import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MEZON_TEST_USERS } from '../data/static/TestUsers';
import { LOCAL_CONFIG, LOCAL_AUTH_DATA, WEBSITE_CONFIGS } from '../config/environment';

const authFile = 'playwright/.auth/user.json';

setup('prepare mezon auth state', async ({ page }) => {
  if (LOCAL_CONFIG.isLocal && LOCAL_CONFIG.skipLogin) {
    try {
      await page.goto(WEBSITE_CONFIGS.MEZON.baseURL as string);
      await page.waitForLoadState('networkidle');

      await page.evaluate(authData => {
        localStorage.setItem(authData.persist.key, JSON.stringify(authData.persist.value));
        localStorage.setItem(authData.mezonSession.key, authData.mezonSession.value);
      }, LOCAL_AUTH_DATA);

      await page.reload();
      await page.waitForLoadState('networkidle');

      await clickOpenMezonButton(page);
      await page.context().storageState({ path: authFile });
      return;
    } catch (error) {}
  }

  const fs = await import('fs');
  if (fs.existsSync(authFile)) {
    const stats = fs.statSync(authFile);
    const ageInMinutes = (Date.now() - stats.mtime.getTime()) / (1000 * 60);

    if (ageInMinutes < 60) {
      return;
    }
  }

  const loginPage = new LoginPage(page);
  const testUser = MEZON_TEST_USERS.MAIN_USER;

  try {
    await loginPage.navigate();

    await loginPage.enterEmail(testUser.email);
    await loginPage.clickSendOtp();
    await loginPage.enterOtp(testUser.otp);

    await page.waitForTimeout(3000);

    if (!page.url().includes('/login/callback') && !page.url().includes('/chat')) {
      try {
        await loginPage.clickVerifyOtp();
      } catch {}
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    try {
      const mezonSession = {
        host: 'dev-mezon.nccsoft.vn',
        port: '7305',
        ssl: true,
      };
      await page.evaluate(sessionConfig => {
        localStorage.setItem('mezon_session', JSON.stringify(sessionConfig));
      }, mezonSession);
    } catch {}

    await page.context().storageState({ path: authFile });
  } catch (error: unknown) {
    await page.screenshot({ path: 'debug-auth-setup.png', fullPage: true });
    await page.context().storageState({ path: authFile });
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
      } catch (e) {}
    }
  } catch (error) {}
}
