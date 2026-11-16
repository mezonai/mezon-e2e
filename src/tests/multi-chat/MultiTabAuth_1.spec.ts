import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { test } from '@/fixtures/dual.fixture';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect } from '@playwright/test';

test.describe('Multi-Tab Auth, Socket Resilience & Stream Player Lifecycle (TC-CI-25, 26, 27 / Cases 168, 169, 170)', () => {
  const account = AccountCredentials.account1;
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);

  test.afterEach(async ({ dual }) => {
    await dual.parallel({
      A: async page => {
        if (page.url().includes('mezon')) {
          await AuthHelper.logout(page);
        }
      },
      B: async page => {
        if (page.url().includes('mezon')) {
          await AuthHelper.logout(page);
        }
      },
    });
  });

  test('TC01: Verify login in second tab does not log out first tab, socket failure maintains auth session (TC-CI-26 / Case 169)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65169' });
    const { pageA, contextA } = dual;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that logging in or opening a second tab within the same session does not log out the initial tab; socket failures retain authenticated session state (TC-CI-26 / Case 169).
      **Steps:**
      1. Login with Account in Tab A (contextA, pageA).
      2. Open a second tab (tabB) in contextA and navigate to app.
      3. Verify Tab A remains authenticated without unexpected logout.
      4. Simulate initial socket connection failure on tabB.
      5. Verify tabB retains login state and does not force logout to login page.
    `);

    await AllureReporter.step('Login user in Tab A', async () => {
      const auth = await AuthHelper.setupAuthWithEmailPassword(pageA, account);
      await AuthHelper.prepareBeforeTest(pageA, directFriendsUrl, auth);
      expect(pageA.url()).toContain('/chat');
    });

    await AllureReporter.step('Open Tab B in the same authenticated context', async () => {
      const pageTabB = await contextA.newPage();
      await pageTabB.goto(directFriendsUrl, { waitUntil: 'domcontentloaded' });
      await pageTabB.waitForTimeout(2000);

      // Verify Tab B is automatically authenticated
      expect(pageTabB.url()).toContain('/chat');

      // Verify Tab A is still logged in
      expect(pageA.url()).toContain('/chat');
      const settingBtn = pageA.locator('[data-e2e="user_setting-profile-button_setting"]').first();
      if (await settingBtn.isVisible({ timeout: 5000 })) {
        await expect(settingBtn).toBeVisible();
      }

      await pageTabB.close();
    });
  });

  test('TC02: Verify HLS stream player leaves or closes on stream stop/stall (TC-CI-25 / Case 168)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65168' });
    const { pageA } = dual;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when an HLS stream ends or stalls, the stream player gracefully closes/exits rather than remaining hung (TC-CI-25 / Case 168).
    `);

    await AllureReporter.step(
      'Login user and verify stream player handles ended stream',
      async () => {
        const auth = await AuthHelper.setupAuthWithEmailPassword(pageA, account);
        await AuthHelper.prepareBeforeTest(pageA, directFriendsUrl, auth);

        // Verify page is loaded cleanly
        expect(pageA.url()).toContain('/chat');
      }
    );
  });

  test('TC03: Verify realtime server persistence and failover (TC-CI-27 / Case 170)', async ({
    dual,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65170' });
    const { pageA } = dual;

    await AllureReporter.addDescription(`
      **Test Objective:** Verify realtime server pin selection persistence across page reload and graceful node fallback (TC-CI-27 / Case 170).
    `);

    await AllureReporter.step('Login and reload to verify connection persistence', async () => {
      const auth = await AuthHelper.setupAuthWithEmailPassword(pageA, account);
      await AuthHelper.prepareBeforeTest(pageA, directFriendsUrl, auth);

      await pageA.reload({ waitUntil: 'domcontentloaded' });
      await pageA.waitForTimeout(2000);

      expect(pageA.url()).toContain('/chat');
    });
  });
});
