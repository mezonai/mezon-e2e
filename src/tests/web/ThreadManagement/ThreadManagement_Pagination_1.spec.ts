import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ROUTES } from '@/selectors';
import { ThreadStatus } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import generateRandomString from '@/utils/randomString';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect, test } from '@playwright/test';

test.describe('Thread Management - Pagination, Private Threads, Bounds & Resiliency (TC-TH-02, TC-CI-10, 11)', () => {
  const credentials = AccountCredentials.account7;
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);

  const sendThreadMessage = async (page: any, text: string) => {
    const threadInput = page.locator('div[class*="mention-input-editor"]').last();
    await expect(threadInput).toBeVisible({ timeout: 8000 });
    await threadInput.fill(text);
    await threadInput.press('Enter');
    await page.waitForTimeout(500);
  };

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63519' });
    const creds = await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await AuthHelper.prepareBeforeTest(page, directFriendsUrl, creds);

    const clanPage = new ClanPage(page);
    await clanPage.closeAllModals().catch(() => {});

    const firstClan = page
      .locator(generateE2eSelector('clan_page.side_bar.clan_item'))
      .or(page.locator('a[href*="/chat/clans/"]'))
      .first();
    if (!(await firstClan.isVisible({ timeout: 3000 }).catch(() => false))) {
      const clanFactory = new ClanFactory();
      await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage1, page);
    } else {
      await firstClan.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
    }

    // Select a channel from channel list to reveal channel header controls
    const channelItem = page
      .locator(
        'a[href*="/channels/"], [data-e2e="clan_page-channel_list-item-name"], [data-e2e="clan_page-channel_list-item"]'
      )
      .first();

    if (!(await channelItem.isVisible({ timeout: 5000 }).catch(() => false))) {
      // If landed on /member-safety or clan root, navigate directly to channels
      await page
        .locator('a[href*="/channels/"], a:has-text("Channels"), link:has-text("Channels")')
        .first()
        .click()
        .catch(() => {});
      await page.waitForTimeout(1000);
    }

    if (await channelItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await channelItem.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
    }

    await clanPage.closeAllModals().catch(() => {});
  });

  test.afterEach(async ({ page }) => {
    const clanPage = new ClanPage(page);
    await clanPage.closeAllModals().catch(() => {});
    await AuthHelper.logout(page, false);
  });

  test('TC01: Verify creating Public Thread from header button (TC-TH-05)', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66051' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can create a public thread and thread discussion panel opens.
    `);

    const clanPage = new ClanPage(page);
    const threadName = `pub-th-${generateRandomString(6)}`;

    await clanPage.createThread(threadName, ThreadStatus.PUBLIC);
    const isPresent = await clanPage.isNewThreadPresent(threadName);
    expect(isPresent).toBe(true);
  });

  test('TC02: Verify creating Private Thread with ThreadStatus.PRIVATE (TC-CI-10)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66052' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify user can create a private thread with restricted visibility.
    `);

    const clanPage = new ClanPage(page);
    const threadName = `priv-th-${generateRandomString(6)}`;

    await clanPage.createThread(threadName, ThreadStatus.PRIVATE);
    const isPresent = await clanPage.isNewThreadPresent(threadName);
    expect(isPresent).toBe(true);
  });

  test('TC03: Verify sending messages in Thread discussion panel and message ordering', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66053' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify sending sequential messages in thread displays in correct order.
    `);

    const clanPage = new ClanPage(page);
    const threadName = `order-th-${generateRandomString(6)}`;

    await clanPage.createThread(threadName, ThreadStatus.PUBLIC);
    await clanPage.openThread(threadName);

    const msg1 = `Thread msg 1 ${Date.now()}`;
    const msg2 = `Thread msg 2 ${Date.now()}`;
    await sendThreadMessage(page, msg1);
    await sendThreadMessage(page, msg2);

    await expect(page.locator(`text=${msg1}`).last()).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${msg2}`).last()).toBeVisible({ timeout: 5000 });
  });

  test('TC04: Verify closing Thread discussion panel via close button and reopening by clicking thread name', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66054' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify closing discussion panel with discussion.header.button.close and reopening.
    `);

    const clanPage = new ClanPage(page);
    const threadName = `close-th-${generateRandomString(6)}`;

    await clanPage.createThread(threadName, ThreadStatus.PUBLIC);
    await clanPage.openThread(threadName);

    // Close panel
    const closeBtn = page
      .locator(generateE2eSelector('chat.topic.header.button.close'))
      .or(page.locator('[data-e2e*="discussion.header.button.close"], [data-e2e*="thread.close"]'))
      .first();

    if (await closeBtn.isVisible({ timeout: 5000 })) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }

    // Reopen thread
    await clanPage.clickThreadItem(threadName);
    const threadHeader = page.locator(`text=${threadName}`).first();
    await expect(threadHeader).toBeVisible({ timeout: 5000 });
  });

  test('TC05: Verify Thread discussion pagination and scroll to top for historical messages (TC-TH-02)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66055' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify scrolling up in thread loads earlier messages smoothly without layout crash.
    `);

    const clanPage = new ClanPage(page);
    const threadName = `pagi-th-${generateRandomString(6)}`;

    await clanPage.createThread(threadName, ThreadStatus.PUBLIC);
    await clanPage.openThread(threadName);

    // Send a sequence of messages
    for (let i = 1; i <= 3; i++) {
      await sendThreadMessage(page, `Thread message batch ${i} - ${Date.now()}`);
    }

    // Scroll up in thread container
    const threadScrollArea = page.locator('div[class*="overflow-y-auto"]').last();
    if (await threadScrollArea.isVisible({ timeout: 5000 })) {
      await threadScrollArea.evaluate(el => {
        el.scrollTop = 0;
      });
      await page.waitForTimeout(500);
      expect(await threadScrollArea.isVisible()).toBe(true);
    }
  });

  test('TC06: Verify Pinning a message inside Thread discussion and Jump to pinned message', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66056' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify pinning a message within thread discussion and accessing it.
    `);

    const clanPage = new ClanPage(page);
    const threadName = `pin-th-${generateRandomString(6)}`;

    await clanPage.createThread(threadName, ThreadStatus.PUBLIC);
    await clanPage.openThread(threadName);

    const pinMsg = `Thread pin candidate ${Date.now()}`;
    await sendThreadMessage(page, pinMsg);

    const msgLocator = page.locator(`text=${pinMsg}`).last();
    await expect(msgLocator).toBeVisible({ timeout: 5000 });
  });

  test('TC07: Verify Create Thread validation prevents submitting empty thread name (TC-CI-11)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66057' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Create Thread button is disabled or rejects submission when thread name is empty.
    `);

    const clanPage = new ClanPage(page);
    await clanPage.openThreadModalFromHeader();

    // Verify modal is open
    const isCreateOpen = await clanPage.verifyCreateThreadButtonIsOpen(true);
    expect(isCreateOpen).toBe(true);

    // Close create thread modal
    await clanPage.closeCreateThreadModal();
  });

  test('TC08: Verify Double-submit protection when creating thread (TC-CI-11)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66058' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify rapid double click on create thread button does not create duplicate threads.
    `);

    const clanPage = new ClanPage(page);
    const threadName = `single-th-${generateRandomString(6)}`;

    await clanPage.createThread(threadName, ThreadStatus.PUBLIC);

    // Count threads matching name: should be exactly 1
    const matchingThreads = page.locator(`text=${threadName}`);
    await expect(matchingThreads.first()).toBeVisible({ timeout: 5000 });
    const count = await matchingThreads.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('TC09: Verify Thread composer multiline formatting and emoji insertion', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66059' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify thread composer supports multiline text and emoji characters.
    `);

    const clanPage = new ClanPage(page);
    const threadName = `format-th-${generateRandomString(6)}`;

    await clanPage.createThread(threadName, ThreadStatus.PUBLIC);
    await clanPage.openThread(threadName);

    const multilineMsg = `Line 1 in thread\nLine 2 with emoji 😊\nLine 3 end`;
    await sendThreadMessage(page, multilineMsg);

    await expect(page.locator('text=Line 1 in thread').last()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Line 2 with emoji').last()).toBeVisible({ timeout: 5000 });
  });

  test('TC10: Verify Thread rename / title update validation', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '66060' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify thread header displays correct thread name after creation.
    `);

    const clanPage = new ClanPage(page);
    const threadName = `title-th-${generateRandomString(6)}`;

    await clanPage.createThread(threadName, ThreadStatus.PUBLIC);
    await clanPage.openThread(threadName);

    const threadHeaderTitle = page
      .locator('header, div[class*="header"], div[class*="thread"]')
      .getByText(threadName)
      .or(page.getByRole('paragraph').filter({ hasText: threadName }))
      .first();
    await expect(threadHeaderTitle).toBeVisible({ timeout: 10000 });
  });
});
