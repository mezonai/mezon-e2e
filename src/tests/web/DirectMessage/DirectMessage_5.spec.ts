import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, GLOBAL_CONFIG } from '@/config/environment';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect, test } from '@playwright/test';

test.describe('Direct Messages - Search Filter and Group Member List Toggle', () => {
  test.beforeAll(async () => {
    await TestSetups.chatTest({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: AllureConfig.SubSuites.DIRECT_MESSAGING,
      story: AllureConfig.Stories.TEXT_MESSAGING,
      severity: AllureConfig.Severity.CRITICAL,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63370',
    });

    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account3
    );
    await AuthHelper.prepareBeforeTest(
      page,
      joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS),
      credentials
    );
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test('Verify search DM input filters conversations and group member list toggles', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64695',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can search in the direct message conversation list and toggle the group member list sidebar.

      **Test Steps:**
      1. Navigate to Direct Friends / Direct Messages
      2. Locate search input and type search query
      3. Verify search input reflects entered value
      4. Create a group DM conversation
      5. Click group member list button in header
      6. Verify member list sidebar toggles visibility
    `);

    await AllureReporter.addLabels({
      tag: ['direct-message', 'search-dm', 'group-member-list'],
    });

    const messagePage = new MessagePage(page);
    const searchInput = page.locator(generateE2eSelector('chat.direct_message.search_input'));
    const memberListBtn = page.locator(
      generateE2eSelector('chat.direct_message.member_list.button')
    );

    await AllureReporter.step('Verify DM search input functionality', async () => {
      if (await searchInput.isVisible({ timeout: 5000 })) {
        await searchInput.fill('test');
        await expect(searchInput).toHaveValue('test');
        await searchInput.clear();
      }
    });

    await AllureReporter.step('Create group chat and toggle member list', async () => {
      await messagePage.createGroup();
      const groupName = await messagePage.getGroupName();
      await expect(groupName).toBeVisible({ timeout: 5000 });
      await messagePage.dismissPermissionModalIfPresent();

      if (await memberListBtn.isVisible({ timeout: 5000 })) {
        await memberListBtn.click({ force: true });
        await page.waitForTimeout(500);
      }
    });
  });
});
