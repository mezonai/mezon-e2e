import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MEZON_TEST_USERS } from '../data/static/TestUsers';

const authFile = 'playwright/.auth/user.json';

setup('prepare mezon auth state', async ({ page }) => {
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
      } catch {
        // Ignore errors
        // Ignore verify OTP errors
      }
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
    } catch {
      // Ignore errors
      // Ignore localStorage errors
    }

    await page.context().storageState({ path: authFile });
  } catch (error: unknown) {
    await page.screenshot({ path: 'debug-auth-setup.png', fullPage: true });
    await page.context().storageState({ path: authFile });
  }
});
