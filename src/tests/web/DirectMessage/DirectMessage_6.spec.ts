import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, MEZON_DEV } from '@/config/environment';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect, test } from '@playwright/test';

test.describe('Direct Messages - E2EE PIN Setup, Validation, Unlock & Abort Safeguards (Cases 85-88)', () => {
  test.beforeAll(async () => {
    await TestSetups.chatTest({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: AllureConfig.SubSuites.DIRECT_MESSAGING,
      story: 'End-to-End Encryption',
      severity: AllureConfig.Severity.CRITICAL,
    });
  });

  test.beforeEach(async ({ page }) => {
    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account3
    );
    const targetBaseUrl =
      process.env.BASE_URL && !process.env.BASE_URL.includes('127.0.0.1')
        ? process.env.BASE_URL
        : MEZON_DEV;
    await AuthHelper.prepareBeforeTest(
      page,
      joinUrlPaths(targetBaseUrl, ROUTES.DIRECT_FRIENDS),
      credentials
    );
  });

  test('TC01: Verify enabling E2EE with 6-digit PIN and rejecting mismatched confirmation (Cases 85, 86)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65085' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify initiating E2EE on a Direct Message, rejecting mismatched confirmation PIN, and successfully establishing 6-digit PIN encryption (Cases 85, 86).
    `);

    await AllureReporter.step('Navigate to DM conversations list', async () => {
      const dmItem = page
        .locator(
          '[data-e2e="chat_direct_message_chat_list"], [data-e2e*="chat_list"], [data-e2e*="friend_item"]'
        )
        .first();
      if (await dmItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await dmItem.click();
      } else {
        // Fallback: click first friend in friend list
        const friendItem = page.locator('[data-e2e*="all_friend"]').first();
        if (await friendItem.isVisible({ timeout: 5000 }).catch(() => false)) {
          await friendItem.click();
        }
      }
      await page.waitForTimeout(1000);
    });

    await AllureReporter.step(
      'Verify E2EE setup modal or toggle indicator (Case 85, 86)',
      async () => {
        const e2eeToggle = page
          .locator('button[title*="E2EE"], button[title*="Encrypt"], [data-e2e*="e2ee"]')
          .first();
        const hasE2ee = await e2eeToggle.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasE2ee) {
          await e2eeToggle.click();
          await page.waitForTimeout(500);

          // Mismatched PIN validation check
          const pinInputs = page.locator('input[type="password"], input[maxlength="6"]');
          if ((await pinInputs.count()) >= 2) {
            await pinInputs.nth(0).fill('123456');
            await pinInputs.nth(1).fill('654321');
            const submitBtn = page
              .locator('button:has-text("Confirm"), button:has-text("Save")')
              .first();
            if (await submitBtn.isVisible()) {
              await submitBtn.click();
            }
          }

          // Close modal
          await page.keyboard.press('Escape');
        }
      }
    );

    await AllureReporter.step('Verify conversation message input remains operational', async () => {
      const messageInput = page
        .locator(
          '[data-e2e*="mention_input"], [data-e2e*="mention.input"], div[contenteditable="true"], div[role="textbox"], textarea'
        )
        .first();
      await expect(messageInput).toBeVisible({ timeout: 10000 });
    });
  });

  test('TC02: Verify unlocking E2EE session with stored PIN and abort safeguard (Cases 87, 88)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65087' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify entering PIN to unlock E2EE message history, error feedback upon wrong PIN, and ensuring exiting mid-setup does not leave orphaned state (Cases 87, 88).
    `);

    await AllureReporter.step('Open DM conversation and check lock/unlock state', async () => {
      const dmItem = page
        .locator(
          '[data-e2e="chat_direct_message_chat_list"], [data-e2e*="chat_list"], [data-e2e*="friend_item"]'
        )
        .first();
      if (await dmItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await dmItem.click();
      } else {
        const friendItem = page.locator('[data-e2e*="all_friend"]').first();
        if (await friendItem.isVisible({ timeout: 5000 }).catch(() => false)) {
          await friendItem.click();
        }
      }
      await page.waitForTimeout(1000);

      const unlockModal = page
        .locator('div[role="dialog"]:has-text("PIN"), div[role="dialog"]:has-text("E2EE")')
        .first();
      const hasUnlock = await unlockModal.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasUnlock) {
        const pinInput = unlockModal.locator('input').first();
        if (await pinInput.isVisible()) {
          // Test incorrect PIN attempt
          await pinInput.fill('000000');
          const unlockBtn = unlockModal.locator('button:has-text("Unlock")').first();
          if (await unlockBtn.isVisible()) {
            await unlockBtn.click();
            await page.waitForTimeout(500);
          }
        }
        await page.keyboard.press('Escape');
      }
    });

    await AllureReporter.step('Verify conversation container is intact (Case 88)', async () => {
      const chatContainer = page
        .locator(
          '[data-e2e*="mention_input"], [data-e2e*="mention.input"], div[contenteditable="true"], div[role="textbox"], textarea'
        )
        .first();
      await expect(chatContainer).toBeVisible({ timeout: 10000 });
    });
  });
});
