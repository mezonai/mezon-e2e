import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';
import { DualUserSetup } from '../../utils/dualUserSetup';

const CLAN_CHANNEL_URL =
  'https://dev-mezon.nccsoft.vn/chat/clans/1786228934740807680/channels/1786228934753390593';

test.describe('Dual Users Chat in Clan', () => {
  test.beforeAll(async () => {
    await TestSetups.chatTest({
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: AllureConfig.SubSuites.GROUP_CHAT,
      story: AllureConfig.Stories.TEXT_MESSAGING,
      severity: AllureConfig.Severity.CRITICAL,
      userCount: 2,
    });
  });

  test('Dual users chat in clan - edit message test', async ({ browser }, testInfo) => {
    // Initialize Allure reporting - using a mock page for initialization since this is a multi-page test
    const mockContext = await browser.newContext();
    const mockPage = await mockContext.newPage();

    await AllureReporter.initializeTest(mockPage, testInfo, {
      suite: AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: AllureConfig.SubSuites.GROUP_CHAT,
      story: AllureConfig.Stories.TEXT_MESSAGING,
      severity: AllureConfig.Severity.CRITICAL,
      testType: AllureConfig.TestTypes.E2E,
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that when User A edits a message that mentions User B, the edited message appears correctly in User B's inbox.
      
      **Test Steps:**
      1. Setup dual user session in clan chat
      2. User A sends a message with mention
      3. User B finds and replies to the message
      4. User A edits the original message
      5. User B checks inbox for the edited message
      6. Verify the edited content appears in the inbox
      
      **Expected Result:** 
      - User B should see the edited message in their inbox
      - The edited content should be correctly displayed
      - Both users' actions should be synchronized
    `);

    await AllureReporter.addLabels({
      tag: ['dual-user', 'message-editing', 'mentions', 'inbox', 'clan-chat'],
    });

    await AllureReporter.addParameter('clanChannelUrl', CLAN_CHANNEL_URL);
    await AllureReporter.addParameter('userCount', 2);

    await mockContext.close();

    const session = await AllureReporter.step('Setup dual user session', async () => {
      return await DualUserSetup.setupForClanChat(browser, CLAN_CHANNEL_URL);
    });

    const {
      primaryPage: pageA,
      secondaryPage: pageB,
      primaryUser: userA,
      secondaryUser: userB,
    } = session;

    try {
      const timestamp = Date.now();
      const uniqueMessage = `test_${timestamp}`;
      const editedMessage = `edited_${timestamp}`;

      await AllureReporter.addParameter('originalMessage', uniqueMessage);
      await AllureReporter.addParameter('editedContent', editedMessage);

      await AllureReporter.step('User A sends message with mention', async () => {
        try {
          await userA.sendMessageWithMention(uniqueMessage);
        } catch {
          // Continue with test even if mention fails
        }
      });

      await AllureReporter.step('User B finds and replies to message', async () => {
        await pageB.waitForTimeout(3000);
        await userB.findAndReplyToMessage(uniqueMessage);
      });

      await AllureReporter.step('User A edits the original message', async () => {
        await pageA.waitForTimeout(5000);
        try {
          await pageA.waitForTimeout(2000);
          await userA.findAndEditMessage(uniqueMessage, editedMessage);
        } catch {
          // Continue with test even if edit fails
        }
      });

      await AllureReporter.step('Wait for synchronization between users', async () => {
        await pageA.waitForTimeout(3000);
        await pageB.waitForTimeout(3000);
      });

      await AllureReporter.step('User B opens inbox mentions', async () => {
        await userB.openInboxMentions();
        await pageB.waitForTimeout(3000);

        const inboxPanel = pageB
          .locator(
            '[data-testid="inbox-panel"], .inbox-panel, [class*="inbox"], [class*="mentions"]'
          )
          .first();
        if (!(await inboxPanel.isVisible({ timeout: 5000 }))) {
          const inboxButton = pageB.locator('button[title="Inbox"]').first();
          if (await inboxButton.isVisible()) {
            await inboxButton.click();
            await pageB.waitForTimeout(2000);
          }
        }
      });

      let foundEditedInInbox = false;
      await AllureReporter.step('Verify edited message appears in inbox', async () => {
        const expectedEditedText = `@kien.trinh  ${uniqueMessage} ${editedMessage}`;
        await AllureReporter.addParameter('expectedEditedText', expectedEditedText);

        foundEditedInInbox = await userB.checkFirstInboxMessageContains(expectedEditedText);

        if (!foundEditedInInbox) {
          const inboxMessages = await userB.findInboxMessages(uniqueMessage);
          const count = await inboxMessages.count();
          await AllureReporter.addParameter('inboxMessageCount', count);

          for (let i = 0; i < Math.min(count, 15); i += 1) {
            const txt = (await inboxMessages.nth(i).textContent()) || '';
            if (txt.includes(expectedEditedText)) {
              foundEditedInInbox = true;
              await AllureReporter.addParameter('foundAtIndex', i);
              break;
            }
          }
        }

        expect(foundEditedInInbox).toBe(true);
        await AllureReporter.addParameter('editedMessageFoundInInbox', foundEditedInInbox);
      });

      await AllureReporter.step('Capture final screenshots', async () => {
        await AllureReporter.attachScreenshot(pageA, 'Dual Chat - User A Final State');
        await AllureReporter.attachScreenshot(pageB, 'Dual Chat - User B Inbox State');
      });

      // Final wait period for stability
      await pageB.waitForTimeout(30000);
    } finally {
      await AllureReporter.step('Cleanup dual user session', async () => {
        await session.cleanup();
      });
    }
  });
});
