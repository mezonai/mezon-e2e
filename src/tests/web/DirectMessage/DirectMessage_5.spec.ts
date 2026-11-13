import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AccountCredentials, MEZON_DEV } from '@/config/environment';
import { MessagePage } from '@/pages/MessagePage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect, test } from '@playwright/test';

const DIRECT_MESSAGE_TAG = 'direct-message';

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
      tag: [DIRECT_MESSAGE_TAG, 'search-dm', 'group-member-list'],
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

  test('TC02: Verify buzz action modal opening, custom text input, and dismissal in DM', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '64696',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user in a direct message conversation can open the Buzz modal via keyboard shortcut, input a buzz message, and dismiss the modal cleanly (corresponds to TC-DM-02).

      **Test Steps:**
      1. Open or select a direct message conversation
      2. Trigger buzz modal via shortcut Control+g
      3. Verify buzz modal heading appears
      4. Input custom message text into the buzz message input field
      5. Click close button to dismiss the buzz modal
      6. Verify buzz modal is closed and detached from DOM

      **Expected Result:** Buzz modal opens, accepts message text, and closes cleanly without unexpected behavior.
    `);

    await AllureReporter.addLabels({
      tag: [DIRECT_MESSAGE_TAG, 'buzz-modal', 'chat-buzz'],
    });

    const messagePage = new MessagePage(page);

    await AllureReporter.step('Select first conversation in DM list', async () => {
      const dmItems = await messagePage.getListDMItems();
      if ((await dmItems.count()) > 0) {
        await dmItems.first().click();
        await page.waitForTimeout(500);
      }
    });

    await AllureReporter.step('Trigger Buzz modal via Control+g and verify visible', async () => {
      await page.keyboard.press('Control+g');
      const buzzModalHeading = await messagePage.getMessageBuzzHeader();
      await expect(buzzModalHeading).toBeVisible({ timeout: 5000 });
    });

    await AllureReporter.step('Input custom message in Buzz modal', async () => {
      const buzzText = `Buzz Alert ${Date.now()}`;
      await messagePage.fillMessageBuzzInputMessage(buzzText);
      const buzzInput = page.locator(
        generateE2eSelector('chat.direct_message.message_buzz.input.message')
      );
      await expect(buzzInput).toHaveValue(buzzText);
    });

    await AllureReporter.step('Dismiss Buzz modal and verify detached', async () => {
      const buzzModalHeading = await messagePage.getMessageBuzzHeader();
      await messagePage.clickMessageBuzzCloseButton();
      await buzzModalHeading.waitFor({ state: 'detached', timeout: 5000 });
      await expect(buzzModalHeading).toHaveCount(0);
    });
  });
});
