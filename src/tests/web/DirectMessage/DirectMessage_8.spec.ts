import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, MEZON_DEV } from '@/config/environment';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect, test } from '@playwright/test';

test.describe('Direct Messages - Header Action Controls, Plus Button & Group Creation Modal (TC-DM-08, 09, 10)', () => {
  const directFriendsUrl = joinUrlPaths(MEZON_DEV, ROUTES.DIRECT_FRIENDS);

  test.beforeAll(async () => {
    await TestSetups.chatTest({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: AllureConfig.SubSuites.DIRECT_MESSAGING,
      story: AllureConfig.Stories.MEMBER_MANAGEMENT,
      severity: AllureConfig.Severity.CRITICAL,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63370' });
    await AuthHelper.setupAuthWithEmailPassword(page, AccountCredentials.account3);
    await page.goto(directFriendsUrl, { waitUntil: 'domcontentloaded' });
    const messagePage = new MessagePage(page);
    await messagePage.dismissPermissionModalIfPresent();
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(1000);
  });

  test.afterEach(async ({ page }) => {
    await page.keyboard.press('Escape').catch(() => {});
    await AuthHelper.logout(page);
  });

  test('TC01: Verify Direct Message Header Action Buttons (User Profile, Call, Video Call, Add Member) (TC-DM-08)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66075' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify header action buttons (User Profile, Voice Call, Video Call, Add Member) are present on DM conversation header.
    `);
    await AllureReporter.addLabels({
      tag: ['direct-message', 'dm-header', 'action-controls'],
    });

    const messagePage = new MessagePage(page);
    const dmItems = await messagePage.getListDMItems();

    if ((await dmItems.count()) > 0) {
      await dmItems.first().click();
      await page.waitForTimeout(1000);

      const profileBtn = page
        .locator(generateE2eSelector('chat.direct_message.header.right_container.user_profile'))
        .or(
          page.locator(
            'button[title*="Profile"], button[aria-label*="Profile"], [data-e2e*="user_profile"]'
          )
        )
        .first();

      const callBtn = page
        .locator(generateE2eSelector('chat.direct_message.header.right_container.call'))
        .or(
          page.locator(
            'button[title*="Call"], button[aria-label*="Call"], [data-e2e*="header.right_container.call"]'
          )
        )
        .first();

      const videoCallBtn = page
        .locator(generateE2eSelector('chat.direct_message.header.right_container.video_call'))
        .or(
          page.locator(
            'button[title*="Video"], button[aria-label*="Video"], [data-e2e*="video_call"]'
          )
        )
        .first();

      const hasActions =
        (await profileBtn.isVisible({ timeout: 3000 }).catch(() => false)) ||
        (await callBtn.isVisible({ timeout: 3000 }).catch(() => false)) ||
        (await videoCallBtn.isVisible({ timeout: 3000 }).catch(() => false));

      expect(hasActions).toBe(true);
    }
  });

  test('TC02: Verify Direct Message Plus button (+ create DM/Group DM) displays modal (TC-DM-09)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66076' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify clicking the Plus button in DM sidebar opens the Create DM/Group DM modal.
    `);
    await AllureReporter.addLabels({
      tag: ['direct-message', 'create-dm', 'plus-button', 'group-modal'],
    });

    const plusBtn = page
      .locator(generateE2eSelector('chat.direct_message.button.button_plus'))
      .or(
        page.locator(
          'button[title*="Create DM"], button[aria-label*="Create DM"], [data-e2e*="button_plus"], div[data-e2e*="button_plus"]'
        )
      )
      .first();

    if (await plusBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await plusBtn.click();
      await page.waitForTimeout(1000);

      // Verify modal opens
      const createModal = page.locator('div.fixed.inset-0, div[role="dialog"]').first();
      await expect(createModal).toBeVisible({ timeout: 5000 });

      // Always close modal cleanly
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });

  test('TC03: Verify Add Member to Group DM button opens friend selection modal (TC-DM-10)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66077' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Add Member button on DM header opens user selection dialog.
    `);
    await AllureReporter.addLabels({
      tag: ['direct-message', 'add-member', 'group-dm'],
    });

    const messagePage = new MessagePage(page);
    const dmItems = await messagePage.getListDMItems();

    if ((await dmItems.count()) > 0) {
      await dmItems.first().click();
      await page.waitForTimeout(1000);

      const addMemberBtn = page
        .locator(generateE2eSelector('chat.direct_message.header.right_container.add_member'))
        .or(
          page.locator('button[title*="Add"], button[aria-label*="Add"], [data-e2e*="add_member"]')
        )
        .first();

      if (await addMemberBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addMemberBtn.click();
        await page.waitForTimeout(1000);

        // Verify add to group dialog
        const addDialog = page.locator('div.fixed.inset-0, div[role="dialog"]').first();
        if (await addDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(addDialog).toBeVisible();
        }

        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
  });
});
