import { test, expect } from '@playwright/test';
import { DualUserSetup } from '../../utils/dualUserSetup';

const CLAN_CHANNEL_URL =
  'https://dev-mezon.nccsoft.vn/chat/clans/1786228934740807680/channels/1786228934753390593';

test('Dual users chat in clan - edit message test', async ({ browser }) => {
  const session = await DualUserSetup.setupForClanChat(browser, CLAN_CHANNEL_URL);
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

    try {
      await userA.sendMessageWithMention(uniqueMessage);
    } catch (e) {}

    await pageB.waitForTimeout(3000);
    await userB.findAndReplyToMessage(uniqueMessage);

    await pageA.waitForTimeout(5000);

    try {
      await pageA.waitForTimeout(2000);
      await userA.findAndEditMessage(uniqueMessage, editedMessage);
    } catch (error) {}

    await pageA.waitForTimeout(3000);
    await pageB.waitForTimeout(3000);

    await userB.openInboxMentions();
    await pageB.waitForTimeout(3000);

    const inboxPanel = pageB
      .locator('[data-testid="inbox-panel"], .inbox-panel, [class*="inbox"], [class*="mentions"]')
      .first();
    if (!(await inboxPanel.isVisible({ timeout: 5000 }))) {
      const inboxButton = pageB.locator('button[title="Inbox"]').first();
      if (await inboxButton.isVisible()) {
        await inboxButton.click();
        await pageB.waitForTimeout(2000);
      }
    }

    const expectedEditedText = `@kien.trinh  ${uniqueMessage} ${editedMessage}`;
    let foundEditedInInbox = await userB.checkFirstInboxMessageContains(expectedEditedText);
    if (!foundEditedInInbox) {
      const inboxMessages = await userB.findInboxMessages(uniqueMessage);
      const count = await inboxMessages.count();
      for (let i = 0; i < Math.min(count, 15); i += 1) {
        const txt = (await inboxMessages.nth(i).textContent()) || '';
        if (txt.includes(expectedEditedText)) {
          foundEditedInInbox = true;
          break;
        }
      }
    }
    expect(foundEditedInInbox).toBe(true);

    await pageA.screenshot({ path: 'test-results/dual-chat-userA.png', fullPage: true });
    await pageB.screenshot({ path: 'test-results/dual-chat-userB.png', fullPage: true });

    await pageB.waitForTimeout(30000);
  } finally {
    await session.cleanup();
  }
});
