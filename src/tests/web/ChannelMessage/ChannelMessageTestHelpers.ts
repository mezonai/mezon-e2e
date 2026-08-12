import { MessagePage } from '@/pages/MessagePage';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, Locator, Page } from '@playwright/test';

const MESSAGE_ITEM = generateE2eSelector('message.item');
const MESSAGE_INPUT = generateE2eSelector('mention.input');

function composer(page: Page): Locator {
  return page.locator(MESSAGE_INPUT);
}

function messagesWith(page: Page, text: string): Locator {
  return page.locator(MESSAGE_ITEM).filter({ hasText: text });
}

async function send(page: Page, text: string): Promise<void> {
  const input = composer(page);
  await input.fill(text);
  await input.press('Enter');
}

type ChannelMessageTestBody = (fixtures: { page: Page }) => Promise<void>;

const channelMessageCases: ChannelMessageTestBody[] = [];

const channelMessageTest = (_title: string, body: ChannelMessageTestBody): void => {
  channelMessageCases.push(body);
};

function defineChannelMessageCases(): void {
  for (const [name, value] of [
    ['empty message', ''],
    ['spaces-only message', '   '],
    ['tabs-only message', '\t\t'],
    ['newlines-only message', '\n\n'],
  ] as const) {
    channelMessageTest(`Does not send ${name}`, async ({ page }) => {
      const before = await page.locator(MESSAGE_ITEM).count();
      await send(page, value);
      await expect(page.locator(MESSAGE_ITEM)).toHaveCount(before);
    });
  }

  channelMessageTest(
    'Does not create duplicate messages when Enter is pressed repeatedly',
    async ({ page }) => {
      const text = `deduplicate-${Date.now()}`;
      const input = composer(page);
      await input.fill(text);
      await input.press('Enter');
      await input.press('Enter');
      await input.press('Enter');
      await expect(messagesWith(page, text)).toHaveCount(1);
    }
  );

  channelMessageTest('Sends a multiline message with Shift+Enter', async ({ page }) => {
    const firstLine = `first-${Date.now()}`;
    const secondLine = `second-${Date.now()}`;
    const input = composer(page);
    await input.fill(firstLine);
    await input.press('Shift+Enter');
    await input.type(secondLine);
    await input.press('Enter');
    const message = messagesWith(page, firstLine).last();
    await expect(message).toContainText(firstLine);
    await expect(message).toContainText(secondLine);
  });

  for (const sample of [
    { name: 'Vietnamese text', text: 'Tin nhắn tiếng Việt có dấu' },
    { name: 'CJK text', text: 'こんにちは世界 你好世界' },
    { name: 'right-to-left text', text: 'مرحبا بالعالم' },
    { name: 'combined emoji', text: 'Family 👨‍👩‍👧‍👦 and skin tone 👍🏽' },
    { name: 'HTML-like text', text: '<script>alert("e2e")</script>' },
    { name: 'quotes and slashes', text: String.raw`quotes ' " / \\` },
  ]) {
    channelMessageTest(`Sends and safely renders ${sample.name}`, async ({ page }) => {
      const uniqueText = `${sample.text} ${Date.now()}`;
      await send(page, uniqueText);
      const message = messagesWith(page, uniqueText).last();
      await expect(message).toBeVisible();
      await expect(message).toContainText(uniqueText);
      await expect(message.locator('script')).toHaveCount(0);
    });
  }

  channelMessageTest(
    'Keeps composer content after Escape when no attachment is selected',
    async ({ page }) => {
      const text = `escape-${Date.now()}`;
      const input = composer(page);
      await input.fill(text);
      await input.press('Escape');
      await expect(input).toContainText(text);
    }
  );

  channelMessageTest('Clears composer after a message is sent', async ({ page }) => {
    const text = `clear-after-send-${Date.now()}`;
    await send(page, text);
    await expect(messagesWith(page, text).last()).toBeVisible();
    await expect(composer(page)).toHaveText('');
  });

  channelMessageTest('Preserves sent content after page reload', async ({ page }) => {
    const text = `reload-${Date.now()}`;
    await send(page, text);
    await expect(messagesWith(page, text).last()).toBeVisible();
    await page.reload();
    await expect(messagesWith(page, text).last()).toBeVisible();
  });

  channelMessageTest('Sends two distinct messages in the original order', async ({ page }) => {
    const stamp = Date.now();
    const first = `order-first-${stamp}`;
    const second = `order-second-${stamp}`;
    await send(page, first);
    await send(page, second);
    const relevant = page
      .locator(MESSAGE_ITEM)
      .filter({ hasText: new RegExp(`order-(first|second)-${stamp}`) });
    await expect(relevant).toHaveCount(2);
    await expect(relevant.nth(0)).toContainText(first);
    await expect(relevant.nth(1)).toContainText(second);
  });

  channelMessageTest('Can edit a message containing emoji', async ({ page }) => {
    const messagePage = new MessagePage(page);
    const original = `edit-emoji-${Date.now()} 😀`;
    const edited = `${original} ✅`;
    await send(page, original);
    const item = messagesWith(page, original).last();
    await messagePage.editMessage(item, edited);
    await expect(messagesWith(page, edited).last()).toBeVisible();
  });

  channelMessageTest('Can delete a message containing special characters', async ({ page }) => {
    const messagePage = new MessagePage(page);
    const text = `delete-${Date.now()} <>&'"`;
    await send(page, text);
    await expect(messagesWith(page, text).last()).toBeVisible();
    await messagePage.deleteLastMessage();
    await expect(messagesWith(page, text)).toHaveCount(0);
  });

  channelMessageTest('Canceling the delete confirmation keeps the message', async ({ page }) => {
    const text = `cancel-delete-${Date.now()}`;
    await send(page, text);
    const item = messagesWith(page, text).last();
    await item.click({ button: 'right' });
    await page.getByText('Delete Message', { exact: true }).last().click();
    await page
      .locator(generateE2eSelector('chat.message_action_modal.confirm_modal.button.cancel'))
      .click();
    await expect(item).toBeVisible();
  });

  channelMessageTest('Canceling an edit keeps the original message', async ({ page }) => {
    const text = `cancel-edit-${Date.now()}`;
    await send(page, text);
    const item = messagesWith(page, text).last();
    await item.click({ button: 'right' });
    await page.getByText('Edit Message', { exact: true }).last().click();
    const editInput = page.locator('div[class*="mention-input-editor"]').first();
    await editInput.fill('this must not be saved');
    await editInput.press('Escape');
    await expect(item).toContainText(text);
  });

  for (const sample of [
    {
      markdown: '**bold message**',
      selector: 'strong, b, [class*="font-bold"], [class*="font-semibold"]',
      expectedText: 'bold message',
    },
    {
      markdown: '`inline code message`',
      selector: 'code, [class*="inline-code"], [class*="inline_code"]',
      expectedText: 'inline code message',
    },
    {
      markdown: '# Header title level 1',
      selector: 'h1, [class*="markdown-h1"], [class*="heading-1"]',
      expectedText: 'Header title level 1',
    },
    {
      markdown: '## Header title level 2',
      selector: 'h2, [class*="markdown-h2"], [class*="heading-2"]',
      expectedText: 'Header title level 2',
    },
    {
      markdown: '```\nconst message = "block code";\n```',
      selector: 'pre, pre code, .code-block, [class*="code-block"], .markdown-code, .hljs',
      expectedText: 'const message = "block code";',
    },
  ]) {
    channelMessageTest(`Renders markdown content as ${sample.selector}`, async ({ page }) => {
      const identity = Date.now().toString();
      const text = `${sample.markdown} ${identity}`;
      await send(page, text);
      const message = messagesWith(page, identity).last();
      await expect(message).toBeVisible();
      const formattedContent = message.locator(sample.selector).filter({
        hasText: sample.expectedText,
      });
      await expect(formattedContent.first()).toBeVisible();
      await expect(formattedContent.first()).toContainText(sample.expectedText);
    });
  }

  channelMessageTest('Renders a plain URL without changing its message text', async ({ page }) => {
    const text = `https://example.com/path?q=e2e-${Date.now()}&lang=vi`;
    await send(page, text);
    const message = messagesWith(page, text).last();
    await expect(message).toContainText(text);
    await expect(message.locator('a[href^="https://example.com/path"]')).toBeVisible();
  });

  channelMessageTest('Renders multiple URLs in one message', async ({ page }) => {
    const stamp = Date.now();
    const text = `https://example.com/${stamp} https://playwright.dev/${stamp}`;
    await send(page, text);
    const message = messagesWith(page, stamp.toString()).last();
    await expect(message.locator('a')).toHaveCount(2);
  });

  channelMessageTest(
    'Does not navigate when clicking malformed URL-like text',
    async ({ page }) => {
      const text = `malformed-${Date.now()} http://[invalid-url`;
      await send(page, text);
      const message = messagesWith(page, text).last();
      await expect(message).toBeVisible();
      await expect(message.locator('a')).toHaveCount(0);
    }
  );

  channelMessageTest(
    'Keeps a draft while opening and closing the pinned-message panel',
    async ({ page }) => {
      const text = `draft-pin-${Date.now()}`;
      const input = composer(page);
      await input.fill(text);
      await page.locator(generateE2eSelector('chat.channel_message.header.button.pin')).click();
      await page.keyboard.press('Escape');
      await expect(input).toContainText(text);
    }
  );

  channelMessageTest(
    'Keeps a draft while opening and closing the member panel',
    async ({ page }) => {
      const text = `draft-member-${Date.now()}`;
      const input = composer(page);
      await input.fill(text);
      await page
        .locator(generateE2eSelector('chat.channel_message.header.button.member'))
        .first()
        .click();
      await page
        .locator(generateE2eSelector('chat.channel_message.header.button.member'))
        .first()
        .click();
      await expect(input).toContainText(text);
    }
  );

  channelMessageTest(
    'Does not send a draft when the page loses and regains focus',
    async ({ page }) => {
      const text = `focus-${Date.now()}`;
      const input = composer(page);
      await input.fill(text);
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await expect(messagesWith(page, text)).toHaveCount(0);
      await expect(input).toContainText(text);
    }
  );

  channelMessageTest(
    'Composer remains usable after sending ten messages sequentially',
    async ({ page }) => {
      const prefix = `burst-${Date.now()}`;
      for (let index = 0; index < 10; index += 1) {
        await send(page, `${prefix}-${index}`);
      }
      await expect(messagesWith(page, prefix)).toHaveCount(10);
      await expect(composer(page)).toBeEditable();
    }
  );
}

defineChannelMessageCases();

export async function runChannelMessageCase(page: Page, caseNumber: number): Promise<void> {
  const body = channelMessageCases[caseNumber - 1];
  if (!body) throw new Error(`Channel message case ${caseNumber} is not defined`);
  await body({ page });
}
