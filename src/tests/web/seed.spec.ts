import { test, expect } from '@playwright/test';
import { AuthHelper } from '@/utils/authHelper';
import { AccountCredentials, GLOBAL_CONFIG } from '@/config/environment';
import { ROUTES } from '@/selectors';
import joinUrlPaths from '@/utils/joinUrlPaths';

test.describe('Seed Test - Environment Setup', () => {
  test('seed', async ({ page }) => {
    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account2
    );

    await AuthHelper.prepareBeforeTest(
      page,
      joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS),
      credentials
    );

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*direct.*/);
  });
});
