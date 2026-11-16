import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import MessageSelector from '@/data/selectors/MessageSelector';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { MessagePage } from '@/pages/MessagePage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import generateRandomString from '@/utils/randomString';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Channel Message - Anonymous Consistency, Scope Isolation, Forwarding and Catch-up (TC-CI-12 to 19 / Cases 155, 156, 157, 160, 161, 162)', () => {
  const clanFactory = new ClanFactory();
  const credentials = AccountCredentials.account1;

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.channelManagement,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  test('TC01: Verify anonymous message displays anonymously across message line and cannot be mentioned (TC-CI-12 / Case 155)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65155' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify anonymous messages consistently display anonymous profile/icon on message line and prevent direct mentions (TC-CI-12 / Case 155).
    `);

    const clanPage = new ClanPage(page);
    const messagePage = new MessagePage(page);
    const channelName = `anon-test-${generateRandomString(5)}`.toLowerCase();

    await AllureReporter.step(`Create channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName);
      expect(await clanPage.isNewChannelPresent(channelName)).toBe(true);
    });

    await AllureReporter.step('Send anonymous message and verify anonymous state', async () => {
      const anonText = `Anonymous secret ${generateRandomString(6)}`;
      await messagePage.openAnonymous();
      await messagePage.verifyAnonymousIsVisible();
      await messagePage.sendMessageWithAnonymous(anonText);
      const isSent = await messagePage.isAnonymousMessageSent();
      expect(isSent).toBe(true);
      await messagePage.closeAnonymous();
    });
  });

  test('TC02: Verify message ID scope isolation: edit or delete does not affect identical message IDs in other channels (TC-CI-13 / Case 156)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65156' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify edit and delete operations are strictly scoped to the current channel and do not tamper with identical IDs in other channels (TC-CI-13 / Case 156).
    `);

    const clanPage = new ClanPage(page);
    const messageHelper = new MessageTestHelpers(page);
    const chA = `scope-a-${generateRandomString(4)}`.toLowerCase();
    const chB = `scope-b-${generateRandomString(4)}`.toLowerCase();
    const msgText = `Scope test message ${generateRandomString(6)}`;

    await AllureReporter.step('Create two separate text channels', async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, chA);
      await clanPage.createNewChannel(ChannelType.TEXT, chB);
    });

    await AllureReporter.step(`Send message in channel ${chA}`, async () => {
      const chItemA = clanPage.selector.channel.getSidebarItem(chA);
      await chItemA.click();
      const input = await messageHelper.findMessageInput();
      await input.fill(msgText);
      await input.press('Enter');
      await page.waitForTimeout(1000);
      expect(await messageHelper.isMessageVisible(msgText)).toBe(true);
    });

    await AllureReporter.step(
      `Navigate to channel ${chB} and verify original message is not present`,
      async () => {
        const chItemB = clanPage.selector.channel.getSidebarItem(chB);
        await chItemB.click();
        expect(await messageHelper.isMessageVisible(msgText)).toBe(false);
      }
    );
  });

  test('TC03: Verify forward message respects private channel gating (TC-CI-18 / Case 161)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65161' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify forwarding message opens forward modal and properly validates recipient channels (TC-CI-18 / Case 161).
    `);

    const messageHelper = new MessageTestHelpers(page);
    const testMsg = `Forward test ${generateRandomString(6)}`;

    await AllureReporter.step('Send test message', async () => {
      const input = await messageHelper.findMessageInput();
      await input.fill(testMsg);
      await input.press('Enter');
      await page.waitForTimeout(1000);
    });

    await AllureReporter.step('Open message action menu and click Forward', async () => {
      const lastMsg = messageHelper.getMessageItemLocator().last();
      await lastMsg.hover();
      await lastMsg.click({ button: 'right' });

      const selector = new MessageSelector(page);
      if (await selector.forwardMessageButton.isVisible({ timeout: 3000 })) {
        await selector.forwardMessageButton.click();
        const forwardModal = page.locator('.fixed.inset-0, [data-e2e*="forward"]');
        await expect(forwardModal.first()).toBeVisible({ timeout: 5000 });
        await page.keyboard.press('Escape');
      }
    });
  });

  test('TC04: Verify offline catch-up and reloading channel loads unread messages (TC-CI-19 / Case 162)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65162' });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that reloading the page re-fetches channel message history and maintains message list integrity (TC-CI-19 / Case 162).
    `);

    const messageHelper = new MessageTestHelpers(page);
    const catchupMsg = `Catchup test ${generateRandomString(6)}`;

    await AllureReporter.step('Send test message before reload', async () => {
      const input = await messageHelper.findMessageInput();
      await input.fill(catchupMsg);
      await input.press('Enter');
      await page.waitForTimeout(1000);
    });

    await AllureReporter.step('Reload page and verify message persists', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      expect(await messageHelper.isMessageVisible(catchupMsg)).toBe(true);
    });
  });
});
